import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY;
const fromEmail = process.env.FROM_EMAIL || "orders@teramisu.com";

// Initialize Resend only if API key is available
const resend = resendApiKey ? new Resend(resendApiKey) : null;

export type OrderEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  items: Array<{
    name: string;
    quantity: number;
    price: number;
  }>;
  totalAmount: number;
  shippingAddress?: string;
};

export type ShipmentEmailData = {
  orderId: string;
  customerName: string;
  customerEmail: string;
  trackingNumber?: string;
  status: string;
};

// Order confirmation email template
function getOrderConfirmationHtml(data: OrderEmailData): string {
  const itemsHtml = data.items
    .map(
      (item) => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">฿${(item.price * item.quantity).toLocaleString()}</td>
    </tr>
  `
    )
    .join("");

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Teramisu</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">ขอบคุณสำหรับการสั่งซื้อ!</p>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #333;">สวัสดีคุณ ${data.customerName},</p>
      <p style="color: #666;">เราได้รับคำสั่งซื้อของคุณเรียบร้อยแล้ว และกำลังดำเนินการจัดส่ง</p>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #374151;">หมายเลขคำสั่งซื้อ:</strong>
        <span style="font-family: monospace; color: #6366f1;">${data.orderId}</span>
      </div>
      
      <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px;">รายการสินค้า</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background: #f9fafb;">
            <th style="padding: 10px; text-align: left; color: #6b7280;">สินค้า</th>
            <th style="padding: 10px; text-align: center; color: #6b7280;">จำนวน</th>
            <th style="padding: 10px; text-align: right; color: #6b7280;">ราคา</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 15px 10px; text-align: right; font-weight: bold; color: #374151;">รวมทั้งหมด:</td>
            <td style="padding: 15px 10px; text-align: right; font-weight: bold; font-size: 18px; color: #6366f1;">฿${data.totalAmount.toLocaleString()}</td>
          </tr>
        </tfoot>
      </table>
      
      ${
        data.shippingAddress
          ? `
      <h3 style="color: #374151; border-bottom: 2px solid #e5e7eb; padding-bottom: 10px; margin-top: 30px;">ที่อยู่จัดส่ง</h3>
      <p style="color: #666; white-space: pre-line;">${data.shippingAddress}</p>
      `
          : ""
      }
      
      <div style="margin-top: 30px; padding: 20px; background: #fef3c7; border-radius: 8px;">
        <p style="margin: 0; color: #92400e; font-size: 14px;">
          <strong>📦 สถานะ:</strong> กำลังเตรียมสินค้า<br>
          เราจะแจ้งเลขพัสดุให้คุณทราบทันทีที่จัดส่ง
        </p>
      </div>
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        หากมีข้อสงสัยหรือต้องการความช่วยเหลือ กรุณาติดต่อเราที่ support@teramisu.com<br>
        © 2024 Teramisu. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

// Shipment update email template
function getShipmentUpdateHtml(data: ShipmentEmailData): string {
  const statusMessages: Record<string, { emoji: string; text: string; color: string }> = {
    preparing: { emoji: "📦", text: "กำลังเตรียมสินค้า", color: "#f59e0b" },
    shipped: { emoji: "🚚", text: "จัดส่งแล้ว", color: "#3b82f6" },
    in_transit: { emoji: "🚛", text: "กำลังขนส่ง", color: "#8b5cf6" },
    out_for_delivery: { emoji: "🏃", text: "กำลังนำส่ง", color: "#06b6d4" },
    delivered: { emoji: "✅", text: "ส่งสำเร็จ", color: "#10b981" },
  };

  const statusInfo = statusMessages[data.status] || statusMessages.preparing;

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; margin: 0; padding: 0; background-color: #f9fafb;">
  <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
    <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
      <h1 style="color: white; margin: 0; font-size: 28px;">Teramisu</h1>
      <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0;">อัปเดตสถานะการจัดส่ง</p>
    </div>
    
    <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <p style="font-size: 16px; color: #333;">สวัสดีคุณ ${data.customerName},</p>
      
      <div style="text-align: center; padding: 30px; background: linear-gradient(to bottom, ${statusInfo.color}15, white); border-radius: 12px; margin: 20px 0;">
        <div style="font-size: 48px; margin-bottom: 15px;">${statusInfo.emoji}</div>
        <h2 style="color: ${statusInfo.color}; margin: 0; font-size: 24px;">${statusInfo.text}</h2>
      </div>
      
      <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #374151;">หมายเลขคำสั่งซื้อ:</strong>
        <span style="font-family: monospace; color: #6366f1;">${data.orderId}</span>
      </div>
      
      ${
        data.trackingNumber
          ? `
      <div style="background: #dbeafe; padding: 15px; border-radius: 8px; margin: 20px 0;">
        <strong style="color: #1e40af;">เลขติดตามพัสดุ:</strong>
        <span style="font-family: monospace; color: #1e40af; font-size: 18px;">${data.trackingNumber}</span>
      </div>
      `
          : ""
      }
      
      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
      
      <p style="color: #9ca3af; font-size: 12px; text-align: center;">
        หากมีข้อสงสัยหรือต้องการความช่วยเหลือ กรุณาติดต่อเราที่ support@teramisu.com<br>
        © 2024 Teramisu. All rights reserved.
      </p>
    </div>
  </div>
</body>
</html>
`;
}

export async function sendOrderConfirmationEmail(data: OrderEmailData): Promise<boolean> {
  if (!resend) {
    console.log("[Email] Resend not configured. Would send order confirmation to:", data.customerEmail);
    console.log("[Email] Order:", data.orderId);
    return true;
  }

  try {
    await resend.emails.send({
      from: `Teramisu <${fromEmail}>`,
      to: data.customerEmail,
      subject: `ยืนยันคำสั่งซื้อ #${data.orderId}`,
      html: getOrderConfirmationHtml(data),
    });
    console.log("[Email] Order confirmation sent to:", data.customerEmail);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send order confirmation:", error);
    return false;
  }
}

export async function sendShipmentUpdateEmail(data: ShipmentEmailData): Promise<boolean> {
  if (!resend) {
    console.log("[Email] Resend not configured. Would send shipment update to:", data.customerEmail);
    console.log("[Email] Order:", data.orderId, "Status:", data.status);
    return true;
  }

  try {
    const statusTexts: Record<string, string> = {
      shipped: "คำสั่งซื้อของคุณถูกจัดส่งแล้ว",
      in_transit: "พัสดุกำลังเดินทาง",
      out_for_delivery: "พัสดุกำลังนำส่ง",
      delivered: "จัดส่งสำเร็จ",
    };

    await resend.emails.send({
      from: `Teramisu <${fromEmail}>`,
      to: data.customerEmail,
      subject: `${statusTexts[data.status] || "อัปเดตสถานะ"} - คำสั่งซื้อ #${data.orderId}`,
      html: getShipmentUpdateHtml(data),
    });
    console.log("[Email] Shipment update sent to:", data.customerEmail);
    return true;
  } catch (error) {
    console.error("[Email] Failed to send shipment update:", error);
    return false;
  }
}

export async function sendAdminNewOrderNotification(
  adminEmail: string,
  orderData: { orderId: string; customerName: string; totalAmount: number }
): Promise<boolean> {
  if (!resend) {
    console.log("[Email] Resend not configured. Would send admin notification to:", adminEmail);
    return true;
  }

  try {
    await resend.emails.send({
      from: `Teramisu System <${fromEmail}>`,
      to: adminEmail,
      subject: `🛒 คำสั่งซื้อใหม่ #${orderData.orderId}`,
      html: `
        <h2>คำสั่งซื้อใหม่!</h2>
        <p>หมายเลข: <strong>${orderData.orderId}</strong></p>
        <p>ลูกค้า: ${orderData.customerName}</p>
        <p>ยอดรวม: <strong>฿${orderData.totalAmount.toLocaleString()}</strong></p>
        <p><a href="${process.env.ADMIN_URL || "http://localhost:3001"}/admin/orders">ดูรายละเอียด</a></p>
      `,
    });
    return true;
  } catch (error) {
    console.error("[Email] Failed to send admin notification:", error);
    return false;
  }
}

