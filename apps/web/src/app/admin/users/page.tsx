import { requireAdmin } from "@/lib/admin-guard";
import { db, user, loginActivity } from "@Teramisu/db";
import { desc, eq } from "drizzle-orm";
import { UserManagementClient } from "./user-management-client";

export default async function AdminUsersPage() {
  await requireAdmin();

  const users = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      emailVerified: user.emailVerified,
      image: user.image,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    })
    .from(user)
    .orderBy(desc(user.createdAt));

  const activities = await db
    .select()
    .from(loginActivity)
    .orderBy(desc(loginActivity.createdAt))
    .limit(50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-foreground">Users</h1>
        <p className="text-muted-foreground mt-1">
          Manage user accounts and permissions
        </p>
      </div>

      <UserManagementClient users={users} activities={activities} />
    </div>
  );
}
