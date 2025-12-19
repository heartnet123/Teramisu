import { Elysia, t } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@Teramisu/auth";
import { db, user, product, order } from "@Teramisu/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

const app = new Elysia()
	.use(
		cors({
			origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3000", "http://localhost:3001"],
			credentials: true,
		}),

	)
	.get("/", () => "Welcome to Teramisu Server!")
	.all("/api/auth/*", ({ request }) => {
		return auth.handler(request);
	})
	.group("/api", (api) =>
		api
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
					),
			)
			.group("/admin", (a) =>
				a
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
						"/orders/:id/cancel",
						async ({ params }) => {
							await db
								.update(order)
								.set({
									status: "cancelled" as any,
									cancelledAt: new Date(),
								})
								.where(eq(order.id, params.id));

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
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
