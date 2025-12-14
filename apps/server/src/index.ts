import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@Teramisu/auth";
import { db, user, product, order, orderItem } from "@Teramisu/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

const app = new Elysia()
	.use(
		cors({
			origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3001"],
			credentials: true,
		}),
	)
	.all("/api/auth/*", ({ request }) => {
		return auth.handler(request);
	})
	.get("/api/user/profile", async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const userData = await db.query.user.findFirst({
			where: eq(user.id, session.user.id),
		});

		if (!userData) {
			return new Response(JSON.stringify({ error: "User not found" }), {
				status: 404,
				headers: { "Content-Type": "application/json" },
			});
		}

		return userData;
	})
	.patch("/api/user/profile", async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user) {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body = await request.json();
		const { name, image } = body;

		await db.update(user).set({ name, image }).where(eq(user.id, session.user.id));

		return { success: true };
	})
	.get("/api/admin/metrics", async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const totalMembers = await db.select({ count: sql<number>`count(*)::int` }).from(user);
		
		const now = new Date();
		const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
		
		const monthlyRevenue = await db
			.select({ sum: sql<number>`coalesce(sum(${order.totalAmount}), 0)::decimal` })
			.from(order)
			.where(and(
				gte(order.createdAt, startOfMonth),
				eq(order.status, "delivered" as any)
			));

		const totalOrders = await db.select({ count: sql<number>`count(*)::int` }).from(order);
		
		const totalProducts = await db.select({ count: sql<number>`count(*)::int` }).from(product);

		const recentOrders = await db.query.order.findMany({
			orderBy: [desc(order.createdAt)],
			limit: 10,
			with: {
				user: true,
			},
		});

		return {
			totalMembers: totalMembers[0]?.count || 0,
			totalRevenue: parseFloat(monthlyRevenue[0]?.sum?.toString() || "0"),
			totalOrders: totalOrders[0]?.count || 0,
			totalProducts: totalProducts[0]?.count || 0,
			recentOrders: recentOrders.map(o => ({
				id: o.id,
				status: o.status,
				totalAmount: o.totalAmount,
				createdAt: o.createdAt,
				user: o.user?.name,
			})),
		};
	})
	.get("/api/admin/products", async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const products = await db.query.product.findMany({
			orderBy: [desc(product.createdAt)],
		});

		return products;
	})
	.post("/api/admin/products", async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const body = await request.json();
		const { name, description, price, category, stock, image } = body;

		const id = `prod_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

		await db.insert(product).values({
			id,
			name,
			description,
			price: price.toString(),
			category,
			stock: stock || 0,
			image,
			isActive: true,
		});

		return { success: true, id };
	})
	.patch("/api/admin/products/:id", async ({ request, params }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const productId = params.id;
		const body = await request.json();
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
			.where(eq(product.id, productId));

		return { success: true };
	})
	.delete("/api/admin/products/:id", async ({ request, params }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const productId = params.id;

		await db.delete(product).where(eq(product.id, productId));

		return { success: true };
	})
	.get("/api/admin/orders", async ({ request }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

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
	.patch("/api/admin/orders/:id/approve", async ({ request, params }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const orderId = params.id;

		await db
			.update(order)
			.set({
				status: "approved" as any,
				approvedAt: new Date(),
			})
			.where(eq(order.id, orderId));

		return { success: true };
	})
	.patch("/api/admin/orders/:id/cancel", async ({ request, params }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const orderId = params.id;

		await db
			.update(order)
			.set({
				status: "cancelled" as any,
				cancelledAt: new Date(),
			})
			.where(eq(order.id, orderId));

		return { success: true };
	})
	.patch("/api/admin/orders/:id/shipment", async ({ request, params }) => {
		const session = await auth.api.getSession({ headers: request.headers });
		if (!session?.user || session.user.role !== "admin") {
			return new Response(JSON.stringify({ error: "Unauthorized" }), {
				status: 401,
				headers: { "Content-Type": "application/json" },
			});
		}

		const orderId = params.id;
		const body = await request.json();
		const { shipmentStatus, trackingNumber } = body;

		const updateData: any = {
			shipmentStatus,
		};

		if (trackingNumber) {
			updateData.trackingNumber = trackingNumber;
		}

		if (shipmentStatus === "shipped") {
			updateData.shippedAt = new Date();
		} else if (shipmentStatus === "delivered") {
			updateData.deliveredAt = new Date();
			updateData.status = "delivered" as any;
		}

		await db.update(order).set(updateData).where(eq(order.id, orderId));

		return { success: true };
	})
	.listen(3000);

console.log(
	`🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
