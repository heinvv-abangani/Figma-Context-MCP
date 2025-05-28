// Simple test to verify Figma data retrieval works correctly

async function testWorkingFigma() {
  console.log("🎨 Testing Figma Data Retrieval...\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  try {
    // Step 1: Initialize MCP connection
    console.log("1. 🔌 Initializing MCP connection...");
    
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
          clientInfo: { name: "figma-test", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    console.log(`✅ Connected with session: ${sessionId}`);

    // Step 2: Test with your file
    console.log("\n2. 📁 Fetching your Figma file...");
    await testFigmaFile(baseUrl, sessionId, "z8nv6p3cbJCgTp7hbHXGil", "Your File");
    
    // Step 3: Test with a public file as backup
    console.log("\n3. 📁 Testing with public file...");
    await testFigmaFile(baseUrl, sessionId, "hh6URsZQCurNjjOWrb9XQr", "Public File");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function testFigmaFile(baseUrl, sessionId, fileKey, description) {
  try {
    const toolResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: Math.floor(Math.random() * 1000),
        method: "tools/call",
        params: {
          name: "get_figma_data",
          arguments: { fileKey }
        }
      })
    });

    console.log(`📡 Response status: ${toolResponse.status}`);
    
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
                      console.log(`❌ ${description} failed:`, message.result.content[0].text);
                    } else {
                      console.log(`✅ ${description} SUCCESS!`);
                      
                      // Show a preview of the data
                      const content = message.result.content[0];
                      if (content && content.text) {
                        try {
                          const figmaData = JSON.parse(content.text);
                          console.log(`📊 File: ${figmaData.name}`);
                          console.log(`📅 Last modified: ${figmaData.lastModified}`);
                          console.log(`🎯 Nodes found: ${figmaData.nodes?.length || 0}`);
                          console.log(`🧩 Components: ${Object.keys(figmaData.components || {}).length}`);
                          console.log(`🎨 Global styles: ${Object.keys(figmaData.globalVars?.styles || {}).length}`);
                          
                          // Show first few nodes
                          if (figmaData.nodes && figmaData.nodes.length > 0) {
                            console.log("\n📋 First few nodes:");
                            figmaData.nodes.slice(0, 3).forEach((node, i) => {
                              console.log(`  ${i + 1}. ${node.name} (${node.type})`);
                            });
                          }
                          
                          return true; // Success!
                        } catch (e) {
                          console.log("📄 Raw response preview:", content.text.substring(0, 200) + "...");
                        }
                      }
                    }
                  }
                } catch (e) {
                  // Ignore non-JSON data
                }
              }
            }
          }
        }
      }
    }
  } catch (error) {
    console.error(`❌ ${description} test failed:`, error);
  }
  
  return false;
}

// Run the test
testWorkingFigma().then(() => {
  console.log("\n🏁 Test completed!");
}); 