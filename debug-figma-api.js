// Debug script to test Figma API directly

async function debugFigmaAPI() {
  console.log("🔍 Debugging Figma API Access...\n");
  
  // Test 1: Check if our deployed server has the API key configured
  console.log("1. Checking server configuration...");
  try {
    const configRes = await fetch("https://figma-context-mcp-fre3.onrender.com/api/config");
    const config = await configRes.json();
    console.log("✅ Server config:", config);
    console.log("Auth method:", config.authMethod);
  } catch (error) {
    console.error("❌ Failed to get server config:", error);
  }

  // Test 2: Try to access a public Figma file directly
  console.log("\n2. Testing with a known public Figma file...");
  
  // Let's try with a different, known public file first
  const publicFileKey = "hh6URsZQCurNjjOWrb9XQr"; // This is a public Figma community file
  
  await testFigmaFile(publicFileKey, "Public Community File");
  
  // Test 3: Try with your original file
  console.log("\n3. Testing with your original file...");
  await testFigmaFile("z8nv6p3cbJCgTp7hbHXGil", "Your Original File");
  
  // Test 4: Try with a simple node request
  console.log("\n4. Testing with node-specific request...");
  await testFigmaFileWithNode("z8nv6p3cbJCgTp7hbHXGil", "1:2");
}

async function testFigmaFile(fileKey, description) {
  console.log(`\n📁 Testing ${description} (${fileKey})...`);
  
  try {
    const initResponse = await fetch("https://figma-context-mcp-fre3.onrender.com/mcp", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: { roots: { listChanged: true }, sampling: {} },
          clientInfo: { name: "debug-client", version: "1.0.0" }
        }
      })
    });

    // Get session ID from headers
    const sessionId = initResponse.headers.get("mcp-session-id") || `debug-${Date.now()}`;
    
    // Skip the SSE reading for init, just get the session and test the tool
    const toolCallRequest = {
      jsonrpc: "2.0",
      id: 2,
      method: "tools/call",
      params: {
        name: "get_figma_data",
        arguments: {
          fileKey: fileKey
        }
      }
    };

    const toolResponse = await fetch("https://figma-context-mcp-fre3.onrender.com/mcp", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId
      },
      body: JSON.stringify(toolCallRequest)
    });

    console.log(`Response status: ${toolResponse.status}`);
    
    if (toolResponse.headers.get("content-type")?.includes("text/event-stream")) {
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
                  if (message.result) {
                    if (message.result.isError) {
                      console.log(`❌ Error for ${description}:`, message.result.content[0].text);
                    } else {
                      console.log(`✅ Success for ${description}!`);
                      console.log("📊 Data preview:", JSON.stringify(message.result, null, 2).substring(0, 500) + "...");
                      return true; // Success!
                    }
                  }
                } catch (e) {
                  console.log("Non-JSON data:", data);
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ Failed to test ${description}:`, error);
  }
  
  return false;
}

async function testFigmaFileWithNode(fileKey, nodeId) {
  console.log(`\n🎯 Testing with specific node (${fileKey}, node: ${nodeId})...`);
  
  try {
    const initResponse = await fetch("https://figma-context-mcp-fre3.onrender.com/mcp", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "initialize",
        params: {
          protocolVersion: "2024-11-05",
          capabilities: { roots: { listChanged: true }, sampling: {} },
          clientInfo: { name: "debug-client", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id") || `debug-${Date.now()}`;
    
    const toolCallRequest = {
      jsonrpc: "2.0",
      id: 3,
      method: "tools/call",
      params: {
        name: "get_figma_data",
        arguments: {
          fileKey: fileKey,
          nodeId: nodeId
        }
      }
    };

    const toolResponse = await fetch("https://figma-context-mcp-fre3.onrender.com/mcp", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId
      },
      body: JSON.stringify(toolCallRequest)
    });

    if (toolResponse.headers.get("content-type")?.includes("text/event-stream")) {
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
                  if (message.result) {
                    if (message.result.isError) {
                      console.log("❌ Error with node request:", message.result.content[0].text);
                    } else {
                      console.log("✅ Success with node request!");
                      console.log("📊 Data preview:", JSON.stringify(message.result, null, 2).substring(0, 500) + "...");
                      return true;
                    }
                  }
                } catch (e) {
                  console.log("Non-JSON data:", data);
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Failed to test with node:", error);
  }
  
  return false;
}

// Run the debug
debugFigmaAPI().then(() => {
  console.log("\n🏁 Debug completed!");
}); 