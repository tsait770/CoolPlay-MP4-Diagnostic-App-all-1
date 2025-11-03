import { Hono } from "hono";
import { trpcServer } from "@hono/trpc-server";
import { cors } from "hono/cors";
import { appRouter } from "@/backend/trpc/app-router";
import { createContext } from "@/backend/trpc/create-context";

// app will be mounted at /api
const app = new Hono();

// Enable CORS for all routes (allow Authorization header)
app.use("*", cors({
  origin: "*",
  allowMethods: ["GET", "POST", "OPTIONS"],
  allowHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// Mount tRPC router at /trpc
app.use(
  "/trpc/*",
  trpcServer({
    endpoint: "/api/trpc",
    router: appRouter,
    createContext,
  })
);

// Simple health check endpoint
app.get("/", (c) => {
  return c.json({ status: "ok", message: "API is running" });
});

export default app;