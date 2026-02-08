import "dotenv/config";
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@Teramisu/auth";
import {
	db,
	user,
	product,
	order,
	orderItem,
	payment,
	address,
	category,
	wishlist,
	review,
	coupon,
	couponUsage,
	notification,
} from "@Teramisu/db";
import { eq, desc, sql, and, gte, inArray, lt, asc } from "drizzle-orm";

const isProd = process.env.NODE_ENV === "production";

const requiredEnv = ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "DATABASE_URL"] as const;
for (const key of requiredEnv) {
	if (!process.env[key]) {
		throw new Error(`${key} is required`);
	}
}

const adminBootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
const adminBootstrapAllowExisting = process.env.ADMIN_BOOTSTRAP_ALLOW_EXISTING === "true";

// Omise configuration
const omiseSecretKey = process.env.OMISE_SECRET_KEY;
const omisePublicKey = process.env.OMISE_PUBLIC_KEY;

const corsOrigins = (process.env.CORS_ORIGIN || "")
	.split(",")
	.map((origin) => origin.trim())
	.filter(Boolean);

if (isProd && corsOrigins.length === 0) {
	throw new Error("CORS_ORIGIN is required in production");
}

const port = Number(process.env.PORT || 3000);
if (!Number.isFinite(port)) {
	throw new Error("PORT must be a number");
}

type RateLimitEntry = {
	count: number;
	resetAt: number;
};

const rateLimitWindowMs = 60_000;
const rateLimitMax = 100;
const rateLimit = new Map<string, RateLimitEntry>();

const getClientIp = (request: Request): string => {
	const forwardedFor = request.headers.get("x-forwarded-for");
	if (forwardedFor) {
		return forwardedFor.split(",")[0].trim();
	}

	const realIp = request.headers.get("x-real-ip");
	if (realIp) {
		return realIp.trim();
	}

	return "unknown";
};

// Helper function to generate IDs
const generateId = (prefix: string) =>
	`${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

// Helper function to create Omise charge (mock for now if no key)
async function createOmisePromptPayCharge(amount: number, orderId: string) {
	// If Omise is not configured, return mock data for development
	if (!omiseSecretKey) {
		console.log("[Mock] Creating PromptPay charge for", amount, "THB");
		const mockExpiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes
		return {
			id: `chrg_mock_${Date.now()}`,
			source: {
				id: `src_mock_${Date.now()}`,
				scannable_code: {
					image: {
						download_uri: `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=promptpay_mock_${orderId}_${amount}`,
					},
				},
			},
			status: "pending",
			expires_at: mockExpiresAt.toISOString(),
		};
	}

	// Real Omise API call
	const Omise = (await import("omise")).default;
	const omise = Omise({
		secretKey: omiseSecretKey,
		omiseVersion: "2019-05-29",
	});

	// Create a PromptPay source
	const source = await omise.sources.create({
		type: "promptpay",
		amount: Math.round(amount * 100), // Convert to satang
		currency: "thb",
	});

	// Create a charge
	const charge = await omise.charges.create({
		amount: Math.round(amount * 100),
		currency: "thb",
		source: source.id,
		metadata: { orderId },
	});

	return charge;
}

const app = new Elysia()
	.use(
		cors({
			origin: corsOrigins.length
				? corsOrigins
				: ["http://localhost:3000", "http://localhost:3001"],
			credentials: true,
		}),
	)
	.onBeforeHandle(({ request, set }) => {
		const ip = getClientIp(request);
		const now = Date.now();
		const entry = rateLimit.get(ip);

		if (!entry || entry.resetAt <= now) {
			rateLimit.set(ip, { count: 1, resetAt: now + rateLimitWindowMs });
			return;
		}

		entry.count += 1;

		if (entry.count > rateLimitMax) {
			set.status = 429;
			return { error: "Too many requests" };
		}
	})
	.onError(({ code, error, set }) => {
		if (!isProd) {
			console.error(`[${code}]`, error);
		} else {
			console.error(`[${code}]`, error.message);
		}

		if (code === "VALIDATION") {
			set.status = 400;
			return { error: "Invalid request" };
		}

		set.status = 500;
		return { error: "Internal server error" };
	})
	.get("/", () => "Welcome to Teramisu Server!")
	.all("/api/auth/*", ({ request }) => {
		return auth.handler(request);
	})
	.group("/api", (api) =>
		api
			.post(
				"/cart/sync",
				async ({ body }) => {
					const conflicts: Array<{
						id: string;
						type: "NOT_FOUND" | "OUT_OF_STOCK" | "QTY_ADJUSTED" | "PRICE_CHANGED";
						message: string;
						previousQuantity?: number;
						newQuantity?: number;
						previousPrice?: number;
						newPrice?: number;
					}> = [];

					const items = body.items ?? [];
					const productIds = items.map((item) => item.id);

					if (productIds.length === 0) {
						return { items: [], conflicts: [], total: 0, updatedAt: Date.now() };
					}

					const products = await db.query.product.findMany({
						where: and(eq(product.isActive, true), inArray(product.id, productIds)),
					});

					const productsById = new Map(products.map((p) => [p.id, p]));
					const responseItems: Array<{
						id: string;
						name: string;
						image: string;
						price: number;
						quantity: number;
						maxQuantity: number;
					}> = [];

					for (const item of items) {
						const prod = productsById.get(item.id);
						if (!prod) {
							conflicts.push({
								id: item.id,
								type: "NOT_FOUND",
								message: "Product not found",
								previousQuantity: item.quantity,
								newQuantity: 0,
							});
							continue;
						}

						const currentPrice = parseFloat(String(prod.price));
						if (currentPrice !== item.clientPrice) {
							conflicts.push({
								id: item.id,
								type: "PRICE_CHANGED",
								message: "Price updated",
								previousPrice: item.clientPrice,
								newPrice: currentPrice,
							});
						}

						const maxQuantity = prod.stock ?? 0;
						if (maxQuantity <= 0) {
							conflicts.push({
								id: item.id,
								type: "OUT_OF_STOCK",
								message: "Out of stock",
								previousQuantity: item.quantity,
								newQuantity: 0,
							});
							continue;
						}

						const nextQuantity = Math.max(1, Math.min(item.quantity, maxQuantity));
						if (nextQuantity !== item.quantity) {
							conflicts.push({
								id: item.id,
								type: "QTY_ADJUSTED",
								message: "Quantity adjusted to available stock",
								previousQuantity: item.quantity,
								newQuantity: nextQuantity,
							});
						}

						responseItems.push({
							id: prod.id,
							name: prod.name,
							image: prod.image ?? "https://via.placeholder.com/300",
							price: currentPrice,
							quantity: nextQuantity,
							maxQuantity,
						});
					}

					const total = responseItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

					return {
						items: responseItems,
						conflicts,
						total,
						updatedAt: Date.now(),
					};
				},
				{
					body: t.Object({
						items: t.Array(
							t.Object({
								id: t.String(),
								quantity: t.Number(),
								clientPrice: t.Number(),
							}),
						),
					}),
				},
			)
			.group("/products", (p) =>
				p
					.get("/", async () => {
						const products = await db.query.product.findMany({
							where: eq(product.isActive, true),
							orderBy: [desc(product.createdAt)],
						});

						const formattedProducts = products.map((prod) => ({
							id: prod.id,
							name: prod.name,
							description: prod.description ?? "",
							price: parseFloat(String(prod.price)),
							category: prod.category ?? "Uncategorized",
							stock: prod.stock,
							image: prod.image ?? "https://via.placeholder.com/300",
							availability:
								prod.stock === 0
									? "out"
									: prod.stock < 10
										? "low"
										: "in",
						}));

						return { products: formattedProducts };
					})
					.get(
						"/:id",
						async ({ params, set }) => {
							const prod = await db.query.product.findFirst({
								where: and(eq(product.id, params.id), eq(product.isActive, true)),
							});

							if (!prod) {
								set.status = 404;
								return { error: "Product not found" };
							}

							return {
								id: prod.id,
								name: prod.name,
								description: prod.description ?? "",
								price: parseFloat(String(prod.price)),
								category: prod.category ?? "Uncategorized",
								stock: prod.stock,
								image: prod.image ?? "https://via.placeholder.com/300",
								availability:
									prod.stock === 0
										? "out"
									: prod.stock < 10
										? "low"
										: "in",
							};
						},
						{ params: t.Object({ id: t.String() }) },
					)
					.get(
						"/:id/reviews",
						async ({ params }) => {
							const reviews = await db.query.review.findMany({
								where: and(eq(review.productId, params.id), eq(review.isApproved, true)),
								orderBy: [desc(review.createdAt)],
								with: {
									user: true,
								},
							});

							const avgRating =
								reviews.length > 0
									? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
									: 0;

							return {
								reviews: reviews.map((r) => ({
									id: r.id,
									rating: r.rating,
									title: r.title,
									comment: r.comment,
									isVerifiedPurchase: r.isVerifiedPurchase,
									helpfulCount: r.helpfulCount,
									createdAt: r.createdAt,
									user: {
										name: r.user?.name ?? "Anonymous",
										image: r.user?.image,
									},
								})),
								avgRating: Math.round(avgRating * 10) / 10,
								totalReviews: reviews.length,
							};
						},
						{ params: t.Object({ id: t.String() }) },
					),
			)
			// Categories API
			.group("/categories", (c) =>
				c.get("/", async () => {
					const categories = await db.query.category.findMany({
						where: eq(category.isActive, true),
						orderBy: [asc(category.sortOrder), asc(category.name)],
					});

					return categories;
				}),
			)
			.derive(async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				return { session };
			})
			// Checkout API
			.group("/checkout", (co) =>
				co.post(
					"/create-order",
					async ({ session, set, body }) => {
						if (!session?.user) {
							set.status = 401;
							return { error: "Unauthorized" };
						}

						const { items, shippingAddress, shippingCost } = body;

						if (!items || items.length === 0) {
							set.status = 400;
							return { error: "ไม่มีสินค้าในตะกร้า" };
						}

						// Validate products and stock
						const productsMap: Record<string, any> = {};
						for (const it of items) {
							const prod = await db.query.product.findFirst({
								where: eq(product.id, it.productId),
							});

							if (!prod || !prod.isActive) {
								set.status = 400;
								return { error: `ไม่พบสินค้า: ${it.productId}` };
							}

							if (prod.stock < it.quantity) {
								set.status = 400;
								return { error: `สินค้า ${prod.name} มีไม่เพียงพอ` };
							}

							productsMap[it.productId] = prod;
						}

						// Calculate total
						let subtotal = 0;
						for (const it of items) {
							const p = productsMap[it.productId];
							subtotal += Number(String(p.price)) * Number(it.quantity);
						}

						const total = subtotal + (shippingCost || 0);
						const orderId = generateId("ord");
						const paymentId = generateId("pay");

						// Create order and payment in transaction
						await db.transaction(async (tx) => {
							// Create order
							await tx.insert(order).values({
								id: orderId,
								userId: session.user.id,
								status: "pending" as any,
								totalAmount: total.toFixed(2),
								shippingAddress,
							});

							// Create order items and update stock
							for (const it of items) {
								const prod = productsMap[it.productId];
								await tx.insert(orderItem).values({
									id: generateId("oi"),
									orderId,
									productId: it.productId,
									quantity: it.quantity,
									priceAtPurchase: String(prod.price),
								});

								await tx
									.update(product)
									.set({ stock: (prod.stock || 0) - it.quantity })
									.where(eq(product.id, it.productId));
							}

							// Create Omise PromptPay charge
							const charge = await createOmisePromptPayCharge(total, orderId);

							// Create payment record
							await tx.insert(payment).values({
								id: paymentId,
								orderId,
								method: "promptpay" as any,
								status: "pending" as any,
								amount: total.toFixed(2),
								currency: "THB",
								omiseChargeId: charge.id,
								omiseSourceId: charge.source?.id,
								qrCodeUrl: charge.source?.scannable_code?.image?.download_uri,
								expiresAt: charge.expires_at ? new Date(charge.expires_at) : new Date(Date.now() + 15 * 60 * 1000),
							});
						});

						return { orderId, paymentId };
					},
					{
						body: t.Object({
							items: t.Array(
								t.Object({
									productId: t.String(),
									quantity: t.Number(),
								}),
							),
							shippingAddress: t.String(),
							shippingCost: t.Optional(t.Number()),
						}),
					},
				),
			)
			// Payments API
			.group("/payments", (pay) =>
				pay
					.get(
						"/:id",
						async ({ session, params, set }) => {
							if (!session?.user) {
								set.status = 401;
								return { error: "Unauthorized" };
							}

							const paymentRecord = await db.query.payment.findFirst({
								where: eq(payment.id, params.id),
								with: {
									order: true,
								},
							});

							if (!paymentRecord) {
								set.status = 404;
								return { error: "Payment not found" };
							}

							// Check if user owns this payment
							if (paymentRecord.order?.userId !== session.user.id) {
								set.status = 403;
								return { error: "Forbidden" };
							}

							return {
								id: paymentRecord.id,
								orderId: paymentRecord.orderId,
								status: paymentRecord.status,
								amount: paymentRecord.amount,
								method: paymentRecord.method,
								qrCodeUrl: paymentRecord.qrCodeUrl,
								expiresAt: paymentRecord.expiresAt?.toISOString(),
							};
						},
						{ params: t.Object({ id: t.String() }) },
					)
					.post(
						"/webhook",
						async ({ body, request, set }) => {
							// Verify Omise webhook signature (in production)
							// For now, just process the event

							const event = body as any;

							if (event.key === "charge.complete") {
								const chargeId = event.data?.id;
								const status = event.data?.status;

								if (chargeId) {
									const paymentRecord = await db.query.payment.findFirst({
										where: eq(payment.omiseChargeId, chargeId),
									});

									if (paymentRecord) {
										const newStatus =
											status === "successful" ? "successful" : "failed";

										await db
											.update(payment)
											.set({
												status: newStatus as any,
												paidAt: status === "successful" ? new Date() : null,
												failedAt: status !== "successful" ? new Date() : null,
											})
											.where(eq(payment.id, paymentRecord.id));

										// Update order status if payment successful
										if (status === "successful") {
											await db
												.update(order)
												.set({ status: "approved" as any, approvedAt: new Date() })
												.where(eq(order.id, paymentRecord.orderId));
										}
									}
								}
							}

							return { received: true };
						},
						{
							body: t.Object({}),
						},
					),
			)
			.group("/user", (u) =>
				u
					.get("/profile", async ({ session, set }) => {
						if (!session?.user) {
							set.status = 401;
							return { error: "Unauthorized" };
						}
	
						const userData = await db.query.user.findFirst({
							where: eq(user.id, session.user.id),
						});
	
						if (!userData) {
							set.status = 404;
							return { error: "User not found" };
						}
	
						return userData;
					})
					.patch(
						"/profile",
						async ({ session, set, body }) => {
							if (!session?.user) {
								set.status = 401;
								return { error: "Unauthorized" };
							}
	
							const { name, image } = body;
	
							await db
								.update(user)
								.set({ name, image })
								.where(eq(user.id, session.user.id));
	
							return { success: true };
						},
						{
							body: t.Object({
								name: t.Optional(t.String()),
								image: t.Optional(t.String()),
							}),
						},
					)
					// User Addresses
					.group("/addresses", (addr) =>
						addr
							.get("/", async ({ session, set }) => {
								if (!session?.user) {
									set.status = 401;
									return { error: "Unauthorized" };
								}

								const addresses = await db.query.address.findMany({
									where: eq(address.userId, session.user.id),
									orderBy: [desc(address.isDefault), desc(address.createdAt)],
								});

								return addresses;
							})
							.post(
								"/",
								async ({ session, set, body }) => {
									if (!session?.user) {
										set.status = 401;
										return { error: "Unauthorized" };
									}

									const id = generateId("addr");

									// If this is the first address or isDefault is true, make it default
									if (body.isDefault) {
										await db
											.update(address)
											.set({ isDefault: false })
											.where(eq(address.userId, session.user.id));
									}

									await db.insert(address).values({
										id,
										userId: session.user.id,
										...body,
									});

									return { success: true, id };
								},
								{
									body: t.Object({
										label: t.Optional(t.String()),
										recipientName: t.String(),
										phone: t.String(),
										addressLine1: t.String(),
										addressLine2: t.Optional(t.String()),
										subdistrict: t.Optional(t.String()),
										district: t.String(),
										province: t.String(),
										postalCode: t.String(),
										isDefault: t.Optional(t.Boolean()),
									}),
								},
							)
							.patch(
								"/:id",
								async ({ session, params, set, body }) => {
									if (!session?.user) {
										set.status = 401;
										return { error: "Unauthorized" };
									}

									const existing = await db.query.address.findFirst({
										where: and(
											eq(address.id, params.id),
											eq(address.userId, session.user.id),
										),
									});

									if (!existing) {
										set.status = 404;
										return { error: "Address not found" };
									}

									if (body.isDefault) {
										await db
											.update(address)
											.set({ isDefault: false })
											.where(eq(address.userId, session.user.id));
									}

									await db.update(address).set(body).where(eq(address.id, params.id));

									return { success: true };
								},
								{
									params: t.Object({ id: t.String() }),
									body: t.Object({
										label: t.Optional(t.String()),
										recipientName: t.Optional(t.String()),
										phone: t.Optional(t.String()),
										addressLine1: t.Optional(t.String()),
										addressLine2: t.Optional(t.String()),
										subdistrict: t.Optional(t.String()),
										district: t.Optional(t.String()),
										province: t.Optional(t.String()),
										postalCode: t.Optional(t.String()),
										isDefault: t.Optional(t.Boolean()),
									}),
								},
							)
							.delete(
								"/:id",
								async ({ session, params, set }) => {
									if (!session?.user) {
										set.status = 401;
										return { error: "Unauthorized" };
									}

									const existing = await db.query.address.findFirst({
										where: and(
											eq(address.id, params.id),
											eq(address.userId, session.user.id),
										),
									});

									if (!existing) {
										set.status = 404;
										return { error: "Address not found" };
									}

									await db.delete(address).where(eq(address.id, params.id));

									return { success: true };
								},
								{ params: t.Object({ id: t.String() }) },
							),
					)
					// User Wishlist
					.group("/wishlist", (wl) =>
						wl
							.get("/", async ({ session, set }) => {
								if (!session?.user) {
									set.status = 401;
									return { error: "Unauthorized" };
								}

								const items = await db.query.wishlist.findMany({
									where: eq(wishlist.userId, session.user.id),
									orderBy: [desc(wishlist.createdAt)],
									with: {
										product: true,
									},
								});

								return items.map((item) => ({
									id: item.id,
									productId: item.productId,
									createdAt: item.createdAt,
									product: item.product
										? {
												id: item.product.id,
												name: item.product.name,
												price: parseFloat(String(item.product.price)),
												image: item.product.image,
												stock: item.product.stock,
												isActive: item.product.isActive,
											}
										: null,
								}));
							})
							.post(
								"/",
								async ({ session, set, body }) => {
									if (!session?.user) {
										set.status = 401;
										return { error: "Unauthorized" };
									}

									// Check if already in wishlist
									const existing = await db.query.wishlist.findFirst({
										where: and(
											eq(wishlist.userId, session.user.id),
											eq(wishlist.productId, body.productId),
										),
									});

									if (existing) {
										return { success: true, id: existing.id };
									}

									const id = generateId("wl");
									await db.insert(wishlist).values({
										id,
										userId: session.user.id,
										productId: body.productId,
									});

									return { success: true, id };
								},
								{
									body: t.Object({
										productId: t.String(),
									}),
								},
							)
							.delete(
								"/:productId",
								async ({ session, params, set }) => {
									if (!session?.user) {
										set.status = 401;
										return { error: "Unauthorized" };
									}

									await db
										.delete(wishlist)
										.where(
											and(
												eq(wishlist.userId, session.user.id),
												eq(wishlist.productId, params.productId),
											),
										);

									return { success: true };
								},
								{ params: t.Object({ productId: t.String() }) },
							),
					)
					// User Notifications
					.group("/notifications", (notif) =>
						notif
							.get("/", async ({ session, set }) => {
								if (!session?.user) {
									set.status = 401;
									return { error: "Unauthorized" };
								}

								const notifications = await db.query.notification.findMany({
									where: eq(notification.userId, session.user.id),
									orderBy: [desc(notification.createdAt)],
									limit: 50,
								});

								const unreadCount = notifications.filter((n) => !n.isRead).length;

								return { notifications, unreadCount };
							})
							.patch(
								"/:id/read",
								async ({ session, params, set }) => {
									if (!session?.user) {
										set.status = 401;
										return { error: "Unauthorized" };
									}

									await db
										.update(notification)
										.set({ isRead: true, readAt: new Date() })
										.where(
											and(
												eq(notification.id, params.id),
												eq(notification.userId, session.user.id),
											),
										);

									return { success: true };
								},
								{ params: t.Object({ id: t.String() }) },
							)
							.post(
								"/read-all",
								async ({ session, set }) => {
									if (!session?.user) {
										set.status = 401;
										return { error: "Unauthorized" };
									}

									await db
										.update(notification)
										.set({ isRead: true, readAt: new Date() })
										.where(eq(notification.userId, session.user.id));

									return { success: true };
								},
							),
					)
					.post(
						"/orders",
						async ({ session, set, body }) => {
							if (!session?.user) {
								set.status = 401;
								return { error: "Unauthorized" };
							}
	
							const { items, shippingAddress, notes } = body;
	
							if (!items || !Array.isArray(items) || items.length === 0) {
								set.status = 400;
								return { error: "Invalid items" };
							}
	
							// load products and validate stock
							const productsMap: Record<string, any> = {};
							for (const it of items) {
								const prod = await db.query.product.findFirst({
									where: eq(product.id, it.productId),
								});
	
								if (!prod || !prod.isActive) {
									set.status = 400;
									return { error: `Product not found or inactive: ${it.productId}` };
								}
	
								if (prod.stock < it.quantity) {
									set.status = 400;
									return { error: `Insufficient stock for product: ${it.productId}` };
								}
	
								productsMap[it.productId] = prod;
							}
	
							// calculate total
							let total = 0;
							for (const it of items) {
								const p = productsMap[it.productId];
								total += Number(String(p.price)) * Number(it.quantity);
							}
	
							const orderId = generateId("ord");
	
							// transactional insert: order, order items, update product stock
							await db.transaction(async (tx) => {
								await tx.insert(order).values({
									id: orderId,
									userId: session.user.id,
									status: "pending" as any,
									totalAmount: total.toFixed(2).toString(),
									shippingAddress,
									notes,
								});
	
								for (const it of items) {
									const prod = productsMap[it.productId];
									const oiId = generateId("oi");
									await tx.insert(orderItem).values({
										id: oiId,
										orderId,
										productId: it.productId,
										quantity: it.quantity,
										priceAtPurchase: String(prod.price),
									});
	
									await tx
										.update(product)
										.set({ stock: (prod.stock || 0) - Number(it.quantity) })
										.where(eq(product.id, it.productId));
								}
							});
	
							return { success: true, id: orderId };
						},
						{
							body: t.Object({
								items: t.Array(
									t.Object({
										productId: t.String(),
										quantity: t.Number(),
									}),
								),
								shippingAddress: t.Optional(t.String()),
								notes: t.Optional(t.String()),
							}),
						},
					)
					.get("/orders", async ({ session, set }) => {
						if (!session?.user) {
							set.status = 401;
							return { error: "Unauthorized" };
						}
	
						const orders = await db.query.order.findMany({
							where: eq(order.userId, session.user.id),
							orderBy: [desc(order.createdAt)],
							with: {
								items: {
									with: {
										product: true,
									},
								},
							},
						});
	
						return orders;
					})
					.get(
						"/orders/:id",
						async ({ session, params, set }) => {
							if (!session?.user) {
								set.status = 401;
								return { error: "Unauthorized" };
							}
	
							const ord = await db.query.order.findFirst({
								where: and(eq(order.id, params.id), eq(order.userId, session.user.id)),
								with: {
									items: {
										with: {
											product: true,
										},
									},
								},
							});
	
							if (!ord) {
								set.status = 404;
								return { error: "Order not found" };
							}
	
							return ord;
						},
						{ params: t.Object({ id: t.String() }) },
					)
					// Submit review
					.post(
						"/reviews",
						async ({ session, set, body }) => {
							if (!session?.user) {
								set.status = 401;
								return { error: "Unauthorized" };
							}

							// Check if user already reviewed
							const existingReview = await db.query.review.findFirst({
								where: and(
									eq(review.userId, session.user.id),
									eq(review.productId, body.productId),
								),
							});

							if (existingReview) {
								set.status = 400;
								return { error: "คุณได้รีวิวสินค้านี้แล้ว" };
							}

							// Check if user has purchased this product - only users who bought can review
							// Find all delivered orders for this user
							const userOrders = await db.query.order.findMany({
								where: and(
									eq(order.userId, session.user.id),
									eq(order.status, "delivered" as any),
								),
								with: {
									items: true,
								},
							});

							// Check if any of these orders contain the product
							const purchaseCheck = userOrders.find((ord) =>
								ord.items.some((item) => item.productId === body.productId),
							);

							// Verify that user has purchased and order is delivered
							if (!purchaseCheck) {
								set.status = 403;
								return { error: "คุณต้องซื้อสินค้านี้และได้รับสินค้าแล้วเท่านั้นจึงจะสามารถรีวิวได้" };
							}

							const id = generateId("rev");
							await db.insert(review).values({
								id,
								userId: session.user.id,
								productId: body.productId,
								rating: body.rating,
								title: body.title,
								comment: body.comment,
								isVerifiedPurchase: true,
								orderId: purchaseCheck.id,
							});

							return { success: true, id };
						},
						{
							body: t.Object({
								productId: t.String(),
								rating: t.Number({ minimum: 1, maximum: 5 }),
								title: t.Optional(t.String()),
								comment: t.Optional(t.String()),
							}),
						},
					),
			)
			// Coupons validation
			.group("/coupons", (coup) =>
				coup.post(
					"/validate",
					async ({ session, set, body }) => {
						if (!session?.user) {
							set.status = 401;
							return { error: "Unauthorized" };
						}

						const { code, cartTotal } = body;
						const now = new Date();

						const coup = await db.query.coupon.findFirst({
							where: and(eq(coupon.code, code.toUpperCase()), eq(coupon.isActive, true)),
						});

						if (!coup) {
							set.status = 404;
							return { error: "ไม่พบคูปองนี้" };
						}

						if (coup.validFrom > now) {
							set.status = 400;
							return { error: "คูปองยังไม่เริ่มใช้งาน" };
						}

						if (coup.validUntil < now) {
							set.status = 400;
							return { error: "คูปองหมดอายุแล้ว" };
						}

						if (coup.maxUses && coup.usedCount >= coup.maxUses) {
							set.status = 400;
							return { error: "คูปองถูกใช้งานครบจำนวนแล้ว" };
						}

						if (coup.minPurchaseAmount && cartTotal < parseFloat(coup.minPurchaseAmount)) {
							set.status = 400;
							return {
								error: `ยอดขั้นต่ำสำหรับคูปองนี้คือ ฿${parseFloat(coup.minPurchaseAmount).toLocaleString()}`,
							};
						}

						// Check user usage
						const userUsage = await db.query.couponUsage.findMany({
							where: and(
								eq(couponUsage.couponId, coup.id),
								eq(couponUsage.userId, session.user.id),
							),
						});

						if (coup.maxUsesPerUser && userUsage.length >= coup.maxUsesPerUser) {
							set.status = 400;
							return { error: "คุณใช้คูปองนี้ครบจำนวนแล้ว" };
						}

						// Calculate discount
						let discount = 0;
						if (coup.type === "percentage") {
							discount = (cartTotal * parseFloat(coup.value)) / 100;
							if (coup.maxDiscountAmount) {
								discount = Math.min(discount, parseFloat(coup.maxDiscountAmount));
							}
						} else if (coup.type === "fixed_amount") {
							discount = parseFloat(coup.value);
						}

						return {
							valid: true,
							coupon: {
								id: coup.id,
								code: coup.code,
								name: coup.name,
								type: coup.type,
								value: coup.value,
							},
							discount: Math.round(discount * 100) / 100,
						};
					},
					{
						body: t.Object({
							code: t.String(),
							cartTotal: t.Number(),
						}),
					},
				),
			)
			.group("/admin", (a) =>
				a
					.post(
						"/bootstrap",
						async ({ body, request, set }) => {
							if (!adminBootstrapToken) {
								set.status = 403;
								return { error: "Admin bootstrap not configured" };
							}

							const token = request.headers.get("x-admin-bootstrap-token");
							if (!token || token !== adminBootstrapToken) {
								set.status = 401;
								return { error: "Invalid bootstrap token" };
							}

							const existingAdmins = await db
								.select({ count: sql<number>`count(*)::int` })
								.from(user)
								.where(eq(user.role, "admin"));

							if (!adminBootstrapAllowExisting && (existingAdmins[0]?.count ?? 0) > 0) {
								set.status = 409;
								return { error: "Admin already exists" };
							}

							const targetUser = await db.query.user.findFirst({
								where: eq(user.email, body.email),
							});

							if (!targetUser) {
								set.status = 404;
								return { error: "User not found" };
							}

							await db.update(user).set({ role: "admin" }).where(eq(user.id, targetUser.id));
							return { success: true };
						},
						{
							body: t.Object({
								email: t.String(),
							}),
						},
					)
					.onBeforeHandle(({ session, set }) => {
						if (!session?.user || session.user.role !== "admin") {
							set.status = 401;
							return { error: "Unauthorized" };
						}
					})
					.get("/metrics", async () => {
						const totalMembers = await db
							.select({ count: sql<number>`count(*)::int` })
							.from(user);

						const now = new Date();
						const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

						const monthlyRevenue = await db
							.select({
								sum: sql<string>`coalesce(sum(${order.totalAmount}), 0)::text`,
							})
							.from(order)
							.where(
								and(
									gte(order.createdAt, startOfMonth),
									eq(order.status, "delivered" as any),
								),
							);

						const totalOrders = await db
							.select({ count: sql<number>`count(*)::int` })
							.from(order);

						const totalProducts = await db
							.select({ count: sql<number>`count(*)::int` })
							.from(product);

						const recentOrders = await db.query.order.findMany({
							orderBy: [desc(order.createdAt)],
							limit: 10,
							with: {
								user: true,
							},
						});

						return {
							totalMembers: totalMembers[0]?.count || 0,
							totalRevenue: parseFloat(monthlyRevenue[0]?.sum ?? "0"),
							totalOrders: totalOrders[0]?.count || 0,
							totalProducts: totalProducts[0]?.count || 0,
							recentOrders: recentOrders.map((o) => ({
								id: o.id,
								status: o.status,
								totalAmount: o.totalAmount,
								createdAt: o.createdAt,
								user: o.user?.name,
							})),
						};
					})
					.get("/products", async () => {
						const products = await db.query.product.findMany({
							orderBy: [desc(product.createdAt)],
						});

						return products;
					})
					.post(
						"/products",
						async ({ body }) => {
							const { name, description, price, category: cat, stock, image } = body;

							const id = generateId("prod");

							await db.insert(product).values({
								id,
								name,
								description,
								price: price.toString(),
								category: cat,
								stock: stock ?? 0,
								image,
								isActive: true,
							});

							return { success: true, id };
						},
						{
							body: t.Object({
								name: t.String(),
								description: t.Optional(t.String()),
								price: t.Union([t.Number(), t.String()]),
								category: t.Optional(t.String()),
								stock: t.Optional(t.Number()),
								image: t.Optional(t.String()),
							}),
						},
					)
					.patch(
						"/products/:id",
						async ({ params, body }) => {
							const { id } = params;
							const { name, description, price, category: cat, stock, image, isActive } = body;

							await db
								.update(product)
								.set({
									name,
									description,
									price: price.toString(),
									category: cat,
									stock,
									image,
									isActive,
								})
								.where(eq(product.id, id));

							return { success: true };
						},
						{
							params: t.Object({ id: t.String() }),
							body: t.Object({
								name: t.Optional(t.String()),
								description: t.Optional(t.String()),
								price: t.Union([t.Number(), t.String()]),
								category: t.Optional(t.String()),
								stock: t.Optional(t.Number()),
								image: t.Optional(t.String()),
								isActive: t.Optional(t.Boolean()),
							}),
						},
					)
					.delete(
						"/products/:id",
						async ({ params }) => {
							await db.delete(product).where(eq(product.id, params.id));
							return { success: true };
						},
						{ params: t.Object({ id: t.String() }) },
					)
					// Admin Categories
					.group("/categories", (cat) =>
						cat
							.get("/", async () => {
								const categories = await db.query.category.findMany({
									orderBy: [asc(category.sortOrder), asc(category.name)],
								});
								return categories;
							})
							.post(
								"/",
								async ({ body }) => {
									const id = generateId("cat");
									const slug =
										body.slug ||
										body.name
											.toLowerCase()
											.replace(/[^a-z0-9]+/g, "-")
											.replace(/^-|-$/g, "");

									await db.insert(category).values({
										id,
										name: body.name,
										slug,
										description: body.description,
										image: body.image,
										parentId: body.parentId,
										sortOrder: body.sortOrder ?? 0,
									});

									return { success: true, id };
								},
								{
									body: t.Object({
										name: t.String(),
										slug: t.Optional(t.String()),
										description: t.Optional(t.String()),
										image: t.Optional(t.String()),
										parentId: t.Optional(t.String()),
										sortOrder: t.Optional(t.Number()),
									}),
								},
							)
							.patch(
								"/:id",
								async ({ params, body }) => {
									await db.update(category).set(body).where(eq(category.id, params.id));
									return { success: true };
								},
								{
									params: t.Object({ id: t.String() }),
									body: t.Object({
										name: t.Optional(t.String()),
										slug: t.Optional(t.String()),
										description: t.Optional(t.String()),
										image: t.Optional(t.String()),
										parentId: t.Optional(t.String()),
										sortOrder: t.Optional(t.Number()),
										isActive: t.Optional(t.Boolean()),
									}),
								},
							)
							.delete(
								"/:id",
								async ({ params }) => {
									await db.delete(category).where(eq(category.id, params.id));
									return { success: true };
								},
								{ params: t.Object({ id: t.String() }) },
							),
					)
					// Admin Coupons
					.group("/coupons", (coup) =>
						coup
							.get("/", async () => {
								const coupons = await db.query.coupon.findMany({
									orderBy: [desc(coupon.createdAt)],
								});
								return coupons;
							})
							.post(
								"/",
								async ({ body }) => {
									const id = generateId("coup");

									await db.insert(coupon).values({
										id,
										code: body.code.toUpperCase(),
										name: body.name,
										description: body.description,
										type: body.type as any,
										value: body.value.toString(),
										minPurchaseAmount: body.minPurchaseAmount?.toString(),
										maxDiscountAmount: body.maxDiscountAmount?.toString(),
										maxUses: body.maxUses,
										maxUsesPerUser: body.maxUsesPerUser ?? 1,
										validFrom: new Date(body.validFrom),
										validUntil: new Date(body.validUntil),
									});

									return { success: true, id };
								},
								{
									body: t.Object({
										code: t.String(),
										name: t.String(),
										description: t.Optional(t.String()),
										type: t.Union([
											t.Literal("percentage"),
											t.Literal("fixed_amount"),
											t.Literal("free_shipping"),
										]),
										value: t.Number(),
										minPurchaseAmount: t.Optional(t.Number()),
										maxDiscountAmount: t.Optional(t.Number()),
										maxUses: t.Optional(t.Number()),
										maxUsesPerUser: t.Optional(t.Number()),
										validFrom: t.String(),
										validUntil: t.String(),
									}),
								},
							)
							.patch(
								"/:id",
								async ({ params, body }) => {
									const updateData: any = { ...body };
									if (body.code) updateData.code = body.code.toUpperCase();
									if (body.value) updateData.value = body.value.toString();
									if (body.minPurchaseAmount)
										updateData.minPurchaseAmount = body.minPurchaseAmount.toString();
									if (body.maxDiscountAmount)
										updateData.maxDiscountAmount = body.maxDiscountAmount.toString();
									if (body.validFrom) updateData.validFrom = new Date(body.validFrom);
									if (body.validUntil) updateData.validUntil = new Date(body.validUntil);

									await db.update(coupon).set(updateData).where(eq(coupon.id, params.id));
									return { success: true };
								},
								{
									params: t.Object({ id: t.String() }),
									body: t.Object({
										code: t.Optional(t.String()),
										name: t.Optional(t.String()),
										description: t.Optional(t.String()),
										type: t.Optional(
											t.Union([
												t.Literal("percentage"),
												t.Literal("fixed_amount"),
												t.Literal("free_shipping"),
											]),
										),
										value: t.Optional(t.Number()),
										minPurchaseAmount: t.Optional(t.Number()),
										maxDiscountAmount: t.Optional(t.Number()),
										maxUses: t.Optional(t.Number()),
										maxUsesPerUser: t.Optional(t.Number()),
										validFrom: t.Optional(t.String()),
										validUntil: t.Optional(t.String()),
										isActive: t.Optional(t.Boolean()),
									}),
								},
							)
							.delete(
								"/:id",
								async ({ params }) => {
									await db.delete(coupon).where(eq(coupon.id, params.id));
									return { success: true };
								},
								{ params: t.Object({ id: t.String() }) },
							),
					)
					.get("/orders", async () => {
						const orders = await db.query.order.findMany({
							orderBy: [desc(order.createdAt)],
							with: {
								user: true,
								items: {
									with: {
										product: true,
									},
								},
							},
						});

						return orders;
					})
					.patch(
						"/orders/:id/approve",
						async ({ params }) => {
							await db
								.update(order)
								.set({
									status: "approved" as any,
									approvedAt: new Date(),
								})
								.where(eq(order.id, params.id));

							return { success: true };
						},
						{ params: t.Object({ id: t.String() }) },
					)
					.patch(
						"/orders/:id/processing",
						async ({ params }) => {
							await db
								.update(order)
								.set({
									status: "processing" as any,
								})
								.where(eq(order.id, params.id));

							return { success: true };
						},
						{ params: t.Object({ id: t.String() }) },
					)
					.patch(
						"/orders/:id/cancel",
						async ({ params, set }) => {
							const ord = await db.query.order.findFirst({
								where: eq(order.id, params.id),
								with: {
									items: true,
								},
							});

							if (!ord) {
								set.status = 404;
								return { error: "Order not found" };
							}

							if (ord.status === "delivered") {
								set.status = 409;
								return { error: "Delivered orders cannot be cancelled" };
							}

							await db.transaction(async (tx) => {
								await tx
									.update(order)
									.set({
										status: "cancelled" as any,
										cancelledAt: new Date(),
									})
									.where(eq(order.id, params.id));

								for (const item of ord.items ?? []) {
									await tx
										.update(product)
										.set({ stock: sql<number>`${product.stock} + ${item.quantity}` })
										.where(eq(product.id, item.productId));
								}
							});

							return { success: true };
						},
						{ params: t.Object({ id: t.String() }) },
					)
					.patch(
						"/orders/:id/shipment",
						async ({ params, body }) => {
							const updateData: Record<string, unknown> = {
								shipmentStatus: body.shipmentStatus,
							};

							if (body.trackingNumber) {
								updateData.trackingNumber = body.trackingNumber;
							}

							if (body.shipmentStatus === "shipped") {
								updateData.shippedAt = new Date();
								updateData.status = "shipped" as any;
							} else if (
								body.shipmentStatus === "in_transit" ||
								body.shipmentStatus === "out_for_delivery"
							) {
								updateData.status = "shipped" as any;
							} else if (body.shipmentStatus === "delivered") {
								updateData.deliveredAt = new Date();
								updateData.status = "delivered" as any;
							}

							await db.update(order).set(updateData).where(eq(order.id, params.id));

							return { success: true };
						},
						{
							params: t.Object({ id: t.String() }),
							body: t.Object({
								shipmentStatus: t.Union([
									t.Literal("preparing"),
									t.Literal("shipped"),
									t.Literal("in_transit"),
									t.Literal("out_for_delivery"),
									t.Literal("delivered"),
								]),
								trackingNumber: t.Optional(t.String()),
							}),
						},
					),
			),
	)
	.listen(port);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
