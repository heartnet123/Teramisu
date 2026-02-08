"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import {
  RevenueChart,
  OrdersChart,
  OrderStatusChart,
  TopProductsChart,
} from "@/components/admin/analytics-charts";
import { getServerUrl } from "@/lib/server-url";
import { TrendingUp, Package, Users, DollarSign } from "lucide-react";

type AnalyticsData = {
  dailyRevenue: Array<{ date: string; revenue: number; orders: number }>;
  ordersByStatus: Record<string, number>;
  topProducts: Array<{ name: string; sold: number; revenue: number }>;
  summary: {
    totalRevenue: number;
    totalOrders: number;
    totalCustomers: number;
    avgOrderValue: number;
    revenueGrowth: number;
    orderGrowth: number;
  };
};

export default function AdminAnalyticsPage() {
  const [data, setData] = React.useState<AnalyticsData | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      const res = await fetch(`${getServerUrl()}/api/admin/analytics`, {
        credentials: "include",
      });

      if (res.ok) {
        const analyticsData = await res.json();
        setData(analyticsData);
      }
    } catch (error) {
      console.error("Failed to fetch analytics:", error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">กำลังโหลด...</div>;
  }

  // Generate mock data if no real data
  const mockDailyRevenue = Array.from({ length: 14 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (13 - i));
    return {
      date: date.toISOString().split("T")[0],
      revenue: Math.floor(Math.random() * 50000) + 10000,
      orders: Math.floor(Math.random() * 20) + 5,
    };
  });

  const mockOrdersByStatus = {
    pending: 12,
    approved: 8,
    processing: 5,
    shipped: 15,
    delivered: 45,
    cancelled: 3,
  };

  const mockTopProducts = [
    { name: "Modern Chair", sold: 125, revenue: 187500 },
    { name: "Wooden Table", sold: 98, revenue: 294000 },
    { name: "Ceiling Light", sold: 87, revenue: 130500 },
    { name: "Floor Lamp", sold: 76, revenue: 91200 },
    { name: "Decorative Rug", sold: 65, revenue: 58500 },
  ];

  const dailyRevenue = data?.dailyRevenue || mockDailyRevenue;
  const ordersByStatus = data?.ordersByStatus || mockOrdersByStatus;
  const topProducts = data?.topProducts || mockTopProducts;
  const summary = data?.summary || {
    totalRevenue: dailyRevenue.reduce((sum, d) => sum + d.revenue, 0),
    totalOrders: dailyRevenue.reduce((sum, d) => sum + d.orders, 0),
    totalCustomers: 156,
    avgOrderValue: 2850,
    revenueGrowth: 15.3,
    orderGrowth: 8.7,
  };

  const summaryCards = [
    {
      title: "รายได้รวม",
      value: `฿${summary.totalRevenue.toLocaleString()}`,
      change: `+${summary.revenueGrowth}%`,
      positive: summary.revenueGrowth > 0,
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-100",
    },
    {
      title: "คำสั่งซื้อทั้งหมด",
      value: summary.totalOrders.toString(),
      change: `+${summary.orderGrowth}%`,
      positive: summary.orderGrowth > 0,
      icon: Package,
      color: "text-blue-600",
      bgColor: "bg-blue-100",
    },
    {
      title: "ลูกค้า",
      value: summary.totalCustomers.toString(),
      change: "+12",
      positive: true,
      icon: Users,
      color: "text-purple-600",
      bgColor: "bg-purple-100",
    },
    {
      title: "ค่าเฉลี่ยต่อออเดอร์",
      value: `฿${summary.avgOrderValue.toLocaleString()}`,
      change: "+5.2%",
      positive: true,
      icon: TrendingUp,
      color: "text-orange-600",
      bgColor: "bg-orange-100",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">วิเคราะห์ข้อมูล</h1>
        <p className="text-muted-foreground mt-1">ภาพรวมผลประกอบการของร้าน</p>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryCards.map((card) => (
          <Card key={card.title} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className={`w-12 h-12 rounded-xl ${card.bgColor} flex items-center justify-center`}>
                <card.icon className={`w-6 h-6 ${card.color}`} />
              </div>
              <span
                className={`text-sm font-medium ${
                  card.positive ? "text-green-600" : "text-red-600"
                }`}
              >
                {card.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-foreground">{card.value}</h3>
            <p className="text-sm text-muted-foreground mt-1">{card.title}</p>
          </Card>
        ))}
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RevenueChart data={dailyRevenue} />
        <OrdersChart data={dailyRevenue} />
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <OrderStatusChart data={ordersByStatus} />
        <TopProductsChart data={topProducts} />
      </div>
    </div>
  );
}

