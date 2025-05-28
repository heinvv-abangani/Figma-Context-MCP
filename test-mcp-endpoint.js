// Test script for MCP endpoint
// This demonstrates the correct JSON-RPC 2.0 format for MCP requests

async function testMCPEndpoint() {
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  // First, test the health endpoint
  console.log("Testing health endpoint...");
  try {
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log("Health check:", healthData);
  } catch (error) {
    console.error("Health check failed:", error);
    return;
  }

  // Test the API status endpoint
  console.log("\nTesting API status endpoint...");
  try {
    const statusRes = await fetch(`${baseUrl}/api/status`);
    const statusData = await statusRes.json();
    console.log("API Status:", statusData);
  } catch (error) {
    console.error("API status failed:", error);
  }

  // Test MCP initialization (required first step)
  console.log("\nTesting MCP initialization...");
  try {
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: {
          roots: {
            listChanged: true
          },
          sampling: {}
        },
        clientInfo: {
          name: "test-client",
          version: "1.0.0"
        }
      }
    };

    const initRes = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(initRequest)
    });

    const initData = await initRes.json();
    console.log("MCP Initialize response:", JSON.stringify(initData, null, 2));

    // If initialization successful, test tools/resources list
    if (initData.result) {
      console.log("\nTesting tools list...");
      const toolsRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/list",
        params: {}
      };

      const toolsRes = await fetch(`${baseUrl}/mcp`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "mcp-session-id": "test-session-123"
        },
        body: JSON.stringify(toolsRequest)
      });

      const toolsData = await toolsRes.json();
      console.log("Available tools:", JSON.stringify(toolsData, null, 2));

      // Test calling a Figma tool (if available)
      if (toolsData.result && toolsData.result.tools) {
        const figmaTool = toolsData.result.tools.find(tool => 
          tool.name.includes("figma") || tool.name.includes("get_figma_data")
        );

        if (figmaTool) {
          console.log("\nTesting Figma tool call...");
          const toolCallRequest = {
            jsonrpc: "2.0",
            id: 3,
            method: "tools/call",
            params: {
              name: figmaTool.name,
              arguments: {
                fileKey: "z8nv6p3cbJCgTp7hbHXGil"
              }
            }
          };

          const toolCallRes = await fetch(`${baseUrl}/mcp`, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "mcp-session-id": "test-session-123"
            },
            body: JSON.stringify(toolCallRequest)
          });

          const toolCallData = await toolCallRes.json();
          console.log("Figma tool response:", JSON.stringify(toolCallData, null, 2));
        }
      }
    }

  } catch (error) {
    console.error("MCP test failed:", error);
  }
}

// Alternative: Test with your original approach (will likely fail)
async function testOriginalApproach() {
  console.log("\n=== Testing your original approach (expected to fail) ===");
  try {
    const res = await fetch("https://figma-context-mcp-fre3.onrender.com/mcp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        kind: "figma/context",
        body: { fileId: "z8nv6p3cbJCgTp7hbHXGil" }
      })
    });

    const data = await res.json();
    console.log("Original approach result:", data);
  } catch (error) {
    console.error("Original approach failed (as expected):", error);
  }
}

// Run the tests
testMCPEndpoint().then(() => {
  testOriginalApproach();
}); 