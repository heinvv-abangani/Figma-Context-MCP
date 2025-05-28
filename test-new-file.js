// Test the new Figma file: V4 - Components

async function testNewFigmaFile() {
  console.log("🎨 Testing New Figma File: V4 - Components\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  const newFileKey = "TY55XemMUd0snlx7B9ZeeS"; // V4 - Components
  
  console.log("📋 Testing file:");
  console.log("URL: https://www.figma.com/design/TY55XemMUd0snlx7B9ZeeS/V4---Components");
  console.log("File ID:", newFileKey);
  console.log("File Name: V4 - Components\n");
  
  try {
    // Initialize MCP connection
    console.log("🔌 Initializing MCP connection...");
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
          clientInfo: { name: "new-file-test", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    console.log(`✅ Session: ${sessionId}\n`);

    // Test the new file
    console.log("📁 Testing V4 - Components file...");
    const success = await testFileAccess(baseUrl, sessionId, newFileKey, "V4 - Components");
    
    if (success) {
      console.log("\n🎉 SUCCESS! This file works with your MCP server!");
      console.log("🔧 You can now use this file ID in your applications:");
      console.log(`   File ID: ${newFileKey}`);
    } else {
      console.log("\n❌ This file also has access restrictions.");
      console.log("💡 You may need to:");
      console.log("   1. Make this file public");
      console.log("   2. Grant access to your API key");
      console.log("   3. Or test with a completely public file");
    }

    // Also test with a specific node ID from the URL
    console.log("\n🎯 Testing with specific node ID...");
    const nodeId = "2668-12938"; // From the URL
    await testFileWithNode(baseUrl, sessionId, newFileKey, nodeId, "Specific Node");

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

async function testFileAccess(baseUrl, sessionId, fileKey, description) {
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
                      const error = message.result.content[0].text;
                      console.log(`❌ ${description}: ${error}`);
                      
                      // Analyze the error
                      if (error.includes("400") || error.includes("Bad Request")) {
                        console.log("   → Private file - needs access permissions");
                      } else if (error.includes("403") || error.includes("Forbidden")) {
                        console.log("   → API key doesn't have permission");
                      } else if (error.includes("404") || error.includes("Not Found")) {
                        console.log("   → File doesn't exist or is inaccessible");
                      }
                      
                      return false;
                    } else {
                      console.log(`✅ ${description}: SUCCESS!`);
                      const content = message.result.content[0];
                      if (content && content.text) {
                        try {
                          const figmaData = JSON.parse(content.text);
                          console.log(`   📊 File: "${figmaData.name}"`);
                          console.log(`   📅 Last modified: ${figmaData.lastModified}`);
                          console.log(`   🎯 Total nodes: ${figmaData.nodes?.length || 0}`);
                          console.log(`   🧩 Components: ${Object.keys(figmaData.components || {}).length}`);
                          console.log(`   🎨 Styles: ${Object.keys(figmaData.globalVars?.styles || {}).length}`);
                          
                          // Show first few nodes
                          if (figmaData.nodes && figmaData.nodes.length > 0) {
                            console.log(`   📋 Sample nodes:`);
                            figmaData.nodes.slice(0, 3).forEach((node, i) => {
                              console.log(`      ${i + 1}. "${node.name}" (${node.type})`);
                            });
                          }
                        } catch (e) {
                          console.log("   📄 Got valid data (couldn't parse JSON)");
                        }
                      }
                      return true;
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
    console.error(`❌ Error testing ${description}:`, error);
  }
  
  return false;
}

async function testFileWithNode(baseUrl, sessionId, fileKey, nodeId, description) {
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
          arguments: { 
            fileKey,
            nodeId 
          }
        }
      })
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
                      const error = message.result.content[0].text;
                      console.log(`❌ ${description} (node ${nodeId}): ${error}`);
                      return false;
                    } else {
                      console.log(`✅ ${description} (node ${nodeId}): SUCCESS!`);
                      const content = message.result.content[0];
                      if (content && content.text) {
                        console.log(`   📄 Node data length: ${content.text.length} characters`);
                      }
                      return true;
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
    console.error(`❌ Error testing ${description} with node:`, error);
  }
  
  return false;
}

// Run the test
testNewFigmaFile().then(() => {
  console.log("\n🏁 New file test completed!");
}); 