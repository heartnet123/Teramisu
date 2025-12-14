import { Hono } from "hono";
import { cors } from "hono/cors";
import { auth } from "@Teramisu/auth";
import { db, user, product, order, orderItem } from "@Teramisu/db";
import { eq, desc, sql, and, gte } from "drizzle-orm";

const app = new Hono();

app.use(
	"/*",
	cors({
		origin: process.env.CORS_ORIGIN?.split(",") || ["http://localhost:3001"],
		credentials: true,
	}),
);

app.on(["POST", "GET"], "/api/auth/**", (c) => {
	return auth.handler(c.req.raw);
});

app.get("/api/user/profile", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const userData = await db.query.user.findFirst({
		where: eq(user.id, session.user.id),
	});

	if (!userData) {
		return c.json({ error: "User not found" }, 404);
	}

	return c.json(userData);
});

app.patch("/api/user/profile", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user) {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json();
	const { name, image } = body;

	await db.update(user).set({ name, image }).where(eq(user.id, session.user.id));

	return c.json({ success: true });
});

app.get("/api/admin/metrics", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user || session.user.role !== "admin") {
		return c.json({ error: "Unauthorized" }, 401);
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

	return c.json({
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
	});
});

app.get("/api/admin/products", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user || session.user.role !== "admin") {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const products = await db.query.product.findMany({
		orderBy: [desc(product.createdAt)],
	});

	return c.json(products);
});

app.post("/api/admin/products", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user || session.user.role !== "admin") {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const body = await c.req.json();
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

	return c.json({ success: true, id });
});

app.patch("/api/admin/products/:id", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user || session.user.role !== "admin") {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const productId = c.req.param("id");
	const body = await c.req.json();
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

	return c.json({ success: true });
});

app.delete("/api/admin/products/:id", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user || session.user.role !== "admin") {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const productId = c.req.param("id");

	await db.delete(product).where(eq(product.id, productId));

	return c.json({ success: true });
});

app.get("/api/admin/orders", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user || session.user.role !== "admin") {
		return c.json({ error: "Unauthorized" }, 401);
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

	return c.json(orders);
});

app.patch("/api/admin/orders/:id/approve", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user || session.user.role !== "admin") {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const orderId = c.req.param("id");

	await db
		.update(order)
		.set({
			status: "approved" as any,
			approvedAt: new Date(),
		})
		.where(eq(order.id, orderId));

	return c.json({ success: true });
});

app.patch("/api/admin/orders/:id/cancel", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user || session.user.role !== "admin") {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const orderId = c.req.param("id");

	await db
		.update(order)
		.set({
			status: "cancelled" as any,
			cancelledAt: new Date(),
		})
		.where(eq(order.id, orderId));

	return c.json({ success: true });
});

app.patch("/api/admin/orders/:id/shipment", async (c) => {
	const session = await auth.api.getSession({ headers: c.req.raw.headers });
	if (!session?.user || session.user.role !== "admin") {
		return c.json({ error: "Unauthorized" }, 401);
	}

	const orderId = c.req.param("id");
	const body = await c.req.json();
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

	return c.json({ success: true });
});

export default {
	port: 3000,
	fetch: app.fetch,
};