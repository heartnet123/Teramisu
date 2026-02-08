"use client";

import React from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getServerUrl } from "@/lib/server-url";
import { toast } from "sonner";
import { Plus, Edit, Trash2, FolderTree, X } from "lucide-react";

type Category = {
  id: string;
  name: string;
  slug: string;
  description?: string;
  image?: string;
  parentId?: string;
  sortOrder: number;
  isActive: boolean;
};

export default function AdminCategoriesPage() {
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingCategory, setEditingCategory] = React.useState<Category | null>(null);
  const [form, setForm] = React.useState({
    name: "",
    slug: "",
    description: "",
    image: "",
    parentId: "",
    sortOrder: 0,
    isActive: true,
  });
  const [submitting, setSubmitting] = React.useState(false);

  const fetchCategories = async () => {
    try {
      const res = await fetch(`${getServerUrl()}/api/admin/categories`, {
        credentials: "include",
      });
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (error) {
      console.error("Failed to fetch categories:", error);
    } finally {
      setLoading(false);
    }
  };

  React.useEffect(() => {
    fetchCategories();
  }, []);

  const openAddForm = () => {
    setEditingCategory(null);
    setForm({
      name: "",
      slug: "",
      description: "",
      image: "",
      parentId: "",
      sortOrder: 0,
      isActive: true,
    });
    setIsFormOpen(true);
  };

  const openEditForm = (category: Category) => {
    setEditingCategory(category);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description || "",
      image: category.image || "",
      parentId: category.parentId || "",
      sortOrder: category.sortOrder,
      isActive: category.isActive,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingCategory
        ? `${getServerUrl()}/api/admin/categories/${editingCategory.id}`
        : `${getServerUrl()}/api/admin/categories`;
      const method = editingCategory ? "PATCH" : "POST";

      const body: any = { ...form };
      if (!body.parentId) delete body.parentId;

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });

      if (res.ok) {
        toast.success(editingCategory ? "อัปเดตหมวดหมู่แล้ว" : "เพิ่มหมวดหมู่แล้ว");
        setIsFormOpen(false);
        fetchCategories();
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
    if (!confirm("ต้องการลบหมวดหมู่นี้หรือไม่?")) return;

    try {
      const res = await fetch(`${getServerUrl()}/api/admin/categories/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("ลบหมวดหมู่แล้ว");
        setCategories(categories.filter((c) => c.id !== id));
      } else {
        toast.error("ไม่สามารถลบหมวดหมู่ได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const getCategoryName = (id: string) => {
    const cat = categories.find((c) => c.id === id);
    return cat?.name || "ไม่ทราบ";
  };

  if (loading) {
    return <div className="flex items-center justify-center py-12">กำลังโหลด...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">หมวดหมู่สินค้า</h1>
          <p className="text-muted-foreground mt-1">จัดการหมวดหมู่สินค้าในร้าน</p>
        </div>
        <Button onClick={openAddForm} className="gap-2">
          <Plus size={18} />
          เพิ่มหมวดหมู่
        </Button>
      </div>

      <Card className="p-6">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border text-left">
                <th className="pb-3 font-semibold text-foreground">หมวดหมู่</th>
                <th className="pb-3 font-semibold text-foreground">Slug</th>
                <th className="pb-3 font-semibold text-foreground">หมวดหมู่หลัก</th>
                <th className="pb-3 font-semibold text-foreground">ลำดับ</th>
                <th className="pb-3 font-semibold text-foreground">สถานะ</th>
                <th className="pb-3 font-semibold text-foreground text-right">จัดการ</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((category) => (
                <tr key={category.id} className="border-b border-border last:border-0">
                  <td className="py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-muted overflow-hidden">
                        {category.image ? (
                          <img
                            src={category.image}
                            alt={category.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                            <FolderTree size={20} />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{category.name}</p>
                        {category.description && (
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {category.description}
                          </p>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 font-mono text-sm text-muted-foreground">
                    {category.slug}
                  </td>
                  <td className="py-4 text-foreground">
                    {category.parentId ? getCategoryName(category.parentId) : "-"}
                  </td>
                  <td className="py-4 text-foreground">{category.sortOrder}</td>
                  <td className="py-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        category.isActive
                          ? "bg-green-100 text-green-700"
                          : "bg-gray-100 text-gray-700"
                      }`}
                    >
                      {category.isActive ? "เปิดใช้งาน" : "ปิดใช้งาน"}
                    </span>
                  </td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => openEditForm(category)}>
                        <Edit size={16} />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(category.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 size={16} />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {categories.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              ยังไม่มีหมวดหมู่
            </div>
          )}
        </div>
      </Card>

      {/* Form Modal */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-foreground">
                {editingCategory ? "แก้ไขหมวดหมู่" : "เพิ่มหมวดหมู่ใหม่"}
              </h2>
              <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}>
                <X size={20} />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ชื่อหมวดหมู่ *
                </label>
                <Input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  Slug (ใช้ใน URL)
                </label>
                <Input
                  value={form.slug}
                  onChange={(e) => setForm({ ...form, slug: e.target.value })}
                  placeholder="auto-generated-from-name"
                />
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

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  URL รูปภาพ
                </label>
                <Input
                  value={form.image}
                  onChange={(e) => setForm({ ...form, image: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  หมวดหมู่หลัก
                </label>
                <select
                  value={form.parentId}
                  onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                  className="w-full px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                >
                  <option value="">ไม่มี (เป็นหมวดหมู่หลัก)</option>
                  {categories
                    .filter((c) => c.id !== editingCategory?.id)
                    .map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-2">
                  ลำดับการแสดง
                </label>
                <Input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) => setForm({ ...form, sortOrder: parseInt(e.target.value) || 0 })}
                />
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
                  {submitting ? "กำลังบันทึก..." : editingCategory ? "อัปเดต" : "เพิ่ม"}
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}

