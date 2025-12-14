import "dotenv/config";
import { Elysia } from "elysia";
import { cors } from "@elysiajs/cors";
import { auth } from "@Teramisu/auth";
import { z } from "zod";

type Product = {
	id: string;
	name: string;
	price: number;
	category: string;
	image: string;
	description: string;
	stock: number;
};

type CartLine = {
	id: string;
	quantity: number;
	clientPrice?: number;
};

type CartConflictType = "NOT_FOUND" | "OUT_OF_STOCK" | "QTY_ADJUSTED" | "PRICE_CHANGED";

type CartConflict = {
	id: string;
	type: CartConflictType;
	message: string;
	previousQuantity?: number;
	newQuantity?: number;
	previousPrice?: number;
	newPrice?: number;
};

const LOW_STOCK_THRESHOLD = 5;

function availability(stock: number) {
	if (stock <= 0) return "out" as const;
	if (stock <= LOW_STOCK_THRESHOLD) return "low" as const;
	return "in" as const;
}

const products: Product[] = [
	{
		id: "1",
		name: "Ginseng Coffee Shots",
		price: 32,
		category: "Energy",
		image:
			"https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800",
		description:
			"Instant focus, sustained vitality. Powered by Red Panax Ginseng to eliminate jitters and provide clean energy for your morning ritual.",
		stock: 45,
	},
	{
		id: "2",
		name: "Sleep-Well Tea",
		price: 28,
		category: "Relaxation",
		image:
			"https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=800",
		description:
			"Calm mind, deep restoration. A blend of Jujube seeds and Chamomile to help you unwind and reset your circadian rhythm.",
		stock: 0,
	},
	{
		id: "3",
		name: "Hangover Awake Shots",
		price: 35,
		category: "Recovery",
		image:
			"https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
		description:
			"Liver support & rapid hydration. Formulated with DHM and electrolytes to bounce back after a long night.",
		stock: 2,
	},
	{
		id: "4",
		name: "Reishi Mushroom Blend",
		price: 40,
		category: "Immunity",
		image:
			"https://images.unsplash.com/photo-1621822766580-b7553b49045b?auto=format&fit=crop&q=80&w=800",
		description:
			"Support your immune system with the queen of mushrooms. Earthy, grounding, and potent.",
		stock: 15,
	},
	{
		id: "5",
		name: "Ritual Glass Mug",
		price: 18,
		category: "Accessories",
		image:
			"https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=800",
		description:
			"Double-walled borosilicate glass to keep your brew hot and your hands cool.",
		stock: 100,
	},
	{
		id: "6",
		name: "Cordyceps Performance",
		price: 38,
		category: "Energy",
		image:
			"https://images.unsplash.com/photo-1578859318509-62790b0c6731?auto=format&fit=crop&q=80&w=800",
		description: "Natural pre-workout. Oxygenate your body and boost endurance naturally.",
		stock: 4,
	},
];

const productsById = new Map(products.map((p) => [p.id, p] as const));

type StoredCart = { items: { id: string; quantity: number }[]; updatedAt: number };
const cartStore = new Map<string, StoredCart>();

const cartLineSchema = z.object({
	id: z.string().min(1),
	quantity: z.number().int().nonnegative(),
	clientPrice: z.number().optional(),
});

const cartSyncSchema = z.object({
	items: z.array(cartLineSchema),
});

const profilePatchSchema = z
	.object({
		name: z.string().min(1).optional(),
		image: z.string().url().optional(),
	})
	.partial();

const addressCreateSchema = z.object({
	line1: z.string().min(1),
	line2: z.string().optional(),
	city: z.string().min(1),
	region: z.string().optional(),
	postalCode: z.string().optional(),
});

const addressUpdateSchema = addressCreateSchema.partial();

function validateCart(input: CartLine[]) {
	const conflicts: CartConflict[] = [];
	const validatedItems: Array<{
		id: string;
		name: string;
		image: string;
		price: number;
		quantity: number;
		maxQuantity: number;
	}> = [];

	for (const line of input) {
		const product = productsById.get(line.id);
		if (!product) {
			conflicts.push({
				id: line.id,
				type: "NOT_FOUND",
				message: "Item was removed because it no longer exists.",
			});
			continue;
		}

		if (product.stock <= 0) {
			conflicts.push({
				id: line.id,
				type: "OUT_OF_STOCK",
				message: `“${product.name}” is now out of stock and was removed from your cart.`,
				previousQuantity: line.quantity,
				newQuantity: 0,
			});
			continue;
		}

		if (typeof line.clientPrice === "number" && line.clientPrice !== product.price) {
			conflicts.push({
				id: line.id,
				type: "PRICE_CHANGED",
				message: `Price updated for “${product.name}”.`,
				previousPrice: line.clientPrice,
				newPrice: product.price,
			});
		}

		const desired = Math.max(0, Math.floor(line.quantity));
		const clamped = Math.min(Math.max(1, desired), product.stock);
		if (clamped !== line.quantity) {
			conflicts.push({
				id: line.id,
				type: "QTY_ADJUSTED",
				message: `Quantity adjusted for “${product.name}” due to stock changes.`,
				previousQuantity: line.quantity,
				newQuantity: clamped,
			});
		}

		validatedItems.push({
			id: product.id,
			name: product.name,
			image: product.image,
			price: product.price,
			quantity: clamped,
			maxQuantity: product.stock,
		});
	}

	const total = validatedItems.reduce((sum, i) => sum + i.price * i.quantity, 0);
	return { items: validatedItems, conflicts, total };
}

type Address = {
	id: string;
	line1: string;
	line2?: string;
	city: string;
	region?: string;
	postalCode?: string;
	isDefault?: boolean;
};

const addressesStore = new Map<string, Address[]>(); // in-memory store per-user (demo)
const profileStore = new Map<string, { name?: string; image?: string }>();

new Elysia()
	.use(
		cors({
			origin: process.env.CORS_ORIGIN || "http://localhost:3001",
			methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
			allowedHeaders: ["Content-Type", "Authorization"],
			credentials: true,
		}),
	)
	.all("/api/auth/*", async ({ request, set }) => {
		if (["POST", "GET"].includes(request.method)) {
			return auth.handler(request);
		}
		set.status = 405;
		return "Method Not Allowed";
	})

	// Simple helper to resolve a "user id" for demo purposes. In real app, use the auth session.
	.decorate("resolveUserId", (ctx: any) => {
		// Prefer an explicit header for testing, otherwise use a demo id
		const header = ctx.request.headers.get("x-user-id");
		return header || "demo-user";
	})

	// Products endpoints
	.get("/api/products", () => ({
		products: products.map((p) => ({
			...p,
			availability: availability(p.stock),
		})),
	}))
	.get("/api/products/:id", ({ params, set }) => {
		const id = params.id as string;
		const product = productsById.get(id);
		if (!product) {
			set.status = 404;
			return { message: "Not found" };
		}
		return { ...product, availability: availability(product.stock) };
	})

	// Cart endpoints (server-validated sync)
	.get("/api/cart", ({ request, resolveUserId }) => {
		const userId = resolveUserId({ request } as any);
		const stored = cartStore.get(userId);
		const validated = validateCart((stored?.items ?? []).map((i) => ({ id: i.id, quantity: i.quantity })));
		cartStore.set(userId, {
			items: validated.items.map((i) => ({ id: i.id, quantity: i.quantity })),
			updatedAt: Date.now(),
		});
		return { ...validated, updatedAt: cartStore.get(userId)!.updatedAt };
	})
	.post("/api/cart/validate", async ({ request, set }) => {
		const body = await request.json().catch(() => null);
		const parsed = cartSyncSchema.safeParse(body);
		if (!parsed.success) {
			set.status = 400;
			return { message: "Invalid payload" };
		}
		return validateCart(parsed.data.items);
	})
	.post("/api/cart/sync", async ({ request, set, resolveUserId }) => {
		const userId = resolveUserId({ request } as any);
		const body = await request.json().catch(() => null);
		const parsed = cartSyncSchema.safeParse(body);
		if (!parsed.success) {
			set.status = 400;
			return { message: "Invalid payload" };
		}
		const validated = validateCart(parsed.data.items);
		cartStore.set(userId, {
			items: validated.items.map((i) => ({ id: i.id, quantity: i.quantity })),
			updatedAt: Date.now(),
		});
		return { ...validated, updatedAt: cartStore.get(userId)!.updatedAt };
	})

	// Profile endpoints
	.patch("/api/user/profile", async ({ request, set, resolveUserId }) => {
		const userId = resolveUserId({ request } as any);
		const body = await request.json().catch(() => null);
		const parsed = profilePatchSchema.safeParse(body);
		if (!parsed.success) {
			set.status = 400;
			return { message: "Invalid payload" };
		}
		const current = profileStore.get(userId) ?? {};
		const updated = { ...current, ...parsed.data };
		profileStore.set(userId, updated);
		return { ok: true, user: updated };
	})
	.get("/api/user/profile", ({ request, resolveUserId }) => {
		const userId = resolveUserId({ request } as any);
		return { user: profileStore.get(userId) ?? null };
	})

	// Addresses endpoints (CRUD + set default)
	.get("/api/user/addresses", ({ request, resolveUserId }) => {
		const userId = resolveUserId({ request } as any);
		return addressesStore.get(userId) ?? [];
	})
	.post("/api/user/addresses", async ({ request, set, resolveUserId }) => {
		const userId = resolveUserId({ request } as any);
		const body = await request.json().catch(() => null);
		const parsed = addressCreateSchema.safeParse(body);
		if (!parsed.success) {
			set.status = 400;
			return { message: "Invalid payload" };
		}
		const list = addressesStore.get(userId) ?? [];
		const id = "addr_" + Math.random().toString(36).slice(2, 9);
		const newAddr: Address = { id, ...parsed.data, isDefault: list.length === 0 };
		const next = [newAddr, ...list];
		addressesStore.set(userId, next);
		return newAddr;
	})
	.put("/api/user/addresses/:id", async ({ request, params, set, resolveUserId }) => {
		const userId = resolveUserId({ request } as any);
		const id = params.id as string;
		const body = await request.json().catch(() => null);
		const parsed = addressUpdateSchema.safeParse(body);
		if (!parsed.success) {
			set.status = 400;
			return { message: "Invalid payload" };
		}
		const list = addressesStore.get(userId) ?? [];
		const found = list.some((a) => a.id === id);
		if (!found) {
			set.status = 404;
			return { message: "Not found" };
		}
		const updated = list.map((a) => (a.id === id ? { ...a, ...parsed.data } : a));
		addressesStore.set(userId, updated);
		return updated.find((a) => a.id === id) ?? null;
	})
	.delete("/api/user/addresses/:id", ({ request, params, resolveUserId }) => {
		const userId = resolveUserId({ request } as any);
		const id = params.id as string;
		const list = addressesStore.get(userId) ?? [];
		const next = list.filter((a) => a.id !== id);
		addressesStore.set(userId, next);
		return { ok: true };
	})
	.post("/api/user/addresses/:id/default", ({ request, params, set, resolveUserId }) => {
		const userId = resolveUserId({ request } as any);
		const id = params.id as string;
		const list = addressesStore.get(userId) ?? [];
		if (!list.some((a) => a.id === id)) {
			set.status = 404;
			return { message: "Not found" };
		}
		const next = list.map((a) => ({ ...a, isDefault: a.id === id }));
		addressesStore.set(userId, next);
		return { ok: true };
	})

	.get("/", () => "OK")
	.listen(3000, () => {
		console.log("Server is running on http://localhost:3000");
	});
