// Script to fetch and save Figma data properly
import fs from 'fs';

async function saveFigmaData() {
  console.log("🎨 Fetching and saving Figma data...\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  const fileKey = "TY55XemMUd0snlx7B9ZeeS";
  const nodeId = "2668-12938";
  
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
          clientInfo: { name: "figma-saver", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    console.log(`✅ Connected! Session: ${sessionId}`);

    // Get Figma data
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

    // Read the response
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
                if (message.result && !message.result.isError) {
                  const content = message.result.content[0];
                  if (content && content.text) {
                    console.log(`✅ Got ${content.text.length} characters of data`);
                    
                    // Save to file
                    fs.writeFileSync('figma-data.json', content.text);
                    console.log("💾 Saved to figma-data.json");
                    
                    // Also save a pretty-printed version
                    try {
                      const figmaData = JSON.parse(content.text);
                      fs.writeFileSync('figma-data-pretty.json', JSON.stringify(figmaData, null, 2));
                      console.log("💾 Saved pretty version to figma-data-pretty.json");
                      
                      // Show summary
                      console.log("\n📊 Data Summary:");
                      console.log(`   File: "${figmaData.name}"`);
                      console.log(`   Version: ${figmaData.version}`);
                      if (figmaData.document) {
                        console.log(`   Document: "${figmaData.document.name}" (${figmaData.document.type})`);
                      }
                      if (figmaData.nodes) {
                        console.log(`   Nodes: ${Object.keys(figmaData.nodes).length}`);
                        Object.keys(figmaData.nodes).forEach(nodeKey => {
                          const node = figmaData.nodes[nodeKey];
                          if (node && node.document) {
                            console.log(`      - ${nodeKey}: "${node.document.name}" (${node.document.type})`);
                          }
                        });
                      }
                      
                    } catch (e) {
                      console.log("📄 Raw JSON data saved");
                    }
                    
                    return true;
                  }
                }
              } catch (e) {
                // Ignore non-JSON lines
              }
            }
          }
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Error:", error);
    return false;
  }
  
  return false;
}

// Run it
saveFigmaData().then((success) => {
  if (success) {
    console.log("\n🎉 SUCCESS! Your Figma data has been saved!");
    console.log("\n📁 Files created:");
    console.log("   • figma-data.json (raw JSON)");
    console.log("   • figma-data-pretty.json (formatted JSON)");
    console.log("\n💡 You can now use this data in your application!");
  } else {
    console.log("\n❌ Failed to save data");
  }
}); 