import { db } from "../lib/db";
import { roles, userRoles } from "../schemas/roles.sql";
import { users } from "../schemas/auth.sql";
import { eq } from "drizzle-orm";

async function seed() {
  console.log("Seeding database...");

  try {
    const adminPermissions = [
      "users:read",
      "users:write",
      "users:delete",
      "roles:read",
      "roles:write",
      "roles:delete",
    ];

    const editorPermissions = [
      "users:read",
      "users:write",
      "roles:read",
    ];

    const viewerPermissions = [
      "users:read",
      "roles:read",
    ];

    const existingRoles = await db.select().from(roles);
    
    let adminRole;

    if (existingRoles.length === 0) {
      console.log("Creating roles...");
      
      adminRole = await db.insert(roles).values({
        id: crypto.randomUUID(),
        name: "Admin",
        permissions: JSON.stringify(adminPermissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      }).returning();

      await db.insert(roles).values({
        id: crypto.randomUUID(),
        name: "Editor",
        permissions: JSON.stringify(editorPermissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      await db.insert(roles).values({
        id: crypto.randomUUID(),
        name: "Viewer",
        permissions: JSON.stringify(viewerPermissions),
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      console.log("Roles created");
    } else {
      console.log("Roles already exist, skipping...");
      adminRole = existingRoles.find(r => r.name === "Admin") ? [existingRoles.find(r => r.name === "Admin")!] : [];
    }

    const allUsers = await db.select().from(users);
    
    if (allUsers.length > 0) {
      const firstUser = allUsers[0];
      
      const existingUserRole = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, firstUser.id));

      if (existingUserRole.length === 0 && adminRole.length > 0) {
        await db.insert(userRoles).values({
          id: crypto.randomUUID(),
          userId: firstUser.id,
          roleId: adminRole[0].id,
        });
        console.log(`Assigned Admin role to user: ${firstUser.email}`);
      } else {
        console.log("User already has a role assigned");
      }
    } else {
      console.log("No users found. Please sign up first, then run this seed script again.");
    }

    console.log("Seeding complete!");
  } catch (error) {
    console.error("Error seeding database:", error);
    process.exit(1);
  }
}

seed();
