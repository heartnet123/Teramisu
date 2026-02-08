"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Eye, Check, X, Truck } from "lucide-react";
import { getServerUrl } from "@/lib/server-url";

type Order = {
  id: string;
  userId: string;
  status: string;
  shipmentStatus?: string;
  totalAmount: string;
  shippingAddress?: string;
  trackingNumber?: string;
  notes?: string;
  createdAt: string;
  user?: {
    name: string;
    email: string;
  };
  items?: Array<{
    id: string;
    quantity: number;
    priceAtPurchase: string;
    product: {
      name: string;
      image?: string;
    };
  }>;
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = React.useState<Order[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedOrder, setSelectedOrder] = React.useState<Order | null>(null);

  const fetchOrders = async () => {
    try {
      const res = await fetch(`${getServerUrl()}/api/admin/orders`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setOrders(data);
      }
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchOrders();
  }, []);

  const handleApprove = async (orderId: string) => {
    try {
      const res = await fetch(`${getServerUrl()}/api/admin/orders/${orderId}/approve`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.ok) {
        fetchOrders();
      } else {
        alert("Failed to approve order");
      }
    } catch (error) {
      alert("Failed to approve order");
    }
  };

  const handleCancel = async (orderId: string) => {
    if (!confirm("Are you sure you want to cancel this order?")) return;

    try {
      const res = await fetch(`${getServerUrl()}/api/admin/orders/${orderId}/cancel`, {
        method: "PATCH",
        credentials: "include",
      });

      if (res.ok) {
        fetchOrders();
      } else {
        alert("Failed to cancel order");
      }
    } catch (error) {
      alert("Failed to cancel order");
    }
  };

  const filteredOrders = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user?.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.user?.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return <div className="flex items-center justify-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Orders</h1>
          <p className="text-muted-foreground mt-1">Manage customer orders and shipments</p>
        </div>
      </div>

      <Card className="p-6">
        <div className="flex items-center gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
            <Input
              placeholder="Search orders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-semibold text-foreground">Order ID</th>
                <th className="pb-3 font-semibold text-foreground">Customer</th>
                <th className="pb-3 font-semibold text-foreground">Date</th>
                <th className="pb-3 font-semibold text-foreground">Total</th>
                <th className="pb-3 font-semibold text-foreground">Status</th>
                <th className="pb-3 font-semibold text-foreground text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => (
                <tr key={order.id} className="border-b border-border last:border-0">
                  <td className="py-4">
                    <p className="font-mono text-sm text-foreground">{order.id.slice(0, 12)}...</p>
                  </td>
                  <td className="py-4">
                    <div>
                      <p className="font-medium text-foreground">{order.user?.name || "Unknown"}</p>
                      <p className="text-sm text-muted-foreground">{order.user?.email}</p>
                    </div>
                  </td>
                  <td className="py-4 text-foreground">
                    {new Date(order.createdAt).toLocaleDateString()}
                  </td>
                  <td className="py-4 text-foreground font-medium">
                    ${parseFloat(order.totalAmount).toFixed(2)}
                  </td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        order.status === "delivered"
                          ? "bg-green-100 text-green-700"
                          : order.status === "cancelled"
                          ? "bg-red-100 text-red-700"
                          : order.status === "approved"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-yellow-100 text-yellow-700"
                      }`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedOrder(order)}
                      >
                        <Eye size={16} />
                      </Button>
                      {order.status === "pending" && (
                        <>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(order.id)}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <Check size={16} />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleCancel(order.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <X size={16} />
                          </Button>
                        </>
                      )}
                      {(order.status === "approved" || order.status === "processing") && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setSelectedOrder(order)}
                          className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                        >
                          <Truck size={16} />
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No orders found
            </div>
          )}
        </div>
      </Card>

      {selectedOrder && (
        <OrderDetailsModal
          order={selectedOrder}
          onClose={() => setSelectedOrder(null)}
          onUpdate={() => {
            setSelectedOrder(null);
            fetchOrders();
          }}
        />
      )}
    </div>
  );
}

function OrderDetailsModal({
  order,
  onClose,
  onUpdate,
}: {
  order: Order;
  onClose: () => void;
  onUpdate: () => void;
}) {
  const [shipmentStatus, setShipmentStatus] = React.useState(order.shipmentStatus || "");
  const [trackingNumber, setTrackingNumber] = React.useState(order.trackingNumber || "");
  const [updating, setUpdating] = React.useState(false);

  const handleUpdateShipment = async () => {
    setUpdating(true);
    try {
      const res = await fetch(`${getServerUrl()}/api/admin/orders/${order.id}/shipment`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          shipmentStatus,
          trackingNumber: trackingNumber || undefined,
        }),
      });

      if (res.ok) {
        onUpdate();
      } else {
        alert("Failed to update shipment");
      }
    } catch (error) {
      alert("Failed to update shipment");
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-3xl p-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-foreground">Order Details</h2>
          <Button variant="ghost" onClick={onClose}>
            <X size={20} />
          </Button>
        </div>

        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Order ID</p>
              <p className="font-mono text-foreground">{order.id}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Date</p>
              <p className="text-foreground">{new Date(order.createdAt).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Customer</p>
              <p className="text-foreground">{order.user?.name}</p>
              <p className="text-sm text-muted-foreground">{order.user?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <span
                className={`inline-block px-2 py-1 rounded text-xs font-medium ${
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

          {order.shippingAddress && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Shipping Address</p>
              <p className="text-foreground">{order.shippingAddress}</p>
            </div>
          )}

          <div>
            <p className="text-sm font-semibold text-foreground mb-3">Order Items</p>
            <div className="space-y-2">
              {order.items?.map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-muted rounded-lg">
                  <div className="w-12 h-12 rounded bg-background overflow-hidden">
                    {item.product.image && (
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-foreground">{item.product.name}</p>
                    <p className="text-sm text-muted-foreground">
                      Qty: {item.quantity} × ${parseFloat(item.priceAtPurchase).toFixed(2)}
                    </p>
                  </div>
                  <p className="font-medium text-foreground">
                    ${(parseFloat(item.priceAtPurchase) * item.quantity).toFixed(2)}
                  </p>
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t border-border flex justify-between items-center">
              <p className="font-semibold text-foreground">Total</p>
              <p className="text-xl font-bold text-foreground">
                ${parseFloat(order.totalAmount).toFixed(2)}
              </p>
            </div>
          </div>

          {(order.status === "approved" || order.status === "processing") && (
            <div className="pt-4 border-t border-border">
              <p className="text-sm font-semibold text-foreground mb-3">Update Shipment</p>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Shipment Status
                  </label>
                  <select
                    value={shipmentStatus}
                    onChange={(e) => setShipmentStatus(e.target.value)}
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="">Select status</option>
                    <option value="preparing">Preparing</option>
                    <option value="shipped">Shipped</option>
                    <option value="in_transit">In Transit</option>
                    <option value="out_for_delivery">Out for Delivery</option>
                    <option value="delivered">Delivered</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm text-muted-foreground mb-2">
                    Tracking Number
                  </label>
                  <Input
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                  />
                </div>
                <Button
                  onClick={handleUpdateShipment}
                  disabled={!shipmentStatus || updating}
                  className="w-full"
                >
                  {updating ? "Updating..." : "Update Shipment"}
                </Button>
              </div>
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}
