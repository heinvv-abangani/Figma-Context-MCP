// Corrected test script for MCP endpoint with proper headers

async function testMCPCorrect() {
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  console.log("Testing MCP with correct headers...");
  
  try {
    // Test MCP initialization with proper headers
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
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
      },
      body: JSON.stringify(initRequest)
    });

    const initData = await initRes.json();
    console.log("MCP Initialize response:", JSON.stringify(initData, null, 2));

    // If initialization successful, get session ID and test tools
    if (initData.result) {
      console.log("\nInitialization successful! Testing tools list...");
      
      // The session ID should be in the response or we need to generate one
      const sessionId = initData.result.sessionId || "test-session-" + Date.now();
      
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
          "Accept": "application/json, text/event-stream",
          "mcp-session-id": sessionId
        },
        body: JSON.stringify(toolsRequest)
      });

      const toolsData = await toolsRes.json();
      console.log("Available tools:", JSON.stringify(toolsData, null, 2));

      // Test calling a Figma tool
      if (toolsData.result && toolsData.result.tools && toolsData.result.tools.length > 0) {
        console.log("\nTesting Figma tool call...");
        
        // Find the get_figma_data tool
        const figmaTool = toolsData.result.tools.find(tool => 
          tool.name === "get_figma_data" || tool.name.includes("figma")
        );

        if (figmaTool) {
          console.log(`Found tool: ${figmaTool.name}`);
          
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
              "Accept": "application/json, text/event-stream",
              "mcp-session-id": sessionId
            },
            body: JSON.stringify(toolCallRequest)
          });

          const toolCallData = await toolCallRes.json();
          console.log("Figma tool response:", JSON.stringify(toolCallData, null, 2));
        } else {
          console.log("No Figma tool found in available tools");
        }
      }
    }

  } catch (error) {
    console.error("MCP test failed:", error);
  }
}

// Test the simple endpoints first
async function testSimpleEndpoints() {
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  console.log("=== Testing Simple Endpoints ===");
  
  try {
    const healthRes = await fetch(`${baseUrl}/health`);
    const healthData = await healthRes.json();
    console.log("Health:", healthData);
    
    const statusRes = await fetch(`${baseUrl}/api/status`);
    const statusData = await statusRes.json();
    console.log("Status:", statusData);
    
    const configRes = await fetch(`${baseUrl}/api/config`);
    const configData = await configRes.json();
    console.log("Config:", configData);
    
  } catch (error) {
    console.error("Simple endpoints test failed:", error);
  }
}

// Run tests
testSimpleEndpoints().then(() => {
  console.log("\n=== Testing MCP Protocol ===");
  return testMCPCorrect();
}); 