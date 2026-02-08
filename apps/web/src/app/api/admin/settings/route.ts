import { NextRequest, NextResponse } from "next/server";
import { db, websiteSettings } from "@Teramisu/db";
import { eq } from "drizzle-orm";
import { auth } from "@Teramisu/auth";

export async function POST(request: NextRequest) {
  try {
    const session = await auth.api.getSession({
      headers: await request.headers,
    });

    if (!session || session.user.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { themeColors, banners, seoKeywords, seoTitle, seoDescription } = body;

    const existing = await db.select().from(websiteSettings).limit(1);

    const updateData: any = {};
    if (themeColors !== undefined) updateData.themeColors = themeColors;
    if (banners !== undefined) updateData.banners = banners;
    if (seoKeywords !== undefined) updateData.seoKeywords = seoKeywords;
    if (seoTitle !== undefined) updateData.seoTitle = seoTitle;
    if (seoDescription !== undefined) updateData.seoDescription = seoDescription;

    if (existing.length > 0) {
      await db
        .update(websiteSettings)
        .set(updateData)
        .where(eq(websiteSettings.id, existing[0].id));
    } else {
      await db.insert(websiteSettings).values({
        id: `settings-${Date.now()}`,
        ...updateData,
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating settings:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}
