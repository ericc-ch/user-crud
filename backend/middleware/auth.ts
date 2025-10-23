import { Context, Next } from "hono";
import { db } from "@/lib/db";
import { userRoles, roles } from "@/schemas/roles.sql";
import { eq } from "drizzle-orm";

export const requireAuth = async (c: Context, next: Next) => {
  const user = c.get("user");
  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }
  await next();
};

export const requirePermission = (permission: string) => {
  return async (c: Context, next: Next) => {
    const user = c.get("user");
    
    if (!user) {
      return c.json({ error: "Unauthorized" }, 401);
    }

    const userRolesList = await db
      .select({ permissions: roles.permissions })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, user.id));

    const allPermissions = userRolesList.flatMap((r) =>
      JSON.parse(r.permissions)
    );

    if (!allPermissions.includes(permission)) {
      return c.json({ error: "Forbidden - insufficient permissions" }, 403);
    }

    await next();
  };
};
