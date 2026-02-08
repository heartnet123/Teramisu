import Link from "next/link";

export type Product = {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  description: string;
  stock: number;
  availability: "in" | "low" | "out";
};

function currency(n: number) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(n);
}

export interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  return (
    <Link href={`/shop/${product.id}`} className="group block space-y-3 animate-fade-in">
      <div className="aspect-[4/5] rounded-[32px] overflow-hidden bg-[#f3f3f1] relative transition-transform duration-300 group-hover:scale-[1.02]">
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="space-y-1 px-1">
        <h3 className="font-semibold text-base leading-tight">{product.name}</h3>
        <p className="text-sm font-medium text-muted-foreground">{currency(product.price)}</p>
      </div>
    </Link>
  );
}
