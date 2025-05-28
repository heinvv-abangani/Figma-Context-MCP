// Test to get JSON data from your specific Figma file

async function testYourFigmaFile() {
  console.log("🎨 Testing Your Figma File: V4 - Components\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  // Your file details
  const fileKey = "TY55XemMUd0snlx7B9ZeeS";
  const nodeId = "2668-12938";
  const fileUrl = "https://www.figma.com/design/TY55XemMUd0snlx7B9ZeeS/V4---Components?node-id=2668-12938&m=dev";
  
  console.log("📋 File Details:");
  console.log(`URL: ${fileUrl}`);
  console.log(`File Key: ${fileKey}`);
  console.log(`Node ID: ${nodeId}`);
  console.log("");
  
  try {
    // Test node-specific access (we know this works)
    console.log("🎯 Testing node-specific access...");
    const success = await testNodeAccess(baseUrl, fileKey, nodeId);
    
    if (success) {
      console.log("\n✅ SUCCESS! Your Figma data has been retrieved!");
    } else {
      console.log("\n❌ Failed to get Figma data");
    }
    
  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function testNodeAccess(baseUrl, fileKey, nodeId) {
  try {
    // Initialize MCP connection
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
          clientInfo: { name: "figma-node-test", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    console.log(`   Session: ${sessionId}`);

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

    // Read the SSE response
    if (toolResponse.headers.get("content-type")?.includes("text/event-stream")) {
      const reader = toolResponse.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let buffer = "";
        let figmaDataText = "";
        
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
                      console.log(`   ❌ Node access failed: ${message.result.content[0].text}`);
                      return false;
                    } else {
                      console.log(`   ✅ Node access SUCCESS!`);
                      const content = message.result.content[0];
                      if (content && content.text) {
                        figmaDataText = content.text;
                        console.log(`   📊 Data size: ${figmaDataText.length} characters`);
                        
                        // Save the node data
                        const fs = require('fs');
                        fs.writeFileSync('figma-node-data.json', figmaDataText);
                        console.log(`   💾 Saved to: figma-node-data.json`);
                        
                        // Show preview
                        try {
                          const figmaData = JSON.parse(figmaDataText);
                          console.log(`   📋 File: "${figmaData.name}"`);
                          console.log(`   🎯 Target node: ${nodeId}`);
                          
                          // Show document structure
                          if (figmaData.document) {
                            console.log(`   📄 Document type: ${figmaData.document.type}`);
                            console.log(`   📄 Document name: "${figmaData.document.name}"`);
                            if (figmaData.document.children) {
                              console.log(`   📦 Pages: ${figmaData.document.children.length}`);
                            }
                          }
                          
                          // Show nodes if available
                          if (figmaData.nodes) {
                            const nodeKeys = Object.keys(figmaData.nodes);
                            console.log(`   🎯 Specific nodes: ${nodeKeys.length}`);
                            nodeKeys.slice(0, 3).forEach((key, i) => {
                              const node = figmaData.nodes[key];
                              if (node && node.document) {
                                console.log(`      ${i + 1}. "${node.document.name}" (${node.document.type})`);
                              }
                            });
                          }
                          
                          // Show a small preview of the raw JSON
                          console.log(`\n   📄 JSON Preview (first 300 chars):`);
                          console.log(`   ${figmaDataText.substring(0, 300)}...`);
                          
                        } catch (e) {
                          console.log(`   📄 Raw data preview: ${figmaDataText.substring(0, 200)}...`);
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
        
        // If we got data but didn't process it yet
        if (figmaDataText) {
          return true;
        }
      }
    }
  } catch (error) {
    console.log(`   ❌ Node access error: ${error.message}`);
  }
  return false;
}

// Run the test
testYourFigmaFile().then(() => {
  console.log("\n🏁 Test completed!");
  console.log("\n📁 Your Figma JSON data should be saved as:");
  console.log("   • figma-node-data.json");
  console.log("\n💡 You can now use this JSON data in your application!");
}); 