"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getServerUrl } from "@/lib/server-url";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Ticket, X, Copy } from "lucide-react";

type Coupon = {
  id: string;
  code: string;
  name: string;
  description?: string;
  type: "percentage" | "fixed_amount" | "free_shipping";
  value: string;
  minPurchaseAmount?: string;
  maxDiscountAmount?: string;
  maxUses?: number;
  usedCount: number;
  maxUsesPerUser?: number;
  validFrom: string;
  validUntil: string;
  isActive: boolean;
};

const couponTypeLabels: Record<string, string> = {
  percentage: "ลดเปอร์เซ็นต์",
  fixed_amount: "ลดราคา",
  free_shipping: "ฟรีค่าส่ง",
};

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = React.useState<Coupon[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCoupon, setEditingCoupon] = React.useState<Coupon | null>(null);
  const [form, setForm] = React.useState({
    code: "",
    name: "",
    description: "",
    type: "percentage" as "percentage" | "fixed_amount" | "free_shipping",
    value: 0,
    minPurchaseAmount: 0,
    maxDiscountAmount: 0,
    maxUses: 0,
    maxUsesPerUser: 1,
    validFrom: "",
    validUntil: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchCoupons = async () => {
    try {
      const res = await fetch(`${getServerUrl()}/api/admin/coupons`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCoupons(data);
      }
    } catch (error) {
      console.error("Failed to fetch coupons:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCoupons();
  }, []);

  const openAddForm = () => {
    setEditingCoupon(null);
    const now = new Date();
    const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, now.getDate());
    setForm({
      code: "",
      name: "",
      description: "",
      type: "percentage",
      value: 10,
      minPurchaseAmount: 0,
      maxDiscountAmount: 0,
      maxUses: 0,
      maxUsesPerUser: 1,
      validFrom: now.toISOString().split("T")[0],
      validUntil: nextMonth.toISOString().split("T")[0],
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setForm({
      code: coupon.code,
      name: coupon.name,
      description: coupon.description || "",
      type: coupon.type,
      value: parseFloat(coupon.value),
      minPurchaseAmount: coupon.minPurchaseAmount ? parseFloat(coupon.minPurchaseAmount) : 0,
      maxDiscountAmount: coupon.maxDiscountAmount ? parseFloat(coupon.maxDiscountAmount) : 0,
      maxUses: coupon.maxUses || 0,
      maxUsesPerUser: coupon.maxUsesPerUser || 1,
      validFrom: coupon.validFrom.split("T")[0],
      validUntil: coupon.validUntil.split("T")[0],
      isActive: coupon.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingCoupon
        ? `${getServerUrl()}/api/admin/coupons/${editingCoupon.id}`
        : `${getServerUrl()}/api/admin/coupons`;
      const method = editingCoupon ? "PATCH" : "POST";

      const body: any = { ...form };
      if (!body.maxUses) delete body.maxUses;
      if (!body.minPurchaseAmount) delete body.minPurchaseAmount;
      if (!body.maxDiscountAmount) delete body.maxDiscountAmount;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingCoupon ? "อัปเดตคูปองแล้ว" : "สร้างคูปองแล้ว");
        setIsFormOpen(false);
        fetchCoupons();
      } else {
        toast.error("เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบคูปองนี้หรือไม่?")) return;

    try {
      const res = await fetch(`${getServerUrl()}/api/admin/coupons/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("ลบคูปองแล้ว");
        setCoupons(coupons.filter((c) => c.id !== id));
      } else {
        toast.error("ไม่สามารถลบคูปองได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("คัดลอกโค้ดแล้ว");
  };

  const isExpired = (validUntil: string) => {
    return new Date(validUntil) < new Date();
  };

  const formatValue = (type: string, value: string) => {
    if (type === "percentage") return `${value}%`;
    if (type === "free_shipping") return "ฟรี";
    return `฿${parseFloat(value).toLocaleString()}`;
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">คูปองส่วนลด</h1>
          <p className="text-muted-foreground mt-1">จัดการคูปองและโปรโมชั่น</p>
        </div>
        <Button onClick={openAddForm} className="gap-2">
          <Plus size={18} />
          สร้างคูปอง
        </Button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-semibold text-foreground">คูปอง</th>
                <th className="pb-3 font-semibold text-foreground">ประเภท</th>
                <th className="pb-3 font-semibold text-foreground">ส่วนลด</th>
                <th className="pb-3 font-semibold text-foreground">การใช้งาน</th>
                <th className="pb-3 font-semibold text-foreground">ระยะเวลา</th>
                <th className="pb-3 font-semibold text-foreground">สถานะ</th>
                <th className="pb-3 font-semibold text-foreground text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {coupons.map((coupon) => {
                const expired = isExpired(coupon.validUntil);

                return (
                  <tr key={coupon.id} className="border-b border-border last:border-0">
                    <td className="py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                          <Ticket className="w-5 h-5 text-primary" />
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <p className="font-mono font-bold text-foreground">{coupon.code}</p>
                            <button
                              onClick={() => copyCode(coupon.code)}
                              className="p-1 hover:bg-muted rounded"
                            >
                              <Copy size={12} />
                            </button>
                          </div>
                          <p className="text-sm text-muted-foreground">{coupon.name}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 text-foreground">{couponTypeLabels[coupon.type]}</td>
                    <td className="py-4 font-semibold text-primary">
                      {formatValue(coupon.type, coupon.value)}
                    </td>
                    <td className="py-4 text-foreground">
                      {coupon.usedCount}
                      {coupon.maxUses ? ` / ${coupon.maxUses}` : " / ∞"}
                    </td>
                    <td className="py-4 text-sm text-muted-foreground">
                      <div>
                        {new Date(coupon.validFrom).toLocaleDateString("th-TH")}
                      </div>
                      <div>
                        ถึง {new Date(coupon.validUntil).toLocaleDateString("th-TH")}
                      </div>
                    </td>
                    <td className="py-4">
                      {expired ? (
                        <Badge variant="outline" className="text-gray-500">
                          หมดอายุ
                        </Badge>
                      ) : coupon.isActive ? (
                        <Badge className="bg-green-100 text-green-700">
                          เปิดใช้งาน
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          ปิดใช้งาน
                        </Badge>
                      )}
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => openEditForm(coupon)}>
                          <Edit size={16} />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(coupon.id)}
                          className="text-red-600 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {coupons.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">ยังไม่มีคูปอง</div>
          )}
        </div>
      </Card>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-xl p-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {editingCoupon ? "แก้ไขคูปอง" : "สร้างคูปองใหม่"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}>
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    รหัสคูปอง *
                  </label>
                  <Input
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="SAVE10"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ชื่อคูปอง *
                  </label>
                  <Input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    placeholder="ลด 10%"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  คำอธิบาย
                </label>
                <textarea
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  rows={2}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ประเภทส่วนลด *
                  </label>
                  <select
                    value={form.type}
                    onChange={(e) =>
                      setForm({ ...form, type: e.target.value as typeof form.type })
                    }
                    className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                  >
                    <option value="percentage">ลดเปอร์เซ็นต์ (%)</option>
                    <option value="fixed_amount">ลดราคา (฿)</option>
                    <option value="free_shipping">ฟรีค่าส่ง</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    มูลค่าส่วนลด *
                  </label>
                  <Input
                    type="number"
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: parseFloat(e.target.value) || 0 })}
                    min={0}
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ยอดขั้นต่ำ (฿)
                  </label>
                  <Input
                    type="number"
                    value={form.minPurchaseAmount || ""}
                    onChange={(e) =>
                      setForm({ ...form, minPurchaseAmount: parseFloat(e.target.value) || 0 })
                    }
                    min={0}
                    placeholder="0 = ไม่จำกัด"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ลดสูงสุด (฿)
                  </label>
                  <Input
                    type="number"
                    value={form.maxDiscountAmount || ""}
                    onChange={(e) =>
                      setForm({ ...form, maxDiscountAmount: parseFloat(e.target.value) || 0 })
                    }
                    min={0}
                    placeholder="0 = ไม่จำกัด"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    จำนวนครั้งที่ใช้ได้
                  </label>
                  <Input
                    type="number"
                    value={form.maxUses || ""}
                    onChange={(e) => setForm({ ...form, maxUses: parseInt(e.target.value) || 0 })}
                    min={0}
                    placeholder="0 = ไม่จำกัด"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    ใช้ได้/คน
                  </label>
                  <Input
                    type="number"
                    value={form.maxUsesPerUser}
                    onChange={(e) =>
                      setForm({ ...form, maxUsesPerUser: parseInt(e.target.value) || 1 })
                    }
                    min={1}
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    เริ่มใช้ได้ *
                  </label>
                  <Input
                    type="date"
                    value={form.validFrom}
                    onChange={(e) => setForm({ ...form, validFrom: e.target.value })}
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    หมดอายุ *
                  </label>
                  <Input
                    type="date"
                    value={form.validUntil}
                    onChange={(e) => setForm({ ...form, validUntil: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  checked={form.isActive}
                  onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                  className="w-4 h-4"
                />
                <label className="text-sm text-foreground">เปิดใช้งาน</label>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setIsFormOpen(false)}
                  disabled={submitting}
                >
                  ยกเลิก
                </Button>
                <Button type="submit" disabled={submitting}>
                  {submitting ? "กำลังบันทึก..." : editingCoupon ? "อัปเดต" : "สร้าง"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

