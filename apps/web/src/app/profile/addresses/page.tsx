'use client';
import React from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";

type Address = {
  id: string;
  line1: string;
  line2?: string;
  city: string;
  region?: string;
  postalCode?: string;
  isDefault?: boolean;
};

export default function AddressesPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;

  const [addresses, setAddresses] = React.useState<Address[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const emptyForm: Omit<Address, "id" | "isDefault"> = {
    line1: "",
    line2: "",
    city: "",
    region: "",
    postalCode: "",
  };

  const [form, setForm] = React.useState<Omit<Address, "id" | "isDefault">>(emptyForm);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (!isPending && !user) {
      router.push("/login");
      return;
    }
    // load addresses
    (async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/user/addresses");
        if (!res.ok) throw new Error("Failed to load addresses");
        const data = await res.json();
        setAddresses(data || []);
      } catch (err: any) {
        setError(err?.message || "Failed to load addresses");
      } finally {
        setLoading(false);
      }
    })();
  }, [isPending, user, router]);

  const validate = (payload: Partial<Address>) => {
    if (!payload.line1 || payload.line1.trim().length < 3) return "Address line 1 must be at least 3 characters.";
    if (!payload.city || payload.city.trim().length < 2) return "City is required.";
    if (payload.postalCode && payload.postalCode.trim().length < 3) return "Postal code looks too short.";
    return null;
  };

  // Create or update (optimistic)
  const onSave = async () => {
    setError(null);
    const payload = {
      line1: form.line1.trim(),
      line2: form.line2?.trim(),
      city: form.city.trim(),
      region: form.region?.trim(),
      postalCode: form.postalCode?.trim(),
    };
    const v = validate(payload as Address);
    if (v) {
      setError(v);
      return;
    }

    setSaving(true);

    if (editingId) {
      // optimistic update: replace in local list
      const prev = addresses;
      const updated = addresses.map(a => (a.id === editingId ? { ...a, ...payload } as Address : a));
      setAddresses(updated);

      try {
        const res = await fetch(`/api/user/addresses/${editingId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) {
          throw new Error((await res.json().catch(() => ({}))).message || "Failed to update address");
        }
        setEditingId(null);
        setForm(emptyForm);
      } catch (err: any) {
        setAddresses(prev); // rollback
        setError(err?.message || "Update failed, changes rolled back.");
      } finally {
        setSaving(false);
      }
    } else {
      // create optimistic
      const tempId = "temp-" + Math.random().toString(36).slice(2, 9);
      const newAddress: Address = { id: tempId, ...payload, isDefault: addresses.length === 0 };
      const prev = addresses;
      setAddresses([newAddress, ...addresses]);
      setForm(emptyForm);

      try {
        const res = await fetch("/api/user/addresses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed to create address");
        const created: Address = await res.json();
        // replace temp with real
        setAddresses((cur) => cur.map(a => (a.id === tempId ? created : a)));
      } catch (err: any) {
        // rollback remove temp
        setAddresses(prev);
        setError(err?.message || "Create failed, changes rolled back.");
      } finally {
        setSaving(false);
      }
    }
  };

  const onEdit = (a: Address) => {
    setEditingId(a.id);
    setForm({ line1: a.line1, line2: a.line2 || "", city: a.city, region: a.region || "", postalCode: a.postalCode || "" });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onCancelEdit = () => {
    setEditingId(null);
    setForm(emptyForm);
    setError(null);
  };

  const onDelete = async (id: string) => {
    setError(null);
    const prev = addresses;
    // optimistic remove
    setAddresses(addresses.filter(a => a.id !== id));

    try {
      const res = await fetch(`/api/user/addresses/${id}`, { method: "DELETE" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed to delete address");
    } catch (err: any) {
      // rollback
      setAddresses(prev);
      setError(err?.message || "Delete failed, changes rolled back.");
    }
  };

  const setDefault = async (id: string) => {
    setError(null);
    const prev = addresses;
    // optimistic local default
    setAddresses(addresses.map(a => ({ ...a, isDefault: a.id === id })));

    try {
      const res = await fetch(`/api/user/addresses/${id}/default`, { method: "POST" });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).message || "Failed to set default");
    } catch (err: any) {
      setAddresses(prev);
      setError(err?.message || "Failed to set default address.");
    }
  };

  if (isPending) return null;
  if (!user) return null;

  return (
    <div className="max-w-4xl mx-auto py-10 space-y-6">
      <Card className="p-6">
        <h2 className="text-lg font-medium mb-4">Manage Addresses</h2>

        <div className="space-y-3">
          <label className="text-sm text-stone-600">Address line 1</label>
          <Input value={form.line1} onChange={(e) => setForm(s => ({ ...s, line1: e.target.value }))} placeholder="Street, house number" />
          <label className="text-sm text-stone-600">Address line 2 (optional)</label>
          <Input value={form.line2} onChange={(e) => setForm(s => ({ ...s, line2: e.target.value }))} placeholder="Apartment, suite, etc." />
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-sm text-stone-600">City</label>
              <Input value={form.city} onChange={(e) => setForm(s => ({ ...s, city: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-stone-600">Region</label>
              <Input value={form.region} onChange={(e) => setForm(s => ({ ...s, region: e.target.value }))} />
            </div>
            <div>
              <label className="text-sm text-stone-600">Postal code</label>
              <Input value={form.postalCode} onChange={(e) => setForm(s => ({ ...s, postalCode: e.target.value }))} />
            </div>
          </div>

          <div className="flex items-center gap-3 mt-2">
            <Button onClick={onSave} disabled={saving}>{saving ? (editingId ? "Updating..." : "Saving...") : editingId ? "Update address" : "Add address"}</Button>
            {editingId ? <Button variant="ghost" onClick={onCancelEdit} disabled={saving}>Cancel</Button> : null}
            <div className="text-sm text-stone-400 ml-auto" aria-live="polite">{error ? <span className="text-red-600">{error}</span> : <span>Inline validation will show errors here.</span>}</div>
          </div>
        </div>
      </Card>

      <div className="grid gap-4">
        {loading ? (
          <Card className="p-6">Loading addresses…</Card>
        ) : addresses.length === 0 ? (
          <Card className="p-6 text-stone-500">No addresses yet. Add one using the form above.</Card>
        ) : (
          addresses.map(addr => (
            <Card key={addr.id} className="p-4 flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <div className="font-medium">{addr.line1}</div>
                  {addr.isDefault ? <Badge variant="secondary">Default</Badge> : null}
                </div>
                <div className="text-sm text-stone-500">{addr.line2 ? <>{addr.line2}<br/></> : null}{addr.city}{addr.region ? `, ${addr.region}` : ""} {addr.postalCode ? ` ${addr.postalCode}` : ""}</div>
              </div>
              <div className="flex items-center gap-2">
                {!addr.isDefault ? <Button size="sm" variant="ghost" onClick={() => setDefault(addr.id)}>Set default</Button> : null}
                <Button size="sm" variant="secondary" onClick={() => onEdit(addr)}>Edit</Button>
                <Button size="sm" variant="destructive" onClick={() => onDelete(addr.id)}>Delete</Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}