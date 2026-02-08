"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getServerUrl } from "@/lib/server-url";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import {
  Plus,
  Edit,
  Trash2,
  MapPin,
  Star,
  X,
} from "lucide-react";

const THAI_PROVINCES = [
  "กรุงเทพมหานคร", "กระบี่", "กาญจนบุรี", "กาฬสินธุ์", "กำแพงเพชร",
  "ขอนแก่น", "จันทบุรี", "ฉะเชิงเทรา", "ชลบุรี", "ชัยนาท",
  "ชัยภูมิ", "ชุมพร", "เชียงราย", "เชียงใหม่", "ตรัง",
  "ตราด", "ตาก", "นครนายก", "นครปฐม", "นครพนม",
  "นครราชสีมา", "นครศรีธรรมราช", "นครสวรรค์", "นนทบุรี", "นราธิวาส",
  "น่าน", "บึงกาฬ", "บุรีรัมย์", "ปทุมธานี", "ประจวบคีรีขันธ์",
  "ปราจีนบุรี", "ปัตตานี", "พระนครศรีอยุธยา", "พังงา", "พัทลุง",
  "พิจิตร", "พิษณุโลก", "เพชรบุรี", "เพชรบูรณ์", "แพร่",
  "พะเยา", "ภูเก็ต", "มหาสารคาม", "มุกดาหาร", "แม่ฮ่องสอน",
  "ยโสธร", "ยะลา", "ร้อยเอ็ด", "ระนอง", "ระยอง",
  "ราชบุรี", "ลพบุรี", "ลำปาง", "ลำพูน", "เลย",
  "ศรีสะเกษ", "สกลนคร", "สงขลา", "สตูล", "สมุทรปราการ",
  "สมุทรสงคราม", "สมุทรสาคร", "สระแก้ว", "สระบุรี", "สิงห์บุรี",
  "สุโขทัย", "สุพรรณบุรี", "สุราษฎร์ธานี", "สุรินทร์", "หนองคาย",
  "หนองบัวลำภู", "อ่างทอง", "อุดรธานี", "อุทัยธานี", "อุตรดิตถ์",
  "อุบลราชธานี", "อำนาจเจริญ"
];

type Address = {
  id: string;
  label?: string;
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  subdistrict?: string;
  district: string;
  province: string;
  postalCode: string;
  isDefault: boolean;
};

type AddressForm = Omit<Address, "id">;

const emptyForm: AddressForm = {
  label: "",
  recipientName: "",
  phone: "",
  addressLine1: "",
  addressLine2: "",
  subdistrict: "",
  district: "",
  province: "",
  postalCode: "",
  isDefault: false,
};

export default function AddressesPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isFormOpen, setIsFormOpen] = React.useState(false);
  const [editingAddress, setEditingAddress] = React.useState<Address | null>(null);
  const [form, setForm] = React.useState<AddressForm>(emptyForm);
  const [submitting, setSubmitting] = React.useState(false);

  React.useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/login");
      return;
    }

    if (session?.user) {
      fetchAddresses();
    }
  }, [session, sessionLoading, router]);

  const fetchAddresses = async () => {
    try {
      const res = await fetch(`${getServerUrl()}/api/user/addresses`, {
        credentials: "include",
      });

      if (res.ok) {
        const data = await res.json();
        setAddresses(data);
      }
    } catch (error) {
      console.error("Failed to fetch addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  const openAddForm = () => {
    setEditingAddress(null);
    setForm(emptyForm);
    setIsFormOpen(true);
  };

  const openEditForm = (address: Address) => {
    setEditingAddress(address);
    setForm({
      label: address.label || "",
      recipientName: address.recipientName,
      phone: address.phone,
      addressLine1: address.addressLine1,
      addressLine2: address.addressLine2 || "",
      subdistrict: address.subdistrict || "",
      district: address.district,
      province: address.province,
      postalCode: address.postalCode,
      isDefault: address.isDefault,
    });
    setIsFormOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const url = editingAddress
        ? `${getServerUrl()}/api/user/addresses/${editingAddress.id}`
        : `${getServerUrl()}/api/user/addresses`;
      const method = editingAddress ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(form),
      });

      if (res.ok) {
        toast.success(editingAddress ? "อัปเดตที่อยู่แล้ว" : "เพิ่มที่อยู่แล้ว");
        setIsFormOpen(false);
        fetchAddresses();
      } else {
        const data = await res.json();
        toast.error(data.error || "เกิดข้อผิดพลาด");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("ต้องการลบที่อยู่นี้หรือไม่?")) return;

    try {
      const res = await fetch(`${getServerUrl()}/api/user/addresses/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (res.ok) {
        toast.success("ลบที่อยู่แล้ว");
        setAddresses(addresses.filter((a) => a.id !== id));
      } else {
        toast.error("ไม่สามารถลบที่อยู่ได้");
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      const res = await fetch(`${getServerUrl()}/api/user/addresses/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ isDefault: true }),
      });

      if (res.ok) {
        toast.success("ตั้งเป็นที่อยู่หลักแล้ว");
        fetchAddresses();
      }
    } catch (error) {
      toast.error("เกิดข้อผิดพลาด");
    }
  };

  if (sessionLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">ที่อยู่ของฉัน</h1>
          <Button onClick={openAddForm}>
            <Plus className="w-4 h-4 mr-2" />
            เพิ่มที่อยู่
          </Button>
        </div>

        {addresses.length === 0 ? (
          <Card className="p-12 text-center">
            <MapPin className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-lg font-semibold mb-2">ยังไม่มีที่อยู่</h2>
            <p className="text-muted-foreground mb-4">เพิ่มที่อยู่สำหรับการจัดส่งสินค้า</p>
            <Button onClick={openAddForm}>
              <Plus className="w-4 h-4 mr-2" />
              เพิ่มที่อยู่ใหม่
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {addresses.map((address) => (
              <Card key={address.id} className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {address.label && (
                        <span className="text-sm font-medium text-primary">
                          {address.label}
                        </span>
                      )}
                      {address.isDefault && (
                        <span className="px-2 py-0.5 text-xs bg-primary/10 text-primary rounded-full flex items-center gap-1">
                          <Star className="w-3 h-3" />
                          ที่อยู่หลัก
                        </span>
                      )}
                    </div>
                    <p className="font-medium">{address.recipientName}</p>
                    <p className="text-sm text-muted-foreground">{address.phone}</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      {address.addressLine1}
                      {address.addressLine2 && `, ${address.addressLine2}`}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {[address.subdistrict, address.district, address.province, address.postalCode]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!address.isDefault && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleSetDefault(address.id)}
                      >
                        ตั้งเป็นหลัก
                      </Button>
                    )}
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openEditForm(address)}
                    >
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      onClick={() => handleDelete(address.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Address Form Modal */}
        {isFormOpen && (
          <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <Card className="w-full max-w-2xl p-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold">
                  {editingAddress ? "แก้ไขที่อยู่" : "เพิ่มที่อยู่ใหม่"}
                </h2>
                <Button variant="ghost" size="icon" onClick={() => setIsFormOpen(false)}>
                  <X className="w-5 h-5" />
                </Button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <Label htmlFor="label">ป้ายกำกับ (เช่น บ้าน, ที่ทำงาน)</Label>
                  <Input
                    id="label"
                    value={form.label}
                    onChange={(e) => setForm({ ...form, label: e.target.value })}
                    placeholder="บ้าน"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="recipientName">ชื่อผู้รับ *</Label>
                    <Input
                      id="recipientName"
                      value={form.recipientName}
                      onChange={(e) => setForm({ ...form, recipientName: e.target.value })}
                      required
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="addressLine1">ที่อยู่ *</Label>
                  <Input
                    id="addressLine1"
                    value={form.addressLine1}
                    onChange={(e) => setForm({ ...form, addressLine1: e.target.value })}
                    placeholder="บ้านเลขที่ ซอย ถนน"
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="addressLine2">ที่อยู่เพิ่มเติม</Label>
                  <Input
                    id="addressLine2"
                    value={form.addressLine2}
                    onChange={(e) => setForm({ ...form, addressLine2: e.target.value })}
                    placeholder="อาคาร ชั้น ห้อง"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="subdistrict">ตำบล/แขวง</Label>
                    <Input
                      id="subdistrict"
                      value={form.subdistrict}
                      onChange={(e) => setForm({ ...form, subdistrict: e.target.value })}
                    />
                  </div>
                  <div>
                    <Label htmlFor="district">อำเภอ/เขต *</Label>
                    <Input
                      id="district"
                      value={form.district}
                      onChange={(e) => setForm({ ...form, district: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="province">จังหวัด *</Label>
                    <Select
                      value={form.province}
                      onValueChange={(value) => setForm({ ...form, province: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="เลือกจังหวัด" />
                      </SelectTrigger>
                      <SelectContent>
                        {THAI_PROVINCES.map((province) => (
                          <SelectItem key={province} value={province}>
                            {province}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="postalCode">รหัสไปรษณีย์ *</Label>
                    <Input
                      id="postalCode"
                      value={form.postalCode}
                      onChange={(e) => setForm({ ...form, postalCode: e.target.value })}
                      maxLength={5}
                      required
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="isDefault"
                    checked={form.isDefault}
                    onChange={(e) => setForm({ ...form, isDefault: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <Label htmlFor="isDefault" className="cursor-pointer">
                    ตั้งเป็นที่อยู่หลัก
                  </Label>
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
                    {submitting ? "กำลังบันทึก..." : editingAddress ? "อัปเดต" : "เพิ่ม"}
                  </Button>
                </div>
              </form>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
