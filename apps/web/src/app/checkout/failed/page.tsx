"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle, RefreshCw, MessageCircle } from "lucide-react";

export default function CheckoutFailedPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");
  const reason = searchParams.get("reason");

  const getErrorMessage = () => {
    switch (reason) {
      case "expired":
        return "QR Code หมดอายุแล้ว กรุณาลองสั่งซื้อใหม่อีกครั้ง";
      case "cancelled":
        return "การชำระเงินถูกยกเลิก";
      case "insufficient_funds":
        return "ยอดเงินในบัญชีไม่เพียงพอ";
      default:
        return "เกิดข้อผิดพลาดในการชำระเงิน กรุณาลองใหม่อีกครั้ง";
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-red-50 to-white flex items-center justify-center p-6">
      <Card className="p-8 text-center max-w-md w-full">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
            <XCircle className="w-10 h-10 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-red-600 mb-2">
            ชำระเงินไม่สำเร็จ
          </h1>
          <p className="text-muted-foreground">
            {getErrorMessage()}
          </p>
        </div>

        {orderId && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">หมายเลขคำสั่งซื้อ</p>
            <p className="font-mono font-medium">{orderId}</p>
          </div>
        )}

        <div className="space-y-3">
          <Button asChild className="w-full">
            <Link href="/cart">
              <RefreshCw className="w-4 h-4 mr-2" />
              ลองใหม่อีกครั้ง
            </Link>
          </Button>
          <Button variant="outline" asChild className="w-full">
            <Link href="/shop">กลับไปหน้าร้าน</Link>
          </Button>
        </div>

        <div className="mt-6 pt-6 border-t">
          <p className="text-sm text-muted-foreground mb-3">ต้องการความช่วยเหลือ?</p>
          <Button variant="ghost" size="sm" asChild>
            <a href="mailto:support@teramisu.com">
              <MessageCircle className="w-4 h-4 mr-2" />
              ติดต่อฝ่ายสนับสนุน
            </a>
          </Button>
        </div>
      </Card>
    </div>
  );
}

