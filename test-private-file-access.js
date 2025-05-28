// Test to understand private file access issues

async function testPrivateFileAccess() {
  console.log("🔒 Testing Private File Access Issue\n");
  
  const baseUrl = "https://figma-context-mcp-fre3.onrender.com";
  
  console.log("📋 Analysis of your file:");
  console.log("URL: https://www.figma.com/design/z8nv6p3cbJCgTp7hbHXGil/Indications");
  console.log("File ID: z8nv6p3cbJCgTp7hbHXGil");
  console.log("File Name: Indications");
  console.log("Status: Private file (requires specific access)\n");
  
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
          clientInfo: { name: "private-test", version: "1.0.0" }
        }
      })
    });

    const sessionId = initResponse.headers.get("mcp-session-id");
    console.log(`✅ Session: ${sessionId}\n`);

    // Test 1: Try your private file
    console.log("1. 🔒 Testing your private file...");
    await testFileAccess(baseUrl, sessionId, "z8nv6p3cbJCgTp7hbHXGil", "Your Private File");
    
    // Test 2: Try a truly public file (Figma's own examples)
    console.log("\n2. 🌍 Testing with Figma's public examples...");
    
    // These are known public files from Figma's community
    const publicFiles = [
      { key: "HhL7DNBP0k5ctMz5e9AwXM", name: "Figma Community Example 1" },
      { key: "KvFCEjnxS9Q1yZr2MXZJKL", name: "Figma Community Example 2" }
    ];
    
    for (const file of publicFiles) {
      console.log(`\n📁 Testing: ${file.name}`);
      const success = await testFileAccess(baseUrl, sessionId, file.key, file.name);
      if (success) {
        console.log("🎉 Found a working public file!");
        break;
      }
    }
    
    // Provide solutions
    console.log("\n" + "=".repeat(60));
    console.log("🔧 SOLUTIONS FOR YOUR PRIVATE FILE:");
    console.log("=".repeat(60));
    
    console.log("\n1. 📝 Make the file public:");
    console.log("   • Open your Figma file");
    console.log("   • Click 'Share' button (top right)");
    console.log("   • Change from 'Only people invited' to 'Anyone with the link'");
    console.log("   • Set permission to 'can view'");
    
    console.log("\n2. 🔑 Add your API key to the file:");
    console.log("   • In Figma, go to your file");
    console.log("   • Click 'Share' → 'Invite people'");
    console.log("   • Add the email associated with your API key");
    console.log("   • Give 'can view' or 'can edit' permission");
    
    console.log("\n3. 🏢 Team/Organization access:");
    console.log("   • If this is a team file, make sure your API key");
    console.log("   • belongs to the same team/organization");
    
    console.log("\n4. 🧪 Test with a public file first:");
    console.log("   • Create a new public file in Figma");
    console.log("   • Test with that file ID to verify your setup works");
    
    console.log("\n5. 📋 Alternative: Use a public template:");
    console.log("   • Go to Figma Community");
    console.log("   • Duplicate a public template to your account");
    console.log("   • Use that file ID for testing");

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
                        console.log("   → This confirms it's a private file access issue");
                      } else if (error.includes("403") || error.includes("Forbidden")) {
                        console.log("   → API key doesn't have permission to this file");
                      } else if (error.includes("404") || error.includes("Not Found")) {
                        console.log("   → File doesn't exist or is completely inaccessible");
                      }
                      
                      return false;
                    } else {
                      console.log(`✅ ${description}: SUCCESS!`);
                      const content = message.result.content[0];
                      if (content && content.text) {
                        try {
                          const figmaData = JSON.parse(content.text);
                          console.log(`   📊 File: "${figmaData.name}"`);
                          console.log(`   🎯 Nodes: ${figmaData.nodes?.length || 0}`);
                        } catch (e) {
                          console.log("   📄 Got valid data");
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

// Run the test
testPrivateFileAccess().then(() => {
  console.log("\n🏁 Private file access test completed!");
}); 