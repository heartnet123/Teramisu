import "dotenv/config";
import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@Teramisu/auth";
import { db, user, product, order, orderItem } from "@Teramisu/db";
import { eq, desc, sql, and, gte, inArray } from "drizzle-orm";

const isProd = process.env.NODE_ENV === "production";

const requiredEnv = ["BETTER_AUTH_SECRET", "BETTER_AUTH_URL", "DATABASE_URL"] as const;
for (const key of requiredEnv) {
	if (!process.env[key]) {
		throw new Error(`${key} is required`);
	}
}

const adminBootstrapToken = process.env.ADMIN_BOOTSTRAP_TOKEN;
const adminBootstrapAllowExisting = process.env.ADMIN_BOOTSTRAP_ALLOW_EXISTING === "true";

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
					),
			)
			.derive(async ({ request }) => {
				const session = await auth.api.getSession({ headers: request.headers });
				return { session };
			})
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
	
							const orderId = `ord_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
	
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
									const oiId = `oi_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
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
							const { name, description, price, category, stock, image } = body;

							const id = `prod_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;

							await db.insert(product).values({
								id,
								name,
								description,
								price: price.toString(),
								category,
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
							const { name, description, price, category, stock, image, isActive } = body;

							await db
								.update(product)
								.set({
									name,
									description,
									price: price.toString(),
									category,
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
