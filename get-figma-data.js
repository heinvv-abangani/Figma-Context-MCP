// Simple script to get your Figma JSON data

async function getFigmaData() {
  console.log("🎨 Getting Figma Data for: V4 - Components\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  const fileKey = "TY55XemMUd0snlx7B9ZeeS";
  const nodeId = "2668-12938";
  
  try {
    // Initialize MCP connection
    console.log("🔌 Connecting to MCP server...");
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
          clientInfo: { name: "figma-data-getter", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    console.log(`✅ Connected! Session: ${sessionId}`);

    // Get Figma data
    console.log("📡 Fetching Figma data...");
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
                    console.log(`✅ SUCCESS! Got ${content.text.length} characters of data`);
                    
                    // Try to save with Node.js fs
                    try {
                      const fs = require('fs');
                      fs.writeFileSync('figma-data.json', content.text);
                      console.log("💾 Saved to figma-data.json");
                    } catch (fsError) {
                      console.log("⚠️  Could not save file automatically");
                      console.log("📋 Here's your Figma JSON data:");
                      console.log("=" * 50);
                      console.log(content.text);
                      console.log("=" * 50);
                    }
                    
                    // Show preview
                    try {
                      const figmaData = JSON.parse(content.text);
                      console.log("\n📊 Data Summary:");
                      console.log(`   File: "${figmaData.name}"`);
                      console.log(`   Version: ${figmaData.version}`);
                      if (figmaData.document) {
                        console.log(`   Document: "${figmaData.document.name}" (${figmaData.document.type})`);
                      }
                      if (figmaData.nodes) {
                        console.log(`   Nodes: ${Object.keys(figmaData.nodes).length}`);
                      }
                    } catch (e) {
                      console.log("📄 Raw JSON data retrieved successfully");
                    }
                    
                    return content.text;
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
  }
}

// Run it
getFigmaData().then((data) => {
  if (data) {
    console.log("\n🎉 Figma data retrieved successfully!");
    console.log("You can now use this JSON data in your application.");
  } else {
    console.log("\n❌ Failed to retrieve data");
  }
}); 