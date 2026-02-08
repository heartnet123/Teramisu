import { db, product } from "@Teramisu/db";
import { desc, eq, and, or, gte, lte, sql, asc } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const category = searchParams.get("category");
    const minPrice = searchParams.get("minPrice");
    const maxPrice = searchParams.get("maxPrice");
    const wellnessGoals = searchParams.get("wellnessGoals");
    const ingredients = searchParams.get("ingredients");
    const availability = searchParams.get("availability");
    const sortBy = searchParams.get("sortBy");
    const order = searchParams.get("order") === "asc" ? "asc" : "desc";

    // Build dynamic WHERE conditions
    const conditions = [eq(product.isActive, true)];

    // Filter by category
    if (category) {
      conditions.push(eq(product.category, category));
    }

    // Filter by price range
    if (minPrice !== null) {
      conditions.push(gte(product.price, minPrice));
    }
    if (maxPrice !== null) {
      conditions.push(lte(product.price, maxPrice));
    }

    // Filter by wellness goals (array overlap)
    if (wellnessGoals) {
      const goalsArray = wellnessGoals.split(",").map((g) => g.trim());
      conditions.push(
        sql`${product.wellnessGoals} && ${goalsArray}`
      );
    }

    // Filter by ingredients (array overlap)
    if (ingredients) {
      const ingredientsArray = ingredients.split(",").map((i) => i.trim());
      conditions.push(
        sql`${product.ingredients} && ${ingredientsArray}`
      );
    }

    // Filter by availability based on stock
    if (availability) {
      if (availability === "in") {
        conditions.push(gte(product.stock, 10));
      } else if (availability === "low") {
        conditions.push(and(gte(product.stock, 1), sql`${product.stock} < 10`));
      } else if (availability === "out") {
        conditions.push(eq(product.stock, 0));
      }
    }

    // Build dynamic orderBy clause
    let orderByClause;
    const sortDirection = order === "asc" ? asc : desc;

    switch (sortBy) {
      case "price":
        orderByClause = [sortDirection(product.price)];
        break;
      case "popularity":
        orderByClause = [sortDirection(product.popularityScore)];
        break;
      case "rating":
        orderByClause = [sortDirection(product.rating)];
        break;
      case "newest":
      default:
        orderByClause = [desc(product.createdAt)];
        break;
    }

    const products = await db.query.product.findMany({
      where: and(...conditions),
      orderBy: orderByClause,
    });

    const formattedProducts = products.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description || "",
      price: parseFloat(p.price),
      category: p.category || "Uncategorized",
      stock: p.stock,
      image: p.image || "https://via.placeholder.com/300",
      availability:
        p.stock === 0 ? "out" : p.stock < 10 ? "low" : ("in" as "in" | "low" | "out"),
    }));

    return NextResponse.json({ products: formattedProducts });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ products: [] }, { status: 500 });
  }
}
