import { OpenAPIHono, createRoute, z } from "@hono/zod-openapi";
import { db } from "@/lib/db";
import { roles } from "@/schemas/roles.sql";
import { requireAuth, requirePermission } from "@/backend/middleware/auth";
import { eq, like, asc, desc, count, sql } from "drizzle-orm";
import { auth } from "@/lib/auth";

type Variables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

const app = new OpenAPIHono<{ Variables: Variables }>();

const RoleSchema = z
  .object({
    id: z.string().openapi({ example: "role_123" }),
    name: z.string().openapi({ example: "Admin" }),
    permissions: z.string().openapi({ example: '["users:read","users:write"]' }),
    createdAt: z.number().openapi({ example: 1698765432000 }),
    updatedAt: z.number().openapi({ example: 1698765432000 }),
  })
  .openapi("Role");

const CreateRoleSchema = z.object({
  name: z.string().min(1).openapi({ example: "Editor" }),
  permissions: z.array(z.string()).default([]).openapi({
    example: ["posts:read", "posts:write"],
  }),
});

const UpdateRoleSchema = z.object({
  name: z.string().min(1).optional().openapi({ example: "Super Admin" }),
  permissions: z.array(z.string()).optional().openapi({
    example: ["*"],
  }),
});

const ParamSchema = z.object({
  id: z.string().openapi({
    param: { name: "id", in: "path" },
    example: "role_123",
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
    example: "admin",
  }),
  sortBy: z.enum(["name", "createdAt"]).default("createdAt").openapi({
    param: { name: "sortBy", in: "query" },
    example: "createdAt",
  }),
  sortOrder: z.enum(["asc", "desc"]).default("desc").openapi({
    param: { name: "sortOrder", in: "query" },
    example: "desc",
  }),
});

const RolesListResponseSchema = z.object({
  data: z.array(RoleSchema),
  total: z.number(),
  page: z.number(),
  pageSize: z.number(),
  totalPages: z.number(),
}).openapi("RolesListResponse");

const listRoute = createRoute({
  method: "get",
  path: "/",
  tags: ["Roles"],
  request: {
    query: QuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RolesListResponseSchema,
        },
      },
      description: "List roles with pagination and filtering",
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
  tags: ["Roles"],
  request: {
    params: ParamSchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RoleSchema,
        },
      },
      description: "Get role by ID",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Role not found",
    },
  },
});

const createRouteConfig = createRoute({
  method: "post",
  path: "/",
  tags: ["Roles"],
  request: {
    body: {
      content: {
        "application/json": {
          schema: CreateRoleSchema,
        },
      },
    },
  },
  responses: {
    201: {
      content: {
        "application/json": {
          schema: RoleSchema,
        },
      },
      description: "Role created successfully",
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
  tags: ["Roles"],
  request: {
    params: ParamSchema,
    body: {
      content: {
        "application/json": {
          schema: UpdateRoleSchema,
        },
      },
    },
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: RoleSchema,
        },
      },
      description: "Role updated successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Role not found",
    },
  },
});

const deleteRouteConfig = createRoute({
  method: "delete",
  path: "/{id}",
  tags: ["Roles"],
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
      description: "Role deleted successfully",
    },
    404: {
      content: {
        "application/json": {
          schema: z.object({ error: z.string() }),
        },
      },
      description: "Role not found",
    },
  },
});

app.use("*", requireAuth);
app.use("*", requirePermission("roles:read"));

app.openapi(listRoute, async (c) => {
  const { page, pageSize, search, sortBy, sortOrder } = c.req.valid("query");

  let query = db.select().from(roles);

  if (search) {
    query = query.where(like(roles.name, `%${search}%`)) as typeof query;
  }

  const orderColumn = sortBy === "name" ? roles.name : roles.createdAt;
  const orderFn = sortOrder === "asc" ? asc : desc;
  query = query.orderBy(orderFn(orderColumn)) as typeof query;

  const offset = (page - 1) * pageSize;
  const allRoles = await query.limit(pageSize).offset(offset);

  const [totalResult] = await db
    .select({ count: count() })
    .from(roles)
    .where(search ? like(roles.name, `%${search}%`) : sql`1=1`);

  const total = totalResult.count;
  const totalPages = Math.ceil(total / pageSize);

  const serialized = allRoles.map((role) => ({
    ...role,
    createdAt: role.createdAt.getTime(),
    updatedAt: role.updatedAt.getTime(),
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
  const role = await db.select().from(roles).where(eq(roles.id, id)).limit(1);

  if (!role.length) {
    return c.json({ error: "Role not found" }, 404);
  }

  const serialized = {
    ...role[0],
    createdAt: role[0].createdAt.getTime(),
    updatedAt: role[0].updatedAt.getTime(),
  };

  return c.json(serialized, 200);
});

app.use("/", requirePermission("roles:write"));
app.openapi(createRouteConfig, async (c) => {
  const body = c.req.valid("json");

  const id = `role_${Date.now()}`;
  const now = new Date();

  await db.insert(roles).values({
    id,
    name: body.name,
    permissions: JSON.stringify(body.permissions),
    createdAt: now,
    updatedAt: now,
  });

  const created = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);

  const serialized = {
    ...created[0],
    createdAt: created[0].createdAt.getTime(),
    updatedAt: created[0].updatedAt.getTime(),
  };

  return c.json(serialized, 201);
});

app.use("/:id", requirePermission("roles:write"));
app.openapi(updateRouteConfig, async (c) => {
  const { id } = c.req.valid("param");
  const body = c.req.valid("json");

  const existing = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);

  if (!existing.length) {
    return c.json({ error: "Role not found" }, 404);
  }

  const updates: {
    updatedAt: Date;
    name?: string;
    permissions?: string;
  } = {
    updatedAt: new Date(),
  };

  if (body.name !== undefined) {
    updates.name = body.name;
  }

  if (body.permissions !== undefined) {
    updates.permissions = JSON.stringify(body.permissions);
  }

  await db.update(roles).set(updates).where(eq(roles.id, id));

  const updated = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);

  const serialized = {
    ...updated[0],
    createdAt: updated[0].createdAt.getTime(),
    updatedAt: updated[0].updatedAt.getTime(),
  };

  return c.json(serialized, 200);
});

app.use("/:id", requirePermission("roles:delete"));
app.openapi(deleteRouteConfig, async (c) => {
  const { id } = c.req.valid("param");

  const existing = await db
    .select()
    .from(roles)
    .where(eq(roles.id, id))
    .limit(1);

  if (!existing.length) {
    return c.json({ error: "Role not found" }, 404);
  }

  await db.delete(roles).where(eq(roles.id, id));

  return c.json({ message: "Role deleted successfully" }, 200);
});

export default app;
