import { OpenAPIHono } from "@hono/zod-openapi";
import { swaggerUI } from "@hono/swagger-ui";
import { auth } from "@/lib/auth";
import rolesRouter from "./routes/roles";

export const app = new OpenAPIHono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>().basePath("/api");

app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });

  if (!session) {
    c.set("user", null);
    c.set("session", null);
    return next();
  }

  c.set("user", session.user);
  c.set("session", session.session);
  return next();
});

app.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw);
});

app.route("/roles", rolesRouter);

app.get("/doc", async (c) => {
  const betterAuthSchema = await auth.api.generateOpenAPISchema();
  const honoSchema = app.getOpenAPIDocument({
    openapi: "3.0.0",
    info: {
      version: "1.0.0",
      title: "User CRUD API",
      description: "API for user management with role-based access control",
    },
  });

  const combined = {
    ...honoSchema,
    paths: {
      ...betterAuthSchema.paths,
      ...honoSchema.paths,
    },
    components: {
      ...betterAuthSchema.components,
      ...honoSchema.components,
    },
  };

  return c.json(combined);
});

app.get("/swagger", swaggerUI({ url: "/api/doc" }));
