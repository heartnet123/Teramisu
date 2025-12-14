import { requireAdmin } from "@/lib/admin-guard";
import { db, websiteSettings } from "@Teramisu/db";
import { SettingsClient } from "./settings-client";

export default async function AdminSettingsPage() {
  await requireAdmin();

  const settings = await db.select().from(websiteSettings).limit(1);
  const currentSettings = settings[0] || null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Website Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage theme colors, banners, and SEO settings
        </p>
      </div>

      <SettingsClient currentSettings={currentSettings} />
    </div>
  );
}
