"use client";

import React from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { getServerUrl } from "@/lib/server-url";
import { authClient } from "@/lib/auth-client";
import { toast } from "sonner";
import { Clock, CheckCircle2, XCircle, ArrowLeft, RefreshCw, QrCode } from "lucide-react";

type PaymentStatus = "pending" | "processing" | "successful" | "failed" | "expired";

type PaymentInfo = {
  id: string;
  orderId: string;
  status: PaymentStatus;
  amount: string;
  qrCodeUrl?: string;
  expiresAt?: string;
  method: string;
};

export default function PaymentPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const paymentId = searchParams.get("paymentId");

  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const [payment, setPayment] = React.useState<PaymentInfo | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [polling, setPolling] = React.useState(false);
  const [timeLeft, setTimeLeft] = React.useState<number | null>(null);

  // Fetch payment info
  const fetchPayment = React.useCallback(async () => {
    if (!paymentId) return;

    try {
      const res = await fetch(`${getServerUrl()}/api/payments/${paymentId}`, {
        credentials: "include",
      });

      if (!res.ok) {
        throw new Error("ไม่พบข้อมูลการชำระเงิน");
      }

      const data = await res.json();
      setPayment(data);

      // Handle status changes
      if (data.status === "successful") {
        router.push(`/checkout/success?orderId=${orderId}`);
      } else if (data.status === "failed") {
        router.push(`/checkout/failed?orderId=${orderId}`);
      }
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setLoading(false);
    }
  }, [paymentId, orderId, router]);

  // Initial fetch
  React.useEffect(() => {
    if (!sessionLoading && !session?.user) {
      router.push("/login");
      return;
    }

    if (paymentId) {
      fetchPayment();
    }
  }, [sessionLoading, session, paymentId, fetchPayment, router]);

  // Poll for payment status
  React.useEffect(() => {
    if (!payment || payment.status !== "pending") return;

    setPolling(true);
    const interval = setInterval(fetchPayment, 5000); // Poll every 5 seconds

    return () => {
      clearInterval(interval);
      setPolling(false);
    };
  }, [payment?.status, fetchPayment]);

  // Countdown timer
  React.useEffect(() => {
    if (!payment?.expiresAt) return;

    const updateTimer = () => {
      const expires = new Date(payment.expiresAt!).getTime();
      const now = Date.now();
      const diff = Math.max(0, Math.floor((expires - now) / 1000));
      setTimeLeft(diff);

      if (diff === 0) {
        setPayment((prev) => prev ? { ...prev, status: "expired" } : null);
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [payment?.expiresAt]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading || sessionLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-muted-foreground">กำลังโหลดข้อมูลการชำระเงิน...</p>
        </div>
      </div>
    );
  }

  if (!payment) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">ไม่พบข้อมูลการชำระเงิน</h1>
          <p className="text-muted-foreground mb-6">
            ลิงก์การชำระเงินไม่ถูกต้องหรือหมดอายุแล้ว
          </p>
          <Button asChild>
            <Link href="/cart">กลับไปตะกร้าสินค้า</Link>
          </Button>
        </Card>
      </div>
    );
  }

  if (payment.status === "expired") {
    return (
      <div className="min-h-screen flex items-center justify-center p-6">
        <Card className="p-8 text-center max-w-md">
          <Clock className="w-16 h-16 text-orange-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">QR Code หมดอายุ</h1>
          <p className="text-muted-foreground mb-6">
            เวลาในการชำระเงินหมดลงแล้ว กรุณาสั่งซื้อใหม่อีกครั้ง
          </p>
          <div className="space-y-3">
            <Button asChild className="w-full">
              <Link href="/cart">กลับไปตะกร้าสินค้า</Link>
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-lg mx-auto px-4">
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/cart">
              <ArrowLeft className="w-5 h-5" />
            </Link>
          </Button>
          <h1 className="text-2xl font-bold">ชำระเงินด้วย PromptPay</h1>
        </div>

        <Card className="p-6 text-center">
          {/* QR Code */}
          <div className="mb-6">
            {payment.qrCodeUrl ? (
              <div className="bg-white p-4 rounded-xl inline-block shadow-inner">
                <img
                  src={payment.qrCodeUrl}
                  alt="PromptPay QR Code"
                  className="w-64 h-64 mx-auto"
                />
              </div>
            ) : (
              <div className="w-64 h-64 mx-auto bg-muted rounded-xl flex items-center justify-center">
                <QrCode className="w-16 h-16 text-muted-foreground" />
              </div>
            )}
          </div>

          {/* Amount */}
          <div className="mb-6">
            <p className="text-sm text-muted-foreground mb-1">ยอดที่ต้องชำระ</p>
            <p className="text-4xl font-bold text-primary">
              ฿{parseFloat(payment.amount).toLocaleString()}
            </p>
          </div>

          {/* Timer */}
          {timeLeft !== null && timeLeft > 0 && (
            <div className="mb-6 p-4 bg-orange-50 rounded-xl">
              <div className="flex items-center justify-center gap-2 text-orange-600">
                <Clock className="w-5 h-5" />
                <span className="text-sm font-medium">QR Code จะหมดอายุใน</span>
              </div>
              <p className="text-3xl font-mono font-bold text-orange-600 mt-2">
                {formatTime(timeLeft)}
              </p>
            </div>
          )}

          {/* Status */}
          <div className="mb-6 p-4 bg-blue-50 rounded-xl">
            <div className="flex items-center justify-center gap-2 text-blue-600">
              {polling && (
                <RefreshCw className="w-4 h-4 animate-spin" />
              )}
              <span className="text-sm font-medium">
                {polling ? "กำลังรอการชำระเงิน..." : "สแกน QR Code เพื่อชำระเงิน"}
              </span>
            </div>
          </div>

          {/* Instructions */}
          <div className="text-left text-sm text-muted-foreground space-y-2 mb-6">
            <p className="font-medium text-foreground">วิธีการชำระเงิน:</p>
            <ol className="list-decimal list-inside space-y-1">
              <li>เปิดแอปธนาคารของคุณ</li>
              <li>เลือกเมนู "สแกน" หรือ "QR Code"</li>
              <li>สแกน QR Code ด้านบน</li>
              <li>ตรวจสอบยอดเงินและยืนยันการโอน</li>
              <li>รอสักครู่ ระบบจะอัปเดตสถานะอัตโนมัติ</li>
            </ol>
          </div>

          {/* Order ID */}
          <div className="text-xs text-muted-foreground border-t pt-4">
            <p>หมายเลขคำสั่งซื้อ: {orderId}</p>
            <p>รหัสการชำระเงิน: {paymentId}</p>
          </div>
        </Card>

        <div className="mt-6 text-center">
          <Button variant="ghost" asChild>
            <Link href="/orders">ดูประวัติคำสั่งซื้อ</Link>
          </Button>
        </div>
      </div>
    </div>
  );
}

