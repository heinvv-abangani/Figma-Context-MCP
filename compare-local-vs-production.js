// Compare local vs production behavior

async function compareLocalVsProduction() {
  console.log("🔍 Comparing Local vs Production Behavior\n");
  
  const productionUrl = "https://figma-context-mcp-fre3.onrender.com";
  const fileKey = "TY55XemMUd0snlx7B9ZeeS"; // V4 - Components
  
  console.log("📋 Analysis:");
  console.log("✅ Local (localhost SSE): Full file access worked");
  console.log("❌ Production (Render.com): Full file access fails with 400 Bad Request");
  console.log("✅ Production (Render.com): Node-specific access works");
  console.log("");
  
  console.log("🤔 Possible causes:");
  console.log("1. Different API key between local and production");
  console.log("2. Different authentication method (OAuth vs API key)");
  console.log("3. Network/IP restrictions on the API key");
  console.log("4. Different Figma API endpoints being called");
  console.log("5. Rate limiting or API quotas");
  console.log("");
  
  // Let's check the current production configuration
  console.log("🔧 Checking production configuration...");
  
  try {
    const configResponse = await fetch(`${productionUrl}/api/debug-figma`);
    const debugInfo = await configResponse.json();
    
    console.log("📊 Production API Key Info:");
    console.log(`   Has API Key: ${debugInfo.hasApiKey}`);
    console.log(`   API Key Length: ${debugInfo.apiKeyLength}`);
    console.log(`   API Key Preview: ${debugInfo.apiKeyPreview}`);
    console.log(`   Uses OAuth: ${debugInfo.useOAuth}`);
    
    if (debugInfo.figmaApiTest) {
      console.log("📡 Production API Test Result:");
      console.log(`   Status: ${debugInfo.figmaApiTest.status}`);
      console.log(`   Success: ${debugInfo.figmaApiTest.success}`);
      if (debugInfo.figmaApiTest.error) {
        console.log(`   Error: ${debugInfo.figmaApiTest.error}`);
      }
    }
    
    console.log("\n💡 Recommendations:");
    
    if (debugInfo.hasApiKey && debugInfo.apiKeyLength > 0) {
      console.log("✅ API key is present in production");
      
      if (debugInfo.figmaApiTest && !debugInfo.figmaApiTest.success) {
        console.log("❌ But the API key test failed");
        console.log("🔧 Possible solutions:");
        console.log("   1. The API key in production is different from your local one");
        console.log("   2. Copy your working local API key to production");
        console.log("   3. Check if your local API key has different permissions");
      }
    } else {
      console.log("❌ No API key found in production");
      console.log("🔧 Solution: Set FIGMA_API_KEY environment variable");
    }
    
    console.log("\n🧪 Testing both access methods:");
    
    // Test full file access
    console.log("\n1. Testing full file access (like local)...");
    await testFullFileAccess(productionUrl, fileKey);
    
    // Test node access (which we know works)
    console.log("\n2. Testing node access (which works)...");
    await testNodeAccess(productionUrl, fileKey, "2668-12938");
    
    console.log("\n🔑 Next steps:");
    console.log("1. Compare your local FIGMA_API_KEY with production");
    console.log("2. Ensure the same API key is used in both environments");
    console.log("3. Check if your local setup uses OAuth instead of API key");
    console.log("4. Verify file permissions haven't changed");
    
  } catch (error) {
    console.error("❌ Failed to check production config:", error);
  }
}

async function testFullFileAccess(baseUrl, fileKey) {
  try {
    // Initialize MCP
    const initResponse = await fetch(`${baseUrl}/mcp`, {
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
          clientInfo: { name: "comparison-test", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    
    // Test full file
    const toolResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "get_figma_data",
          arguments: { fileKey }
        }
      })
    });

    // Read response
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
                      console.log(`❌ Full file access: ${message.result.content[0].text}`);
                      return false;
                    } else {
                      console.log(`✅ Full file access: SUCCESS!`);
                      return true;
                    }
                  }
                } catch (e) {
                  // Ignore non-JSON
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Full file test error:", error);
  }
  return false;
}

async function testNodeAccess(baseUrl, fileKey, nodeId) {
  try {
    // Initialize MCP
    const initResponse = await fetch(`${baseUrl}/mcp`, {
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
          clientInfo: { name: "node-test", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    
    // Test node access
    const toolResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "get_figma_data",
          arguments: { fileKey, nodeId }
        }
      })
    });

    // Read response
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
                      console.log(`❌ Node access: ${message.result.content[0].text}`);
                      return false;
                    } else {
                      console.log(`✅ Node access: SUCCESS!`);
                      return true;
                    }
                  }
                } catch (e) {
                  // Ignore non-JSON
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error("❌ Node test error:", error);
  }
  return false;
}

// Run the comparison
compareLocalVsProduction().then(() => {
  console.log("\n🏁 Comparison completed!");
}); 