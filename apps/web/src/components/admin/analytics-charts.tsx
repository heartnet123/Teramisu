"use client";

import React from "react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { Card } from "@/components/ui/card";

// Revenue Chart Component
type RevenueData = {
  date: string;
  revenue: number;
  orders: number;
};

export function RevenueChart({ data }: { data: RevenueData[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">รายได้รายวัน</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => `฿${(value / 1000).toFixed(0)}k`}
            />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: number) => [`฿${value.toLocaleString()}`, "รายได้"]}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
              }}
            />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#6366f1"
              strokeWidth={2}
              dot={{ fill: "#6366f1", strokeWidth: 2 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// Orders Chart Component
export function OrdersChart({ data }: { data: RevenueData[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">จำนวนคำสั่งซื้อ</h3>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
            <XAxis
              dataKey="date"
              stroke="#9ca3af"
              fontSize={12}
              tickFormatter={(value) => {
                const date = new Date(value);
                return `${date.getDate()}/${date.getMonth() + 1}`;
              }}
            />
            <YAxis stroke="#9ca3af" fontSize={12} />
            <Tooltip
              contentStyle={{
                background: "white",
                border: "1px solid #e5e7eb",
                borderRadius: "8px",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value: number) => [value, "คำสั่งซื้อ"]}
              labelFormatter={(label) => {
                const date = new Date(label);
                return date.toLocaleDateString("th-TH", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                });
              }}
            />
            <Bar dataKey="orders" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

// Order Status Distribution
type StatusData = {
  name: string;
  value: number;
  color: string;
};

const STATUS_COLORS: Record<string, string> = {
  pending: "#f59e0b",
  approved: "#3b82f6",
  processing: "#8b5cf6",
  shipped: "#06b6d4",
  delivered: "#10b981",
  cancelled: "#ef4444",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "รอยืนยัน",
  approved: "ยืนยันแล้ว",
  processing: "กำลังเตรียม",
  shipped: "จัดส่งแล้ว",
  delivered: "สำเร็จ",
  cancelled: "ยกเลิก",
};

export function OrderStatusChart({ data }: { data: Record<string, number> }) {
  const chartData: StatusData[] = Object.entries(data).map(([status, count]) => ({
    name: STATUS_LABELS[status] || status,
    value: count,
    color: STATUS_COLORS[status] || "#9ca3af",
  }));

  const total = chartData.reduce((sum, item) => sum + item.value, 0);

  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">สถานะคำสั่งซื้อ</h3>
      <div className="flex items-center gap-6">
        <div className="h-48 w-48">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={chartData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                paddingAngle={2}
                dataKey="value"
              >
                {chartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  background: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
                }}
                formatter={(value: number) => [value, "คำสั่งซื้อ"]}
              />
            </PieChart>
          </ResponsiveContainer>
        </div>
        <div className="flex-1 space-y-2">
          {chartData.map((item) => (
            <div key={item.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm">{item.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-medium">{item.value}</span>
                <span className="text-muted-foreground text-sm">
                  ({total > 0 ? ((item.value / total) * 100).toFixed(0) : 0}%)
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}

// Top Products Chart
type TopProduct = {
  name: string;
  sold: number;
  revenue: number;
};

export function TopProductsChart({ data }: { data: TopProduct[] }) {
  return (
    <Card className="p-6">
      <h3 className="text-lg font-semibold text-foreground mb-4">สินค้าขายดี</h3>
      <div className="space-y-4">
        {data.map((product, index) => {
          const maxSold = Math.max(...data.map((p) => p.sold));
          const percentage = maxSold > 0 ? (product.sold / maxSold) * 100 : 0;

          return (
            <div key={product.name}>
              <div className="flex items-center justify-between mb-1">
                <span className="text-sm font-medium flex items-center gap-2">
                  <span className="text-muted-foreground">{index + 1}.</span>
                  {product.name}
                </span>
                <span className="text-sm text-muted-foreground">
                  {product.sold} ชิ้น / ฿{product.revenue.toLocaleString()}
                </span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
        {data.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">ยังไม่มีข้อมูล</div>
        )}
      </div>
    </Card>
  );
}

