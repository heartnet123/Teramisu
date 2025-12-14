import { requireAdmin } from "@/lib/admin-guard";
import { Card } from "@/components/ui/card";

export default async function AdminUsersPage() {
  await requireAdmin();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">Manage user accounts and permissions</p>
      </div>

      <Card className="p-12 text-center">
        <p className="text-muted-foreground">User management coming soon...</p>
      </Card>
    </div>
  );
}
