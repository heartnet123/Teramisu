"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Palette, Image, Search, Plus, X, Save } from "lucide-react";
import { toast } from "sonner";

type BannerType = {
  id: string;
  title: string;
  description?: string;
  image?: string;
  link?: string;
  isActive: boolean;
  order: number;
};

type SettingsType = {
  id: string;
  themeColors?: {
    primary?: string;
    secondary?: string;
    accent?: string;
    background?: string;
    foreground?: string;
  };
  banners?: BannerType[];
  seoKeywords?: string[];
  seoTitle?: string;
  seoDescription?: string;
} | null;

export function SettingsClient({
  currentSettings,
}: {
  currentSettings: SettingsType;
}) {
  const [themeColors, setThemeColors] = useState(
    currentSettings?.themeColors || {}
  );
  const [banners, setBanners] = useState<BannerType[]>(
    currentSettings?.banners || []
  );
  const [seoKeywords, setSeoKeywords] = useState<string[]>(
    currentSettings?.seoKeywords || []
  );
  const [seoTitle, setSeoTitle] = useState(currentSettings?.seoTitle || "");
  const [seoDescription, setSeoDescription] = useState(
    currentSettings?.seoDescription || ""
  );
  const [newKeyword, setNewKeyword] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSaveTheme = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ themeColors }),
      });

      if (response.ok) {
        toast.success("Theme colors saved successfully!");
      } else {
        toast.error("Failed to save theme colors");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveBanners = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ banners }),
      });

      if (response.ok) {
        toast.success("Banners saved successfully!");
      } else {
        toast.error("Failed to save banners");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSEO = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seoKeywords, seoTitle, seoDescription }),
      });

      if (response.ok) {
        toast.success("SEO settings saved successfully!");
      } else {
        toast.error("Failed to save SEO settings");
      }
    } catch (error) {
      toast.error("An error occurred");
    } finally {
      setSaving(false);
    }
  };

  const addBanner = () => {
    const newBanner: BannerType = {
      id: `banner-${Date.now()}`,
      title: "New Banner",
      description: "",
      image: "",
      link: "",
      isActive: true,
      order: banners.length,
    };
    setBanners([...banners, newBanner]);
  };

  const removeBanner = (id: string) => {
    setBanners(banners.filter((b) => b.id !== id));
  };

  const updateBanner = (id: string, field: keyof BannerType, value: any) => {
    setBanners(
      banners.map((b) => (b.id === id ? { ...b, [field]: value } : b))
    );
  };

  const addKeyword = () => {
    if (newKeyword.trim() && !seoKeywords.includes(newKeyword.trim())) {
      setSeoKeywords([...seoKeywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setSeoKeywords(seoKeywords.filter((k) => k !== keyword));
  };

  return (
    <Tabs defaultValue="theme" className="space-y-6">
      <TabsList className="grid w-full max-w-2xl grid-cols-3">
        <TabsTrigger value="theme">
          <Palette className="mr-2 h-4 w-4" />
          Theme Colors
        </TabsTrigger>
        <TabsTrigger value="banners">
          <Image className="mr-2 h-4 w-4" />
          Banners
        </TabsTrigger>
        <TabsTrigger value="seo">
          <Search className="mr-2 h-4 w-4" />
          SEO
        </TabsTrigger>
      </TabsList>

      <TabsContent value="theme" className="space-y-4">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">Theme Colors</h3>
          <div className="grid grid-cols-2 gap-4">
            {["primary", "secondary", "accent", "background", "foreground"].map(
              (colorKey) => (
                <div key={colorKey} className="space-y-2">
                  <Label htmlFor={colorKey} className="capitalize">
                    {colorKey}
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id={colorKey}
                      type="color"
                      value={
                        themeColors[colorKey as keyof typeof themeColors] ||
                        "#000000"
                      }
                      onChange={(e) =>
                        setThemeColors({
                          ...themeColors,
                          [colorKey]: e.target.value,
                        })
                      }
                      className="w-20 h-10"
                    />
                    <Input
                      type="text"
                      value={
                        themeColors[colorKey as keyof typeof themeColors] || ""
                      }
                      onChange={(e) =>
                        setThemeColors({
                          ...themeColors,
                          [colorKey]: e.target.value,
                        })
                      }
                      placeholder="#000000"
                      className="flex-1"
                    />
                  </div>
                </div>
              )
            )}
          </div>
          <Button
            onClick={handleSaveTheme}
            disabled={saving}
            className="mt-6 w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Theme Colors"}
          </Button>
        </Card>
      </TabsContent>

      <TabsContent value="banners" className="space-y-4">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-lg">Banners</h3>
            <Button onClick={addBanner} size="sm">
              <Plus className="mr-2 h-4 w-4" />
              Add Banner
            </Button>
          </div>
          <div className="space-y-4">
            {banners.map((banner) => (
              <Card key={banner.id} className="p-4 bg-muted/30">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label>Banner #{banner.order + 1}</Label>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeBanner(banner.id)}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label>Title</Label>
                      <Input
                        value={banner.title}
                        onChange={(e) =>
                          updateBanner(banner.id, "title", e.target.value)
                        }
                        placeholder="Banner title"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Link</Label>
                      <Input
                        value={banner.link || ""}
                        onChange={(e) =>
                          updateBanner(banner.id, "link", e.target.value)
                        }
                        placeholder="/shop"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Description</Label>
                    <Input
                      value={banner.description || ""}
                      onChange={(e) =>
                        updateBanner(banner.id, "description", e.target.value)
                      }
                      placeholder="Banner description"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Image URL</Label>
                    <Input
                      value={banner.image || ""}
                      onChange={(e) =>
                        updateBanner(banner.id, "image", e.target.value)
                      }
                      placeholder="https://..."
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={banner.isActive}
                      onChange={(e) =>
                        updateBanner(banner.id, "isActive", e.target.checked)
                      }
                      className="w-4 h-4"
                    />
                    <Label>Active</Label>
                  </div>
                </div>
              </Card>
            ))}
          </div>
          <Button
            onClick={handleSaveBanners}
            disabled={saving}
            className="mt-6 w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save Banners"}
          </Button>
        </Card>
      </TabsContent>

      <TabsContent value="seo" className="space-y-4">
        <Card className="p-6">
          <h3 className="font-semibold text-lg mb-4">SEO Settings</h3>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="seoTitle">SEO Title</Label>
              <Input
                id="seoTitle"
                value={seoTitle}
                onChange={(e) => setSeoTitle(e.target.value)}
                placeholder="Teramisu - Premium E-commerce"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="seoDescription">SEO Description</Label>
              <Input
                id="seoDescription"
                value={seoDescription}
                onChange={(e) => setSeoDescription(e.target.value)}
                placeholder="Shop the best products at Teramisu"
              />
            </div>
            <div className="space-y-2">
              <Label>SEO Keywords</Label>
              <div className="flex gap-2">
                <Input
                  value={newKeyword}
                  onChange={(e) => setNewKeyword(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && addKeyword()}
                  placeholder="Add keyword"
                />
                <Button onClick={addKeyword} size="sm">
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                {seoKeywords.map((keyword) => (
                  <div
                    key={keyword}
                    className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full text-sm"
                  >
                    {keyword}
                    <button
                      onClick={() => removeKeyword(keyword)}
                      className="hover:text-destructive"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <Button
            onClick={handleSaveSEO}
            disabled={saving}
            className="mt-6 w-full"
          >
            <Save className="mr-2 h-4 w-4" />
            {saving ? "Saving..." : "Save SEO Settings"}
          </Button>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
