import type { Product, SalesData } from "./types"

export const MOCK_PRODUCTS: Product[] = [
  {
    id: "1",
    name: "Ginseng Coffee Shots",
    price: 32,
    category: "Energy",
    image: "https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&q=80&w=800", // Placeholder
    description:
      "Instant focus, sustained vitality. Powered by Red Panax Ginseng to eliminate jitters and provide clean energy for your morning ritual.",
    stock: 45,
  },
  {
    id: "2",
    name: "Sleep-Well Tea",
    price: 28,
    category: "Relaxation",
    image: "https://images.unsplash.com/photo-1597481499750-3e6b22637e12?auto=format&fit=crop&q=80&w=800",
    description:
      "Calm mind, deep restoration. A blend of Jujube seeds and Chamomile to help you unwind and reset your circadian rhythm.",
    stock: 32,
  },
  {
    id: "3",
    name: "Hangover Awake Shots",
    price: 35,
    category: "Recovery",
    image: "https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?auto=format&fit=crop&q=80&w=800",
    description:
      "Liver support & rapid hydration. Formulated with DHM and electrolytes to bounce back after a long night.",
    stock: 20,
  },
  {
    id: "4",
    name: "Reishi Mushroom Blend",
    price: 40,
    category: "Immunity",
    image: "https://images.unsplash.com/photo-1621822766580-b7553b49045b?auto=format&fit=crop&q=80&w=800",
    description: "Support your immune system with the queen of mushrooms. Earthy, grounding, and potent.",
    stock: 15,
  },
  {
    id: "5",
    name: "Ritual Glass Mug",
    price: 18,
    category: "Accessories",
    image: "https://images.unsplash.com/photo-1577937927133-66ef06acdf18?auto=format&fit=crop&q=80&w=800",
    description: "Double-walled borosilicate glass to keep your brew hot and your hands cool.",
    stock: 100,
  },
  {
    id: "6",
    name: "Cordyceps Performance",
    price: 38,
    category: "Energy",
    image: "https://images.unsplash.com/photo-1578859318509-62790b0c6731?auto=format&fit=crop&q=80&w=800",
    description: "Natural pre-workout. Oxygenate your body and boost endurance naturally.",
    stock: 25,
  },
]

export const MOCK_SALES_DATA: SalesData[] = [
  { name: "Jan", sales: 4000, revenue: 2400 },
  { name: "Feb", sales: 3000, revenue: 1398 },
  { name: "Mar", sales: 2000, revenue: 9800 },
  { name: "Apr", sales: 2780, revenue: 3908 },
  { name: "May", sales: 1890, revenue: 4800 },
  { name: "Jun", sales: 2390, revenue: 3800 },
  { name: "Jul", sales: 3490, revenue: 4300 },
]

export const LOADING_TIPS = [
  "Steeping herbs...",
  "Balancing Qi...",
  "Grinding roots...",
  "Preparing ritual...",
  "Measuring ingredients...",
]

// Additional updates can be added here if needed
