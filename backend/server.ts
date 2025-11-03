import app from "./hono";

const port = process.env.PORT || 3000;

console.log(`🚀 Starting backend server on port ${port}`);

// Use Bun's built-in server
Bun.serve({
  fetch: app.fetch,
  port: Number(port),
});

console.log(`✅ Backend server running at http://localhost:${port}`);
console.log(`📡 tRPC API available at http://localhost:${port}/api/trpc`);