"use client";

import React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle2, Package, ArrowRight } from "lucide-react";
import confetti from "canvas-confetti";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const orderId = searchParams.get("orderId");

  React.useEffect(() => {
    // Celebration confetti
    const duration = 3 * 1000;
    const animationEnd = Date.now() + duration;

    const randomInRange = (min: number, max: number) => {
      return Math.random() * (max - min) + min;
    };

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();

      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }

      const particleCount = 50 * (timeLeft / duration);

      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
      });
      confetti({
        startVelocity: 30,
        spread: 360,
        ticks: 60,
        zIndex: 0,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
      });
    }, 250);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-b from-green-50 to-white flex items-center justify-center p-6">
      <Card className="p-8 text-center max-w-md w-full">
        <div className="mb-6">
          <div className="w-20 h-20 rounded-full bg-green-100 flex items-center justify-center mx-auto mb-4 animate-bounce">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold text-green-600 mb-2">
            ชำระเงินสำเร็จ!
          </h1>
          <p className="text-muted-foreground">
            ขอบคุณสำหรับการสั่งซื้อ เราจะดำเนินการจัดส่งให้เร็วที่สุด
          </p>
        </div>

        {orderId && (
          <div className="bg-muted/50 rounded-xl p-4 mb-6">
            <p className="text-sm text-muted-foreground mb-1">หมายเลขคำสั่งซื้อ</p>
            <p className="font-mono font-medium text-lg">{orderId}</p>
          </div>
        )}

        <div className="space-y-4 text-left mb-6">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <Package className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium">จะเกิดอะไรขึ้นต่อไป?</p>
              <p className="text-sm text-muted-foreground">
                ทีมงานจะตรวจสอบและเตรียมสินค้าให้คุณ จากนั้นจะแจ้งหมายเลขพัสดุทางอีเมล
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          {orderId && (
            <Button asChild className="w-full">
              <Link href={`/orders/${orderId}`}>
                ดูรายละเอียดคำสั่งซื้อ
                <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          )}
          <Button variant="outline" asChild className="w-full">
            <Link href="/shop">ซื้อสินค้าต่อ</Link>
          </Button>
        </div>
      </Card>
    </div>
  );
}

