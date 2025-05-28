// Simple test to see exact responses

async function simpleFigmaTest() {
  console.log("🔍 Simple Figma Test - Detailed Responses\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  try {
    // Step 1: Initialize
    console.log("1. 🔌 Initializing...");
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
          clientInfo: { name: "simple-test", version: "1.0.0" }
        }
      })
    });

    console.log("Init Response Status:", initResponse.status);
    console.log("Init Response Headers:");
    for (const [key, value] of initResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }
    
    const sessionId = initResponse.headers.get("mcp-session-id");
    console.log("Session ID:", sessionId);

    // Read the init response
    if (initResponse.headers.get("content-type")?.includes("text/event-stream")) {
      console.log("\n📡 Reading init response...");
      const reader = initResponse.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let buffer = "";
        let messageCount = 0;
        
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
                console.log(`Message ${messageCount}:`, data);
                
                try {
                  const message = JSON.parse(data);
                  if (message.result) {
                    console.log("✅ Init successful!");
                    break;
                  }
                } catch (e) {
                  // Not JSON, that's ok
                }
              }
            }
          }
          
          if (messageCount > 0) break; // Got at least one message
        }
      }
    }

    // Step 2: Test Figma call
    console.log("\n2. 📁 Testing Figma file access...");
    const toolResponse = await fetch(`${baseUrl}/mcp`, {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "Accept": "application/json, text/event-stream",
        "mcp-session-id": sessionId || "test-session"
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 2,
        method: "tools/call",
        params: {
          name: "get_figma_data",
          arguments: {
            fileKey: "z8nv6p3cbJCgTp7hbHXGil"
          }
        }
      })
    });

    console.log("Tool Response Status:", toolResponse.status);
    console.log("Tool Response Headers:");
    for (const [key, value] of toolResponse.headers.entries()) {
      console.log(`  ${key}: ${value}`);
    }

    // Read the tool response
    if (toolResponse.headers.get("content-type")?.includes("text/event-stream")) {
      console.log("\n📡 Reading tool response...");
      const reader = toolResponse.body?.getReader();
      const decoder = new TextDecoder();
      
      if (reader) {
        let buffer = "";
        let messageCount = 0;
        
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
                console.log(`\nTool Message ${messageCount}:`);
                console.log(data);
                
                try {
                  const message = JSON.parse(data);
                  if (message.result) {
                    if (message.result.isError) {
                      console.log("❌ ERROR:", message.result.content[0].text);
                    } else {
                      console.log("✅ SUCCESS! Got Figma data!");
                      const content = message.result.content[0];
                      if (content && content.text) {
                        console.log("📊 Data length:", content.text.length, "characters");
                        console.log("📄 Preview:", content.text.substring(0, 200) + "...");
                      }
                    }
                  }
                } catch (e) {
                  console.log("(Not JSON data)");
                }
              }
            }
          }
          
          if (messageCount > 2) break; // Don't read forever
        }
      }
    }

  } catch (error) {
    console.error("❌ Test failed:", error);
  }
}

// Run the test
simpleFigmaTest().then(() => {
  console.log("\n🏁 Simple test completed!");
}); 