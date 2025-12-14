import { db, product } from "@Teramisu/db";
import { desc, eq } from "drizzle-orm";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const products = await db.query.product.findMany({
      where: eq(product.isActive, true),
      orderBy: [desc(product.createdAt)],
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
