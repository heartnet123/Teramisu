import { db, product, order, orderItem, recommendationEvent, recommendationStats } from "@Teramisu/db";
import { eq, and, desc, inArray, sql, count, gt } from "drizzle-orm";

export interface RecommendationResult {
	id: string;
	name: string;
	image: string;
	price: number;
	category: string | null;
	score: number;
}

export interface RecommendationOptions {
	limit?: number;
	minScore?: number;
	excludeProductIds?: string[];
}

export interface CollaborativeFilteringOptions {
	minCoOccurrence?: number;
	minConfidence?: number;
	maxResults?: number;
}

const DEFAULT_LIMIT = 10;
const DEFAULT_MIN_SCORE = 0.1;
const DEFAULT_MIN_CO_OCCURRENCE = 2;
const DEFAULT_MIN_CONFIDENCE = 0.1;
const DEFAULT_MAX_RESULTS = 20;

/**
 * Get frequently bought together recommendations using collaborative filtering
 * Analyzes order history to find products frequently purchased together
 */
export async function getFrequentlyBoughtTogether(
	productId: string,
	options: CollaborativeFilteringOptions = {}
): Promise<RecommendationResult[]> {
	const {
		minCoOccurrence = DEFAULT_MIN_CO_OCCURRENCE,
		minConfidence = DEFAULT_MIN_CONFIDENCE,
		maxResults = DEFAULT_MAX_RESULTS,
	} = options;

	// First, get the product's category and info
	const productInfo = await db.query.product.findFirst({
		where: eq(product.id, productId),
	});

	if (!productInfo || !productInfo.isActive) {
		return [];
	}

	// Find all orders containing this product
	const ordersWithProduct = await db
		.select({ orderId: orderItem.orderId })
		.from(orderItem)
		.where(eq(orderItem.productId, productId));

	if (ordersWithProduct.length === 0) {
		// No orders found, return category-based recommendations as fallback
		return getCategoryBasedRecommendations(productInfo.category, {
			limit: Math.min(maxResults, 5),
			excludeProductIds: [productId],
		});
	}

	const orderIds = ordersWithProduct.map((o) => o.orderId);

	// Find other products bought together with this product
	const coOccurrence = await db
		.select({
			productId: orderItem.productId,
			coOccurrenceCount: count(),
		})
		.from(orderItem)
		.where(
			and(
				inArray(orderItem.orderId, orderIds),
				sql`${orderItem.productId} != ${productId}`
			)
		)
		.groupBy(orderItem.productId)
		.having(gt(count(), minCoOccurrence))
		.orderBy(desc(count()))
		.limit(maxResults * 2);

	// Calculate confidence scores
	// Confidence = co-occurrence count / total orders with product
	const totalOrders = ordersWithProduct.length;
	const recommendations = coOccurrence
		.map((item) => ({
			productId: item.productId,
			confidence: item.coOccurrenceCount / totalOrders,
			coOccurrenceCount: item.coOccurrenceCount,
		}))
		.filter((item) => item.confidence >= minConfidence)
		.sort((a, b) => b.confidence - a.confidence)
		.slice(0, maxResults);

	if (recommendations.length === 0) {
		return [];
	}

	// Get full product details
	const recommendedProductIds = recommendations.map((r) => r.productId);
	const products = await db.query.product.findMany({
		where: and(
			inArray(product.id, recommendedProductIds),
			eq(product.isActive, true)
		),
	});

	const productsById = new Map(products.map((p) => [p.id, p]));

	// Combine with scores
	const results: RecommendationResult[] = recommendations
		.map((rec) => {
			const prod = productsById.get(rec.productId);
			if (!prod) return null;

			return {
				id: prod.id,
				name: prod.name,
				image: prod.image ?? "https://via.placeholder.com/300",
				price: parseFloat(String(prod.price)),
				category: prod.category ?? null,
				score: rec.confidence,
			};
		})
		.filter((item): item is RecommendationResult => item !== null);

	return results;
}

/**
 * Get personalized recommendations based on user's purchase history
 * Uses collaborative filtering to find products similar to what the user has bought
 */
export async function getPersonalizedRecommendations(
	userId: string,
	options: RecommendationOptions = {}
): Promise<RecommendationResult[]> {
	const {
		limit = DEFAULT_LIMIT,
		minScore = DEFAULT_MIN_SCORE,
		excludeProductIds = [],
	} = options;

	// Get user's order history
	const userOrders = await db.query.order.findMany({
		where: eq(order.userId, userId),
		columns: { id: true },
	});

	if (userOrders.length === 0) {
		// No order history, return trending/popular products
		return getPopularProducts({ limit, excludeProductIds });
	}

	const orderIds = userOrders.map((o) => o.id);

	// Get all products the user has purchased
	const userPurchasedProducts = await db
		.select({ productId: orderItem.productId })
		.from(orderItem)
		.where(inArray(orderItem.orderId, orderIds));

	const purchasedProductIds = [
		...new Set(userPurchasedProducts.map((p) => p.productId)),
	];

	if (purchasedProductIds.length === 0) {
		return getPopularProducts({ limit, excludeProductIds });
	}

	// Calculate product scores based on frequently bought together
	const productScores = new Map<string, number>();

	for (const purchasedProductId of purchasedProductIds) {
		const recommendations = await getFrequentlyBoughtTogether(purchasedProductId, {
			minCoOccurrence: DEFAULT_MIN_CO_OCCURRENCE,
			minConfidence: minScore,
			maxResults: limit * 2,
		});

		for (const rec of recommendations) {
			// Skip products the user has already purchased or is in exclude list
			if (
				purchasedProductIds.includes(rec.id) ||
				excludeProductIds.includes(rec.id)
			) {
				continue;
			}

			// Accumulate scores (products recommended by multiple purchased products get higher scores)
			const currentScore = productScores.get(rec.id) ?? 0;
			productScores.set(rec.id, currentScore + rec.score);
		}
	}

	// Sort by score and get top recommendations
	const sortedRecommendations = Array.from(productScores.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit);

	if (sortedRecommendations.length === 0) {
		return getPopularProducts({ limit, excludeProductIds });
	}

	const recommendedProductIds = sortedRecommendations.map((r) => r[0]);
	const products = await db.query.product.findMany({
		where: and(
			inArray(product.id, recommendedProductIds),
			eq(product.isActive, true)
		),
	});

	const productsById = new Map(products.map((p) => [p.id, p]));

	return sortedRecommendations
		.map(([productId, score]) => {
			const prod = productsById.get(productId);
			if (!prod) return null;

			return {
				id: prod.id,
				name: prod.name,
				image: prod.image ?? "https://via.placeholder.com/300",
				price: parseFloat(String(prod.price)),
				category: prod.category ?? null,
				score: Math.min(score, 1), // Normalize to max 1
			};
		})
		.filter((item): item is RecommendationResult => item !== null)
		.sort((a, b) => b.score - a.score);
}

/**
 * Get category-based recommendations
 * Returns products in the same category, excluding specified products
 */
export async function getCategoryBasedRecommendations(
	category: string | null,
	options: RecommendationOptions = {}
): Promise<RecommendationResult[]> {
	const {
		limit = DEFAULT_LIMIT,
		excludeProductIds = [],
	} = options;

	if (!category) {
		return getPopularProducts({ limit, excludeProductIds });
	}

	const products = await db.query.product.findMany({
		where: and(
			eq(product.category, category),
			eq(product.isActive, true),
			excludeProductIds.length > 0
				? sql`${product.id} NOT IN ${excludeProductIds}`
				: undefined
		),
		orderBy: [desc(product.createdAt)],
		limit,
	});

	return products.map((prod) => ({
		id: prod.id,
		name: prod.name,
		image: prod.image ?? "https://via.placeholder.com/300",
		price: parseFloat(String(prod.price)),
		category: prod.category ?? null,
		score: 0.5, // Default score for category-based recommendations
	}));
}

/**
 * Get popular products based on order frequency
 * Used as fallback when no personalized recommendations are available
 */
async function getPopularProducts(
	options: RecommendationOptions = {}
): Promise<RecommendationResult[]> {
	const { limit = DEFAULT_LIMIT, excludeProductIds = [] } = options;

	// Get products ordered by frequency in orders
	const popularProducts = await db
		.select({
			productId: orderItem.productId,
			orderCount: count(),
		})
		.from(orderItem)
		.groupBy(orderItem.productId)
		.orderBy(desc(count()))
		.limit(limit * 2);

	const productIds = popularProducts
		.map((p) => p.productId)
		.filter((id) => !excludeProductIds.includes(id))
		.slice(0, limit);

	if (productIds.length === 0) {
		// No order data, return recently added active products
		const recentProducts = await db.query.product.findMany({
			where: and(
				eq(product.isActive, true),
				excludeProductIds.length > 0
					? sql`${product.id} NOT IN ${excludeProductIds}`
					: undefined
			),
			orderBy: [desc(product.createdAt)],
			limit,
		});

		return recentProducts.map((prod) => ({
			id: prod.id,
			name: prod.name,
			image: prod.image ?? "https://via.placeholder.com/300",
			price: parseFloat(String(prod.price)),
			category: prod.category ?? null,
			score: 0.3, // Low score for fallback recommendations
		}));
	}

	const products = await db.query.product.findMany({
		where: and(
			inArray(product.id, productIds),
			eq(product.isActive, true)
		),
	});

	const productsById = new Map(products.map((p) => [p.id, p]));
	const maxOrderCount = Math.max(...popularProducts.map((p) => p.orderCount));

	return popularProducts
		.map((item) => {
			const prod = productsById.get(item.productId);
			if (!prod) return null;

			return {
				id: prod.id,
				name: prod.name,
				image: prod.image ?? "https://via.placeholder.com/300",
				price: parseFloat(String(prod.price)),
				category: prod.category ?? null,
				score: item.orderCount / maxOrderCount, // Normalize score
			};
		})
		.filter((item): item is RecommendationResult => item !== null)
		.sort((a, b) => b.score - a.score)
		.slice(0, limit);
}

/**
 * Track recommendation events (view, click, conversion)
 * Updates recommendation stats for analytics
 */
export async function trackRecommendationEvent(params: {
	userId?: string;
	productId: string;
	recommendedProductId: string;
	eventType: "view" | "click" | "conversion";
	recommendationType: "frequently_bought_together" | "personalized" | "category_based" | "cart_related" | "order_related";
}): Promise<void> {
	const {
		userId,
		productId,
		recommendedProductId,
		eventType,
		recommendationType,
	} = params;

	// Generate unique ID
	const eventId = `${eventType}_${productId}_${recommendedProductId}_${Date.now()}`;

	// Insert event record
	await db.insert(recommendationEvent).values({
		id: eventId,
		userId: userId ?? null,
		productId,
		recommendedProductId,
		eventType,
		recommendationType,
		metadata: null,
	});

	// Update stats
	const existingStats = await db.query.recommendationStats.findFirst({
		where: and(
			eq(recommendationStats.productId, productId),
			eq(recommendationStats.recommendedProductId, recommendedProductId),
			eq(recommendationStats.recommendationType, recommendationType)
		),
	});

	if (existingStats) {
		// Update existing stats
		const updateData: Record<string, number | Date> = {
			lastUpdatedAt: new Date(),
		};

		if (eventType === "view") {
			updateData.viewCount = existingStats.viewCount + 1;
		} else if (eventType === "click") {
			updateData.clickCount = existingStats.clickCount + 1;
		} else if (eventType === "conversion") {
			updateData.conversionCount = existingStats.conversionCount + 1;
		}

		await db
			.update(recommendationStats)
			.set(updateData)
			.where(eq(recommendationStats.id, existingStats.id));
	} else {
		// Create new stats entry
		const statsId = `${recommendationType}_${productId}_${recommendedProductId}`;
		const statsData = {
			id: statsId,
			productId,
			recommendedProductId,
			recommendationType,
			viewCount: eventType === "view" ? 1 : 0,
			clickCount: eventType === "click" ? 1 : 0,
			conversionCount: eventType === "conversion" ? 1 : 0,
		};

		await db.insert(recommendationStats).values(statsData);
	}
}

/**
 * Get recommendations based on cart items
 * Finds products frequently bought together with items in the cart
 */
export async function getCartRecommendations(
	cartProductIds: string[],
	options: RecommendationOptions = {}
): Promise<RecommendationResult[]> {
	const { limit = DEFAULT_LIMIT, excludeProductIds = [] } = options;

	if (cartProductIds.length === 0) {
		return getPopularProducts({ limit, excludeProductIds });
	}

	const allExcludeIds = [...cartProductIds, ...excludeProductIds];
	const productScores = new Map<string, number>();

	// Get recommendations for each cart item
	for (const cartProductId of cartProductIds) {
		const recommendations = await getFrequentlyBoughtTogether(cartProductId, {
			minCoOccurrence: DEFAULT_MIN_CO_OCCURRENCE,
			minConfidence: DEFAULT_MIN_CONFIDENCE,
			maxResults: limit * 3,
		});

		for (const rec of recommendations) {
			if (allExcludeIds.includes(rec.id)) {
				continue;
			}

			const currentScore = productScores.get(rec.id) ?? 0;
			productScores.set(rec.id, currentScore + rec.score);
		}
	}

	// Sort by score and get top recommendations
	const sortedRecommendations = Array.from(productScores.entries())
		.sort((a, b) => b[1] - a[1])
		.slice(0, limit);

	if (sortedRecommendations.length === 0) {
		return getPopularProducts({ limit, excludeProductIds: allExcludeIds });
	}

	const recommendedProductIds = sortedRecommendations.map((r) => r[0]);
	const products = await db.query.product.findMany({
		where: and(
			inArray(product.id, recommendedProductIds),
			eq(product.isActive, true)
		),
	});

	const productsById = new Map(products.map((p) => [p.id, p]));

	return sortedRecommendations
		.map(([productId, score]) => {
			const prod = productsById.get(productId);
			if (!prod) return null;

			return {
				id: prod.id,
				name: prod.name,
				image: prod.image ?? "https://via.placeholder.com/300",
				price: parseFloat(String(prod.price)),
				category: prod.category ?? null,
				score: Math.min(score, 1),
			};
		})
		.filter((item): item is RecommendationResult => item !== null)
		.sort((a, b) => b.score - a.score);
}

/**
 * Get recommendations based on user's order history
 * Similar to personalized but focuses on complementary products
 */
export async function getOrderHistoryRecommendations(
	userId: string,
	options: RecommendationOptions = {}
): Promise<RecommendationResult[]> {
	// Similar to personalized recommendations but can have different logic
	// For now, we'll use the same logic
	return getPersonalizedRecommendations(userId, options);
}
