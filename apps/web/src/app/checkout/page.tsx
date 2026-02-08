"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/service/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { getServerUrl } from "@/lib/server-url";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { ArrowLeft, ShoppingBag, Truck, CreditCard } from "lucide-react";

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

type ShippingForm = {
  recipientName: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  subdistrict: string;
  district: string;
  province: string;
  postalCode: string;
};

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const syncWithServer = useCartStore((s) => s.syncWithServer);

  const [form, setForm] = React.useState<ShippingForm>({
    recipientName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    subdistrict: "",
    district: "",
    province: "",
    postalCode: "",
  });

  const [submitting, setSubmitting] = React.useState(false);
  const [step, setStep] = React.useState<"shipping" | "review">("shipping");

  // Sync cart on load
  React.useEffect(() => {
    syncWithServer();
  }, [syncWithServer]);

  // Redirect if not logged in
  React.useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/login?redirect=/checkout");
    }
  }, [session, sessionLoading, router]);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shippingCost = subtotal >= 1000 ? 0 : 50; // Free shipping over ฿1000
  const total = subtotal + shippingCost;

  const handleInputChange = (field: keyof ShippingForm, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    return (
      form.recipientName.trim() &&
      form.phone.trim() &&
      form.addressLine1.trim() &&
      form.district.trim() &&
      form.province.trim() &&
      form.postalCode.trim()
    );
  };

  const handleSubmitOrder = async () => {
    if (!session?.user) {
      toast.error("กรุณาเข้าสู่ระบบก่อนสั่งซื้อ");
      return;
    }

    if (!isFormValid()) {
      toast.error("กรุณากรอกข้อมูลที่อยู่ให้ครบถ้วน");
      return;
    }

    if (items.length === 0) {
      toast.error("ไม่มีสินค้าในตะกร้า");
      return;
    }

    setSubmitting(true);

    try {
      // First sync cart to ensure latest prices/stock
      const syncResult = await syncWithServer();
      if (!syncResult.ok) {
        toast.error("ไม่สามารถตรวจสอบสินค้าได้ กรุณาลองใหม่");
        setSubmitting(false);
        return;
      }

      if (syncResult.conflicts.length > 0) {
        toast.warning("มีการเปลี่ยนแปลงในตะกร้า กรุณาตรวจสอบอีกครั้ง");
        setSubmitting(false);
        return;
      }

      // Create shipping address string
      const shippingAddress = [
        form.recipientName,
        form.phone,
        form.addressLine1,
        form.addressLine2,
        form.subdistrict,
        form.district,
        form.province,
        form.postalCode,
      ]
        .filter(Boolean)
        .join(", ");

      // Create order
      const res = await fetch(`${getServerUrl()}/api/checkout/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.id,
            quantity: item.quantity,
          })),
          shippingAddress,
          shippingCost,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "ไม่สามารถสร้างคำสั่งซื้อได้");
      }

      const { orderId, paymentId } = await res.json();

      // Clear cart after successful order
      clearCart();

      // Redirect to payment page
      router.push(`/checkout/payment?orderId=${orderId}&paymentId=${paymentId}`);
    } catch (error: any) {
      toast.error(error.message || "เกิดข้อผิดพลาด กรุณาลองใหม่");
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6">
        <ShoppingBag className="w-16 h-16 text-muted-foreground mb-4" />
        <h1 className="text-2xl font-bold mb-2">ตะกร้าว่างเปล่า</h1>
        <p className="text-muted-foreground mb-6">ไปเลือกสินค้าที่ชอบกันเถอะ!</p>
        <Button asChild>
          <Link href="/shop">เลือกซื้อสินค้า</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">ชำระเงิน</h1>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-2">
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                step === "shipping" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <Truck className="w-4 h-4" />
              <span className="text-sm font-medium">ที่อยู่จัดส่ง</span>
            </div>
            <div className="w-8 h-px bg-muted" />
            <div
              className={`flex items-center gap-2 px-4 py-2 rounded-full ${
                step === "review" ? "bg-primary text-primary-foreground" : "bg-muted"
              }`}
            >
              <CreditCard className="w-4 h-4" />
              <span className="text-sm font-medium">ตรวจสอบและชำระเงิน</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {step === "shipping" && (
              <Card className="p-6">
                <h2 className="text-lg font-semibold mb-6 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  ที่อยู่จัดส่ง
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="md:col-span-2">
                    <Label htmlFor="recipientName">ชื่อผู้รับ *</Label>
                    <Input
                      id="recipientName"
                      value={form.recipientName}
                      onChange={(e) => handleInputChange("recipientName", e.target.value)}
                      placeholder="ชื่อ-นามสกุล"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="phone">เบอร์โทรศัพท์ *</Label>
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => handleInputChange("phone", e.target.value)}
                      placeholder="08X-XXX-XXXX"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="addressLine1">ที่อยู่ (บ้านเลขที่, ซอย, ถนน) *</Label>
                    <Input
                      id="addressLine1"
                      value={form.addressLine1}
                      onChange={(e) => handleInputChange("addressLine1", e.target.value)}
                      placeholder="123 ซอย ABC ถนน XYZ"
                    />
                  </div>

                  <div className="md:col-span-2">
                    <Label htmlFor="addressLine2">ที่อยู่เพิ่มเติม (อาคาร, ชั้น)</Label>
                    <Input
                      id="addressLine2"
                      value={form.addressLine2}
                      onChange={(e) => handleInputChange("addressLine2", e.target.value)}
                      placeholder="ตึก A ชั้น 5"
                    />
                  </div>

                  <div>
                    <Label htmlFor="subdistrict">ตำบล/แขวง</Label>
                    <Input
                      id="subdistrict"
                      value={form.subdistrict}
                      onChange={(e) => handleInputChange("subdistrict", e.target.value)}
                      placeholder="ตำบล/แขวง"
                    />
                  </div>

                  <div>
                    <Label htmlFor="district">อำเภอ/เขต *</Label>
                    <Input
                      id="district"
                      value={form.district}
                      onChange={(e) => handleInputChange("district", e.target.value)}
                      placeholder="อำเภอ/เขต"
                    />
                  </div>

                  <div>
                    <Label htmlFor="province">จังหวัด *</Label>
                    <Select
                      value={form.province}
                      onValueChange={(value) => handleInputChange("province", value)}
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
                      onChange={(e) => handleInputChange("postalCode", e.target.value)}
                      placeholder="10XXX"
                      maxLength={5}
                    />
                  </div>
                </div>

                <div className="mt-6 flex justify-end">
                  <Button
                    onClick={() => setStep("review")}
                    disabled={!isFormValid()}
                  >
                    ถัดไป
                  </Button>
                </div>
              </Card>
            )}

            {step === "review" && (
              <>
                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">ที่อยู่จัดส่ง</h2>
                  <div className="text-sm space-y-1 text-muted-foreground">
                    <p className="font-medium text-foreground">{form.recipientName}</p>
                    <p>{form.phone}</p>
                    <p>{form.addressLine1}</p>
                    {form.addressLine2 && <p>{form.addressLine2}</p>}
                    <p>
                      {[form.subdistrict, form.district, form.province, form.postalCode]
                        .filter(Boolean)
                        .join(" ")}
                    </p>
                  </div>
                  <Button
                    variant="link"
                    className="mt-2 p-0 h-auto"
                    onClick={() => setStep("shipping")}
                  >
                    แก้ไขที่อยู่
                  </Button>
                </Card>

                <Card className="p-6">
                  <h2 className="text-lg font-semibold mb-4">สินค้าในตะกร้า</h2>
                  <div className="space-y-4">
                    {items.map((item) => (
                      <div key={item.id} className="flex gap-4">
                        <div className="w-16 h-16 rounded-lg bg-muted overflow-hidden">
                          {item.image ? (
                            <img
                              src={item.image}
                              alt={item.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              ?
                            </div>
                          )}
                        </div>
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ฿{item.price.toLocaleString()} x {item.quantity}
                          </p>
                        </div>
                        <div className="text-right font-medium">
                          ฿{(item.price * item.quantity).toLocaleString()}
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>
              </>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="p-6 sticky top-6">
              <h2 className="text-lg font-semibold mb-4">สรุปคำสั่งซื้อ</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">
                    ยอดรวม ({items.reduce((s, i) => s + i.quantity, 0)} ชิ้น)
                  </span>
                  <span>฿{subtotal.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">ค่าจัดส่ง</span>
                  <span>
                    {shippingCost === 0 ? (
                      <span className="text-green-600">ฟรี</span>
                    ) : (
                      `฿${shippingCost}`
                    )}
                  </span>
                </div>
                {shippingCost > 0 && (
                  <p className="text-xs text-muted-foreground">
                    ฟรีค่าส่งเมื่อซื้อครบ ฿1,000
                  </p>
                )}
                <div className="border-t pt-3 flex justify-between text-base font-semibold">
                  <span>ยอดรวมทั้งหมด</span>
                  <span>฿{total.toLocaleString()}</span>
                </div>
              </div>

              {step === "review" && (
                <Button
                  className="w-full mt-6"
                  size="lg"
                  onClick={handleSubmitOrder}
                  disabled={submitting}
                >
                  {submitting ? "กำลังสร้างคำสั่งซื้อ..." : "ดำเนินการชำระเงิน"}
                </Button>
              )}
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

