// Test with a file that should definitely work

async function testKnownPublicFile() {
  console.log("🎨 Testing with Known Working File\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  // This is a well-known public Figma file that should work with any API key
  const testFileKey = "fKYcu1YP7QbdQZjX05QKtN"; // Figma Academy wireframing file
  
  try {
    // Initialize
    console.log("🔌 Initializing MCP...");
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
          clientInfo: { name: "public-test", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    console.log(`✅ Session: ${sessionId}`);

    // Skip reading init response, go straight to tool call
    console.log(`\n📁 Testing file: ${testFileKey}`);
    
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
          arguments: {
            fileKey: testFileKey
          }
        }
      })
    });

    console.log(`📡 Response: ${toolResponse.status}`);

    // Read the response
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
                      console.log("❌ FAILED:", message.result.content[0].text);
                    } else {
                      console.log("✅ SUCCESS! API is working!");
                      const content = message.result.content[0];
                      if (content && content.text) {
                        try {
                          const figmaData = JSON.parse(content.text);
                          console.log(`📊 File: "${figmaData.name}"`);
                          console.log(`📅 Modified: ${figmaData.lastModified}`);
                          console.log(`🎯 Nodes: ${figmaData.nodes?.length || 0}`);
                          console.log("🎉 Your MCP server is working perfectly!");
                          console.log("\n💡 The issue is with your specific file:");
                          console.log("   - It might be private");
                          console.log("   - The file ID might be wrong");
                          console.log("   - You might not have access to it");
                        } catch (e) {
                          console.log("📄 Got data but couldn't parse JSON");
                        }
                      }
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
    console.error("❌ Test failed:", error);
  }
}

// Run the test
testKnownPublicFile().then(() => {
  console.log("\n🏁 Test completed!");
}); 