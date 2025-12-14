'use client';
import React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Package, User as UserIcon, MapPin, Coffee } from "lucide-react";

type OrderItem = { image: string };
type Order = { id: string | number; date: string; status: string; items: OrderItem[]; total: number };

function getInitials(name?: string | null) {
  if (!name) return "U";
  return name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export default function ProfilePage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const remoteUser = session?.user;
  const [orders] = React.useState<Order[]>([]);

  // Local optimistic state for the editable profile
  const [localUser, setLocalUser] = React.useState(() => ({
    name: remoteUser?.name ?? "",
    email: remoteUser?.email ?? "",
    image: remoteUser?.image ?? "",
  }));
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!isPending && !remoteUser) {
      router.push("/login");
    }
  }, [isPending, remoteUser, router]);

  // Keep local state in sync when session loads/changes
  React.useEffect(() => {
    setLocalUser({
      name: remoteUser?.name ?? "",
      email: remoteUser?.email ?? "",
      image: remoteUser?.image ?? "",
    });
  }, [remoteUser?.name, remoteUser?.email, remoteUser?.image]);

  if (isPending) return null;
  if (!remoteUser) return null;

  const validate = () => {
    if (!localUser.name || localUser.name.trim().length < 2) {
      return "Display name must be at least 2 characters.";
    }
    // image is optional but if provided, do a simple URL check
    if (localUser.image && !/^https?:\/\/.+\..+/.test(localUser.image)) {
      return "Image must be a valid URL (starting with http/https).";
    }
    return null;
  };

  // Optimistic update + rollback
  const onUpdate = async () => {
    setError(null);
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return;
    }

    const previous = {
      name: remoteUser.name ?? "",
      email: remoteUser.email ?? "",
      image: remoteUser.image ?? "",
    };

    // Optimistically update UI (local state already shows edits)
    setSaving(true);

    try {
      // Attempt request to server - relative path to allow proxying
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: localUser.name, image: localUser.image }),
      });

      if (!res.ok) {
        const payload = await res.json().catch(() => ({}));
        throw new Error(payload?.message || "Failed to update profile");
      }

      // On success: ideally update session; here we rely on server/session refresh or sync mechanisms.
      // We keep local optimistic state as-is to reflect success.
      setSaving(false);
      setError(null);
    } catch (err: any) {
      // Rollback local display to previous authoritative state
      setLocalUser(previous);
      setSaving(false);
      setError(err?.message || "Failed to update profile. Changes were rolled back.");
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-fade-in py-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row gap-8 items-center md:items-start bg-stone-900 text-white p-8 rounded-3xl shadow-xl">
        <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-stone-700 bg-stone-800">
          {localUser.image ? (
            <img src={localUser.image} alt={localUser.name ?? "User"} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-medium text-stone-200">
              {getInitials(localUser.name)}
            </div>
          )}
        </div>
        <div className="text-center md:text-left pt-2 flex-1">
          <h1 className="text-3xl font-serif mb-1">{localUser.name ?? "User"}</h1>
          <p className="text-stone-400 mb-4">{localUser.email}</p>
          <div className="flex justify-center md:justify-start gap-2">
            <span className="px-3 py-1 bg-amber-900/50 rounded-full text-xs font-medium border border-amber-800 text-amber-200">Brew Club Member</span>
          </div>
        </div>
        <div className="text-center md:text-right">
          <div className="text-3xl font-bold text-amber-500">1,240</div>
          <div className="text-xs text-stone-400 uppercase tracking-wider mt-1">Tera Point</div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        {/* Settings */}
        <div className="md:col-span-1 space-y-6">
          <Card className="border-none shadow-lg bg-white">
            <div className="flex items-center gap-2 font-medium text-stone-900 mb-6 px-6">
              <UserIcon size={18} /> <span>Personal Info</span>
            </div>
            <div className="space-y-4 px-6 pb-6">
              <label className="text-sm text-stone-600">Display Name</label>
              <Input
                value={localUser.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalUser((s) => ({ ...s, name: e.target.value }))}
              />
              <label className="text-sm text-stone-600">Profile Image URL</label>
              <Input
                value={localUser.image}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalUser((s) => ({ ...s, image: e.target.value }))}
                placeholder="https://example.com/avatar.jpg"
              />
              <label className="text-sm text-stone-600">Email</label>
              <Input value={localUser.email} disabled className="bg-stone-100" />
              <div className="flex items-center gap-3">
                <Button variant="secondary" size="sm" className="flex-1" onClick={onUpdate} disabled={saving}>
                  {saving ? "Saving..." : "Update Profile"}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setLocalUser({
                      name: remoteUser.name ?? "",
                      email: remoteUser.email ?? "",
                      image: remoteUser.image ?? "",
                    })
                  }
                  disabled={saving}
                >
                  Reset
                </Button>
              </div>
              <div aria-live="polite" className="min-h-[1.25rem]">
                {error ? <div className="text-red-600 text-sm mt-1">{error}</div> : <div className="text-sm text-stone-400 mt-1">Your changes will be applied immediately (optimistic). We'll rollback on error.</div>}
              </div>
            </div>
          </Card>

          <Card className="border-none shadow-lg bg-white">
            <div className="flex items-center gap-2 font-medium text-stone-900 mb-6 px-6">
              <MapPin size={18} /> <span>Shipping Address</span>
            </div>
            <div className="text-sm text-stone-500 mb-4 bg-stone-50 p-4 rounded-xl border border-stone-100">
              {/* Default address display: read-only summary. Addresses CRUD will be on the addresses page. */}
              {remoteUser?.address ? (
                <>
                  {remoteUser.address.line1}<br />
                  {remoteUser.address.city}, {remoteUser.address.region} {remoteUser.address.postalCode}
                </>
              ) : (
                <>No default address set.</>
              )}
            </div>
            <div className="px-6 pb-6">
              <Button variant="secondary" size="sm" className="w-full" onClick={() => router.push("/profile/addresses")}>Manage Addresses</Button>
            </div>
          </Card>
        </div>

        {/* History */}
        <div className="md:col-span-2">
          <Card className="border-none shadow-lg bg-white h-full">
            <div className="flex items-center gap-2 font-medium text-stone-900 mb-6 px-6">
              <Package size={18} /> <span>Order History</span>
            </div>
            <div className="space-y-4 px-6 pb-6">
              {orders.length === 0 ? (
                <div className="text-center py-12 text-stone-400 flex flex-col items-center">
                  <Coffee size={48} className="mb-4 text-stone-200" />
                  <p>No Orders placed yet.</p>
                  <Button variant="ghost" className="mt-4" onClick={() => router.push("/shop")}>Start Shopping</Button>
                </div>
              ) : (
                orders.map(order => (
                  <div key={order.id} className="border border-stone-100 rounded-2xl p-6 hover:border-stone-300 transition-colors">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <p className="font-medium text-stone-900">Order #{order.id}</p>
                        <p className="text-xs text-stone-500 mt-1">{new Date(order.date).toLocaleDateString()}</p>
                      </div>
                      <Badge variant={order.status === "Delivered" ? "success" : "warning"}>{order.status}</Badge>
                    </div>
                    <div className="flex gap-3 my-4 overflow-x-auto pb-2">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="w-12 h-12 rounded-lg bg-stone-50 border border-stone-200 overflow-hidden flex-shrink-0">
                          <img src={item.image} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between items-center pt-4 border-t border-stone-100">
                      <span className="text-sm font-semibold text-stone-900">Total: ${order.total.toFixed(2)}</span>
                      <Button size="sm" variant="secondary">Track Order</Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}