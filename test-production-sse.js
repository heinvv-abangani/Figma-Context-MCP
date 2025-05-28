// Test the production SSE endpoint (like local setup)

async function testProductionSSE() {
  console.log("🔍 Testing Production SSE Endpoint (Like Local Setup)\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  const fileKey = "TY55XemMUd0snlx7B9ZeeS"; // V4 - Components
  
  console.log("📋 Testing SSE endpoint on production:");
  console.log("Local worked with: SSE transport");
  console.log("Production failing with: StreamableHTTP transport");
  console.log("Now testing: Production SSE transport\n");
  
  try {
    // Step 1: Establish SSE connection (like local)
    console.log("1. 🔌 Establishing SSE connection...");
    
    const sseResponse = await fetch(`${baseUrl}/sse`, {
      method: "GET",
      headers: {
        "Accept": "text/event-stream",
        "Cache-Control": "no-cache"
      }
    });
    
    console.log(`SSE Response Status: ${sseResponse.status}`);
    console.log("SSE Response Headers:");
    for (const [key, value] of sseResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    if (!sseResponse.ok) {
      console.log("❌ Failed to establish SSE connection");
      return;
    }
    
    // Read the SSE stream to get session info
    const reader = sseResponse.body?.getReader();
    const decoder = new TextDecoder();
    let sessionId = null;
    
    if (reader) {
      console.log("📡 Reading SSE stream...");
      let buffer = "";
      let messageCount = 0;
      
      // Read initial messages to establish connection
      const timeout = setTimeout(() => {
        console.log("⏰ SSE connection timeout, proceeding with manual session ID");
      }, 5000);
      
      try {
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
                messageCount++;
                console.log(`SSE Message ${messageCount}:`, data);
                
                // Look for session establishment
                try {
                  const message = JSON.parse(data);
                  if (message.method === "notifications/initialized" || message.result) {
                    console.log("✅ SSE connection established!");
                    clearTimeout(timeout);
                    // Extract session ID from somewhere
                    sessionId = `sse-${Date.now()}`;
                    break;
                  }
                } catch (e) {
                  // Not JSON, continue
                }
              }
            }
          }
          
          if (sessionId || messageCount > 3) break; // Don't read forever
        }
      } catch (error) {
        console.log("SSE read error:", error);
      }
      
      clearTimeout(timeout);
    }
    
    // Step 2: Send MCP initialize via POST to /messages
    if (!sessionId) {
      sessionId = `manual-sse-${Date.now()}`;
    }
    
    console.log(`\n2. 📤 Sending MCP initialize via /messages (session: ${sessionId})...`);
    
    const initRequest = {
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: {
        protocolVersion: "2024-11-05",
        capabilities: { roots: { listChanged: true }, sampling: {} },
        clientInfo: { name: "sse-test", version: "1.0.0" }
      }
    };
    
    const initResponse = await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(initRequest)
    });
    
    console.log(`Init Response Status: ${initResponse.status}`);
    
    if (initResponse.ok) {
      console.log("✅ MCP initialized via SSE!");
      
      // Step 3: Test Figma file access via SSE
      console.log("\n3. 📁 Testing Figma file access via SSE...");
      
      const figmaRequest = {
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "get_figma_data",
          arguments: { fileKey }
        }
      };
      
      const figmaResponse = await fetch(`${baseUrl}/messages?sessionId=${sessionId}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(figmaRequest)
      });
      
      console.log(`Figma Response Status: ${figmaResponse.status}`);
      
      if (figmaResponse.ok) {
        console.log("✅ Figma request sent via SSE!");
        console.log("📡 Check SSE stream for response...");
        
        // Note: The response would come back via the SSE stream
        // For this test, we'll just confirm the request was accepted
        
      } else {
        console.log("❌ Figma request failed via SSE");
      }
      
    } else {
      console.log("❌ MCP initialization failed via SSE");
    }
    
    console.log("\n💡 Analysis:");
    console.log("If SSE works but StreamableHTTP doesn't, the issue is:");
    console.log("1. Transport-specific session management");
    console.log("2. Different authentication context between transports");
    console.log("3. Possible bug in StreamableHTTP transport");
    
    console.log("\n🔧 Solutions:");
    console.log("1. Use SSE endpoint for full file access");
    console.log("2. Use StreamableHTTP only for node-specific access");
    console.log("3. Investigate transport differences in MCP SDK");
    
  } catch (error) {
    console.error("❌ SSE test failed:", error);
  }
}

// Run the test
testProductionSSE().then(() => {
  console.log("\n🏁 Production SSE test completed!");
}); 