import { Router, type Request, type Response } from "express";
import type { Router as ExpressRouter } from "express";
import { getServerConfig } from "../config.js";

const router: ExpressRouter = Router();

router.get("/status", (req: Request, res: Response) => {
  res.json({
    status: "running",
    timestamp: new Date().toISOString(),
    version: process.env.NPM_PACKAGE_VERSION || "unknown",
    mode: "http"
  });
});

router.get("/config", (req: Request, res: Response) => {
  const config = getServerConfig(false);
  res.json({
    port: config.port,
    authMethod: config.auth.useOAuth ? "oauth" : "api-key",
    endpoints: {
      mcp: "/mcp",
      sse: "/sse", 
      messages: "/messages",
      health: "/health",
      status: "/api/status"
    }
  });
});

export default router; 