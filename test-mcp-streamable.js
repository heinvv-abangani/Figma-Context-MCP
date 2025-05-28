// Test script for MCP StreamableHTTP protocol

async function testMCPStreamable() {
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  console.log("=== Testing MCP StreamableHTTP Protocol ===");
  
  try {
    // Step 1: Initialize the MCP connection
    console.log("1. Initializing MCP connection...");
    
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

    const initResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json"
      },
      body: JSON.stringify(initRequest)
    });

    console.log("Init response status:", initResponse.status);
    console.log("Init response headers:", Object.fromEntries(initResponse.headers.entries()));

    // Check if response is JSON or SSE
    const contentType = initResponse.headers.get("content-type");
    console.log("Content-Type:", contentType);

    if (contentType?.includes("text/event-stream")) {
      console.log("Received SSE response, reading stream...");
      
      const reader = initResponse.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let buffer = "";
        let sessionId = null;
        
        // Read the SSE stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          // Process complete SSE messages
          const lines = buffer.split('\n');
          buffer = lines.pop() || ""; // Keep incomplete line in buffer
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim()) {
                try {
                  const message = JSON.parse(data);
                  console.log("SSE Message:", JSON.stringify(message, null, 2));
                  
                  // Extract session ID if this is the initialize response
                  if (message.result && message.result.capabilities) {
                    // Look for session ID in response headers or generate one
                    sessionId = initResponse.headers.get("mcp-session-id") || 
                               `session-${Date.now()}`;
                    console.log("Session ID:", sessionId);
                    
                    // Now test tools list with the session
                    await testToolsList(baseUrl, sessionId);
                    return;
                  }
                } catch (e) {
                  console.log("Non-JSON SSE data:", data);
                }
              }
            }
          }
        }
      }
    } else {
      // Handle JSON response
      const initData = await initResponse.json();
      console.log("JSON Initialize response:", JSON.stringify(initData, null, 2));
      
      if (initData.result) {
        const sessionId = `session-${Date.now()}`;
        await testToolsList(baseUrl, sessionId);
      }
    }

  } catch (error) {
    console.error("MCP StreamableHTTP test failed:", error);
  }
}

async function testToolsList(baseUrl, sessionId) {
  console.log("\n2. Testing tools list with session:", sessionId);
  
  try {
    const toolsRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/list",
      params: {}
    };

    const toolsResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "mcp-session-id": sessionId
      },
      body: JSON.stringify(toolsRequest)
    });

    console.log("Tools response status:", toolsResponse.status);
    
    const contentType = toolsResponse.headers.get("content-type");
    
    if (contentType?.includes("text/event-stream")) {
      console.log("Reading tools SSE response...");
      const reader = toolsResponse.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim()) {
                try {
                  const message = JSON.parse(data);
                  console.log("Tools SSE Message:", JSON.stringify(message, null, 2));
                  
                  if (message.result && message.result.tools) {
                    await testFigmaTool(baseUrl, sessionId, message.result.tools);
                    return;
                  }
                } catch (e) {
                  console.log("Non-JSON tools data:", data);
                }
              }
            }
          }
        }
      }
    } else {
      const toolsData = await toolsResponse.json();
      console.log("Tools JSON response:", JSON.stringify(toolsData, null, 2));
      
      if (toolsData.result && toolsData.result.tools) {
        await testFigmaTool(baseUrl, sessionId, toolsData.result.tools);
      }
    }
    
  } catch (error) {
    console.error("Tools list test failed:", error);
  }
}

async function testFigmaTool(baseUrl, sessionId, tools) {
  console.log("\n3. Testing Figma tool call...");
  
  const figmaTool = tools.find(tool => 
    tool.name === "get_figma_data" || tool.name.includes("figma")
  );

  if (!figmaTool) {
    console.log("No Figma tool found. Available tools:", tools.map(t => t.name));
    return;
  }

  console.log(`Found tool: ${figmaTool.name}`);
  
  try {
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

    const toolResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "mcp-session-id": sessionId
      },
      body: JSON.stringify(toolCallRequest)
    });

    console.log("Tool call response status:", toolResponse.status);
    
    const contentType = toolResponse.headers.get("content-type");
    
    if (contentType?.includes("text/event-stream")) {
      console.log("Reading tool call SSE response...");
      const reader = toolResponse.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let buffer = "";
        
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || "";
          
          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              if (data.trim()) {
                try {
                  const message = JSON.parse(data);
                  console.log("Tool call result:", JSON.stringify(message, null, 2));
                } catch (e) {
                  console.log("Non-JSON tool data:", data);
                }
              }
            }
          }
        }
      }
    } else {
      const toolData = await toolResponse.json();
      console.log("Tool call JSON response:", JSON.stringify(toolData, null, 2));
    }
    
  } catch (error) {
    console.error("Figma tool call failed:", error);
  }
}

// Run the test
testMCPStreamable(); 