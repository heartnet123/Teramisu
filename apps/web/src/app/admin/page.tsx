import { requireAdmin } from "@/lib/admin-guard";
import { Card } from "@/components/ui/card";
import { Users, DollarSign, ShoppingCart, TrendingUp, Package, MousePointerClick, Target } from "lucide-react";

async function getDashboardMetrics() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/metrics`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch metrics");
    return res.json();
  } catch (error) {
    return {
      totalMembers: 0,
      totalRevenue: 0,
      totalOrders: 0,
      recentOrders: [],
    };
  }
}

async function getRecommendationMetrics() {
  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'}/api/admin/recommendations/analytics`, {
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch recommendation metrics");
    return res.json();
  } catch (error) {
    return {
      overview: {
        totalViews: 0,
        totalClicks: 0,
        totalConversions: 0,
        ctr: 0,
        conversionRate: 0,
      },
      topRecommendations: [],
    };
  }
}

export default async function AdminDashboard() {
  await requireAdmin();
  const metrics = await getDashboardMetrics();
  const recMetrics = await getRecommendationMetrics();

  const avgRecentOrderValue =
    metrics?.recentOrders && metrics.recentOrders.length > 0
      ? metrics.recentOrders.reduce((sum: number, o: any) => sum + Number(o.totalAmount || 0), 0) /
        metrics.recentOrders.length
      : 0;

  const stats = [
    {
      name: "Total Members",
      value: metrics.totalMembers || 0,
      icon: Users,
      change: "+12.5%",
      positive: true,
    },
    {
      name: "Revenue (This Month)",
      value: `$${(metrics.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      change: "+23.1%",
      positive: true,
    },
    {
      name: "Total Orders",
      value: metrics.totalOrders || 0,
      icon: ShoppingCart,
      change: "+8.2%",
      positive: true,
    },
    {
      name: "Products",
      value: metrics.totalProducts || 0,
      icon: Package,
      change: "2 new",
      positive: true,
    },
    {
      name: "Avg Order (Recent)",
      value: `$${avgRecentOrderValue.toFixed(2)}`,
      icon: TrendingUp,
      change: metrics.recentOrders && metrics.recentOrders.length > 0 ? `${metrics.recentOrders.length} rec` : "—",
      positive: true,
    },
    {
      name: "Recent Orders",
      value: metrics.recentOrders ? metrics.recentOrders.length : 0,
      icon: ShoppingCart,
      change: metrics.recentOrders && metrics.recentOrders.length > 0 ? "+vs prev" : "—",
      positive: true,
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2">Dashboard Overview</h1>
        <p className="text-muted-foreground">
          Welcome back! Here's what's happening with your store today.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <Card key={stat.name} className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                <stat.icon className="w-6 h-6 text-primary" />
              </div>
              <span
                className={`text-sm font-medium ${
                  stat.positive ? "text-green-600" : "text-red-600"
                }`}
              >
                {stat.change}
              </span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{stat.value}</h3>
            <p className="text-sm text-muted-foreground">{stat.name}</p>
          </Card>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold text-foreground mb-4">Recommendation Performance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-blue-100 flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-blue-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{recMetrics.overview.totalViews.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Total Views</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-purple-100 flex items-center justify-center">
                <MousePointerClick className="w-6 h-6 text-purple-600" />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">{recMetrics.overview.totalClicks.toLocaleString()}</h3>
            <p className="text-sm text-muted-foreground">Total Clicks</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-green-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-green-600" />
              </div>
              <span className="text-sm font-medium text-green-600">
                {recMetrics.overview.ctr.toFixed(2)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">CTR</h3>
            <p className="text-sm text-muted-foreground">Click-Through Rate</p>
          </Card>
          <Card className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 rounded-lg bg-orange-100 flex items-center justify-center">
                <Target className="w-6 h-6 text-orange-600" />
              </div>
              <span className="text-sm font-medium text-orange-600">
                {recMetrics.overview.conversionRate.toFixed(2)}%
              </span>
            </div>
            <h3 className="text-2xl font-bold text-foreground mb-1">Conv. Rate</h3>
            <p className="text-sm text-muted-foreground">Conversion Rate</p>
          </Card>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <TrendingUp size={20} />
            Revenue Trend
          </h3>
          <div className="h-64 flex items-center justify-center bg-muted/50 rounded-lg">
            <p className="text-muted-foreground">Chart visualization will go here</p>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
            <ShoppingCart size={20} />
            Recent Orders
          </h3>
          <div className="space-y-3">
            {metrics.recentOrders && metrics.recentOrders.length > 0 ? (
              metrics.recentOrders.slice(0, 5).map((order: any) => (
                <div
                  key={order.id}
                  className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <div>
                    <p className="font-medium text-foreground text-sm">Order #{order.id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(order.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-foreground">${order.totalAmount}</p>
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                No recent orders
              </div>
            )}
          </div>
        </Card>
      </div>

      <Card className="p-6">
        <h3 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
          <Target size={20} />
          Top Recommended Products
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Recommended Product</th>
                <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Views</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Clicks</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">CTR</th>
                <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Conversions</th>
              </tr>
            </thead>
            <tbody>
              {recMetrics.topRecommendations && recMetrics.topRecommendations.length > 0 ? (
                recMetrics.topRecommendations.map((rec: any, idx: number) => (
                  <tr key={idx} className="border-b border-border hover:bg-muted/50 transition-colors">
                    <td className="py-3 px-4 text-sm font-medium text-foreground">{rec.productName}</td>
                    <td className="py-3 px-4 text-sm text-foreground">{rec.recommendedProductName}</td>
                    <td className="py-3 px-4 text-sm text-muted-foreground capitalize">{rec.recommendationType}</td>
                    <td className="py-3 px-4 text-sm text-right text-foreground">{rec.viewCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right text-foreground">{rec.clickCount.toLocaleString()}</td>
                    <td className="py-3 px-4 text-sm text-right font-medium text-foreground">{rec.ctr.toFixed(2)}%</td>
                    <td className="py-3 px-4 text-sm text-right text-foreground">{rec.conversionCount.toLocaleString()}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-muted-foreground">
                    No recommendation data available yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
