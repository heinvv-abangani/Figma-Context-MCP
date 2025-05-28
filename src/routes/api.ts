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

router.get("/debug-figma", async (req: Request, res: Response) => {
  try {
    const config = getServerConfig(false);
    
    const debugInfo: any = {
      hasApiKey: !!config.auth.figmaApiKey,
      hasOAuthToken: !!config.auth.figmaOAuthToken,
      useOAuth: config.auth.useOAuth,
      apiKeyLength: config.auth.figmaApiKey ? config.auth.figmaApiKey.length : 0,
      apiKeyPreview: config.auth.figmaApiKey ? `${config.auth.figmaApiKey.substring(0, 8)}...` : "none"
    };
    
    // Test a simple Figma API call
    if (config.auth.figmaApiKey) {
      try {
        const testFileKey = "hh6URsZQCurNjjOWrb9XQr"; // Public community file
        const figmaResponse = await fetch(`https://api.figma.com/v1/files/${testFileKey}`, {
          headers: {
            'X-Figma-Token': config.auth.figmaApiKey
          }
        });
        
        debugInfo.figmaApiTest = {
          status: figmaResponse.status,
          statusText: figmaResponse.statusText,
          success: figmaResponse.ok
        };
        
        if (!figmaResponse.ok) {
          const errorText = await figmaResponse.text();
          debugInfo.figmaApiTest.error = errorText;
        } else {
          debugInfo.figmaApiTest.message = "API key is working!";
        }
        
      } catch (error) {
        debugInfo.figmaApiTest = {
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    res.json(debugInfo);
  } catch (error) {
    res.status(500).json({
      error: "Debug failed",
      message: error instanceof Error ? error.message : String(error)
    });
  }
});

export default router; 