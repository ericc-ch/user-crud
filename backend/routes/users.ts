import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { requireAuth, requirePermission } from "@/backend/middleware/auth";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users } from "@/schemas/auth.sql";
import { userRoles } from "@/schemas/roles.sql";
import { eq, like, asc, desc, count, sql, inArray } from "drizzle-orm";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const app = new OpenAPIHono<{ Variables: Variables }>();

const UserSchema = z
  .object({
    id: z.string().openapi({ example: "user_123" }),
    name: z.string().openapi({ example: "John Doe" }),
    email: z.string().openapi({ example: "john@example.com" }),
    emailVerified: z.boolean().openapi({ example: true }),
    image: z.string().nullable().openapi({ example: null }),
    createdAt: z.number().openapi({ example: 1698765432000 }),
    updatedAt: z.number().openapi({ example: 1698765432000 }),
    roleIds: z.array(z.string()).optional().openapi({ example: ["role_123"] }),
  })
  .openapi("User");

const CreateUserSchema = z.object({
  name: z.string().min(1).openapi({ example: "Jane Smith" }),
  email: z.string().email().openapi({ example: "jane@example.com" }),
  password: z.string().min(8).openapi({ example: "SecurePass123!" }),
  roleIds: z.array(z.string()).optional().default([]).openapi({
    example: ["role_123"],
  }),
});

const UpdateUserSchema = z.object({
  name: z.string().min(1).optional().openapi({ example: "Jane Doe" }),
  email: z.string().email().optional().openapi({ example: "jane.doe@example.com" }),
  roleIds: z.array(z.string()).optional().openapi({
    example: ["role_123", "role_456"],
  }),
});

const ParamSchema = z.object({
  id: z.string().openapi({
    param: { name: "id", in: "path" },
    example: "user_123",
  }),
});

const QuerySchema = z.object({
  page: z.coerce.number().min(1).default(1).openapi({
    param: { name: "page", in: "query" },
    example: 1,
  }),
  pageSize: z.coerce.number().min(1).max(100).default(10).openapi({
    param: { name: "pageSize", in: "query" },
    example: 10,
  }),
  search: z.string().optional().openapi({
    param: { name: "search", in: "query" },
    example: "john",
  }),
  sortBy: z.enum(["name", "email", "createdAt"]).default("createdAt").openapi({
    param: { name: "sortBy", in: "query" },
    example: "createdAt",
  }),
  sortOrder: z.enum(["asc", "desc"]).default("desc").openapi({
    param: { name: "sortOrder", in: "query" },
    example: "desc",
  }),
});

const UsersListResponseSchema = z.object({
  data: z.array(UserSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
}).openapi("UsersListResponse");

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Users"],
  request: {
    query: QuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UsersListResponseSchema,
        },
      },
      description: "List users with pagination and filtering",
    },
    401: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Unauthorized",
    },
  },
});

const getRoute = createRoute({
  method: "get",
  path: "/{id}",
  tags: ["Users"],
  request: {
    params: ParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "Get user by ID",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "User not found",
    },
  },
});

const createRouteConfig = createRoute({
  method: "post",
  path: "/",
  tags: ["Users"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateUserSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "User created successfully",
    },
    403: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Forbidden",
    },
  },
});

const updateRouteConfig = createRoute({
  method: "put",
  path: "/{id}",
  tags: ["Users"],
  request: {
    params: ParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateUserSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: UserSchema,
        },
      },
      description: "User updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "User not found",
    },
  },
});

const deleteRouteConfig = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Users"],
  request: {
    params: ParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: z.object({ message: z.string() }),
        },
      },
      description: "User deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "User not found",
    },
  },
});

app.use("*", requireAuth);
app.use("*", requirePermission("users:read"));

app.openapi(listRoute, async (c) => {
  const { page, pageSize, search, sortBy, sortOrder } = c.req.valid("query");

  let query = db.select().from(users);

  if (search) {
    query = query.where(
      like(users.email, `%${search}%`)
    ) as typeof query;
  }

  const orderColumn = sortBy === "name" ? users.name : sortBy === "email" ? users.email : users.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;
  query = query.orderBy(orderFn(orderColumn)) as typeof query;

  const offset = (page - 1) * pageSize;
  const allUsers = await query.limit(pageSize).offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(users)
    .where(search ? like(users.email, `%${search}%`) : sql`1=1`);

  const total = totalResult.count;
  const totalPages = Math.ceil(total / pageSize);

  const userIds = allUsers.map(u => u.id);
  let rolesByUserId: Record<string, string[]> = {};
  
  if (userIds.length > 0) {
    const userRolesData = await db
      .select()
      .from(userRoles)
      .where(inArray(userRoles.userId, userIds));

    rolesByUserId = userRolesData.reduce((acc, ur) => {
      if (!acc[ur.userId]) acc[ur.userId] = [];
      acc[ur.userId].push(ur.roleId);
      return acc;
    }, {} as Record<string, string[]>);
  }

  const serialized = allUsers.map((user) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image || null,
    createdAt: user.createdAt.getTime(),
    updatedAt: user.updatedAt.getTime(),
    roleIds: rolesByUserId[user.id] || [],
  }));

  return c.json({
    data: serialized,
    total,
    page,
    pageSize,
    totalPages,
  }, 200);
});

app.openapi(getRoute, async (c) => {
  const { id } = c.req.valid("param");
  const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

  if (!user.length) {
    return c.json({ error: "User not found" }, 404);
  }

  const serialized = {
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    emailVerified: user[0].emailVerified,
    image: user[0].image || null,
    createdAt: user[0].createdAt.getTime(),
    updatedAt: user[0].updatedAt.getTime(),
  };

  return c.json(serialized, 200);
});

app.use("/", requirePermission("users:write"));
app.openapi(createRouteConfig, async (c) => {
  const body = c.req.valid("json");

  const signUpRes = await fetch(`${c.req.url.split('/api')[0]}/api/auth/sign-up/email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      name: body.name,
      email: body.email,
      password: body.password,
    }),
  });

  if (!signUpRes.ok) {
    return c.json({ error: "Failed to create user" }, 403);
  }

  const signUpData = await signUpRes.json();
  const user = signUpData.user;

  if (body.roleIds && body.roleIds.length > 0) {
    await db.insert(userRoles).values(
      body.roleIds.map((roleId: string) => ({
        id: `userRole_${Date.now()}_${Math.random().toString(36).slice(2)}`,
        userId: user.id,
        roleId,
      }))
    );
  }

  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    emailVerified: user.emailVerified,
    image: user.image || null,
    createdAt: new Date(user.createdAt).getTime(),
    updatedAt: new Date(user.updatedAt).getTime(),
  }, 201);
});

app.use("/:id", requirePermission("users:write"));
app.openapi(updateRouteConfig, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const updates: { name?: string; email?: string; updatedAt: Date } = {
    updatedAt: new Date(),
  };
  
  if (body.name) updates.name = body.name;
  if (body.email) updates.email = body.email;

  await db.update(users).set(updates).where(eq(users.id, id));

  if (body.roleIds !== undefined) {
    await db.delete(userRoles).where(eq(userRoles.userId, id));
    
    if (body.roleIds.length > 0) {
      await db.insert(userRoles).values(
        body.roleIds.map((roleId: string) => ({
          id: `userRole_${Date.now()}_${Math.random().toString(36).slice(2)}`,
          userId: id,
          roleId,
        }))
      );
    }
  }

  const user = await db.select().from(users).where(eq(users.id, id)).limit(1);

  if (!user.length) {
    return c.json({ error: "User not found" }, 404);
  }

  return c.json({
    id: user[0].id,
    name: user[0].name,
    email: user[0].email,
    emailVerified: user[0].emailVerified,
    image: user[0].image || null,
    createdAt: user[0].createdAt.getTime(),
    updatedAt: user[0].updatedAt.getTime(),
  }, 200);
});

app.use("/:id", requirePermission("users:delete"));
app.openapi(deleteRouteConfig, async (c) => {
  const { id } = c.req.valid("param");

  await db.delete(users).where(eq(users.id, id));

  return c.json({ message: "User deleted successfully" }, 200);
});

export default app;
