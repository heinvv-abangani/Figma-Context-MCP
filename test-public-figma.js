// Test with known working public Figma files

async function testPublicFigmaFiles() {
  console.log("🎨 Testing with Known Public Figma Files...\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  // Known public Figma files that should work
  const publicFiles = [
    { key: "fKYcu1YP7QbdQZjX05QKtN", name: "Figma Academy - Wireframing" },
    { key: "LKQ4FJ4bTnCSjedbRpk931", name: "Figma Config 2023" },
    { key: "z8nv6p3cbJCgTp7hbHXGil", name: "Your Original File" }
  ];
  
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
          clientInfo: { name: "public-test", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    console.log(`✅ Connected with session: ${sessionId}\n`);

    // Test each file
    for (const file of publicFiles) {
      console.log(`📁 Testing: ${file.name} (${file.key})`);
      const success = await testFigmaFile(baseUrl, sessionId, file.key, file.name);
      if (success) {
        console.log(`🎉 SUCCESS! Found working file: ${file.name}\n`);
        break;
      }
      console.log(); // Empty line between tests
    }

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
                      console.log(`❌ Failed: ${message.result.content[0].text}`);
                      return false;
                    } else {
                      console.log(`✅ SUCCESS!`);
                      
                      // Show detailed data
                      const content = message.result.content[0];
                      if (content && content.text) {
                        try {
                          const figmaData = JSON.parse(content.text);
                          console.log(`📊 File: "${figmaData.name}"`);
                          console.log(`📅 Last modified: ${figmaData.lastModified}`);
                          console.log(`🎯 Nodes: ${figmaData.nodes?.length || 0}`);
                          console.log(`🧩 Components: ${Object.keys(figmaData.components || {}).length}`);
                          console.log(`🎨 Styles: ${Object.keys(figmaData.globalVars?.styles || {}).length}`);
                          
                          // Show sample nodes
                          if (figmaData.nodes && figmaData.nodes.length > 0) {
                            console.log(`📋 Sample nodes:`);
                            figmaData.nodes.slice(0, 3).forEach((node, i) => {
                              console.log(`  ${i + 1}. "${node.name}" (${node.type})`);
                              if (node.children && node.children.length > 0) {
                                console.log(`     └─ ${node.children.length} children`);
                              }
                            });
                          }
                          
                          return true; // Success!
                        } catch (e) {
                          console.log("📄 Raw data preview:", content.text.substring(0, 300) + "...");
                          return true; // Still success, just couldn't parse
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
    console.error(`❌ Error testing ${description}:`, error);
  }
  
  return false;
}

// Run the test
testPublicFigmaFiles().then(() => {
  console.log("🏁 All tests completed!");
}); 