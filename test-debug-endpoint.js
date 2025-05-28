// Test the debug endpoint to identify Figma API issues

async function testDebugEndpoint() {
  console.log("🔍 Testing Debug Endpoint...\n");
  
  try {
    const response = await fetch("https://figma-context-mcp-fre3.onrender.com/api/debug-figma");
    
    if (!response.ok) {
      console.log("❌ Debug endpoint not available yet. You need to:");
      console.log("1. Push the updated code to your repository");
      console.log("2. Redeploy on Render.com");
      console.log("3. Wait for deployment to complete");
      return;
    }
    
    const debugInfo = await response.json();
    console.log("🔍 Debug Information:");
    console.log(JSON.stringify(debugInfo, null, 2));
    
    // Analyze the results
    console.log("\n📊 Analysis:");
    
    if (!debugInfo.hasApiKey) {
      console.log("❌ CRITICAL: No FIGMA_API_KEY found!");
      console.log("🔧 Solution: Set FIGMA_API_KEY in Render.com environment variables");
    } else {
      console.log("✅ FIGMA_API_KEY is present");
      console.log(`📏 API Key length: ${debugInfo.apiKeyLength} characters`);
      console.log(`👀 API Key preview: ${debugInfo.apiKeyPreview}`);
      
      if (debugInfo.figmaApiTest) {
        if (debugInfo.figmaApiTest.success) {
          console.log("✅ Figma API test successful!");
          console.log("🎉 Your API key is working correctly!");
        } else {
          console.log("❌ Figma API test failed:");
          console.log(`Status: ${debugInfo.figmaApiTest.status} - ${debugInfo.figmaApiTest.statusText}`);
          if (debugInfo.figmaApiTest.error) {
            console.log(`Error: ${debugInfo.figmaApiTest.error}`);
          }
          
          // Provide specific solutions based on the error
          if (debugInfo.figmaApiTest.status === 401) {
            console.log("\n🔧 Solution: Your API key is invalid or expired");
            console.log("1. Go to Figma → Settings → Account → Personal access tokens");
            console.log("2. Create a new token");
            console.log("3. Update FIGMA_API_KEY in Render.com");
          } else if (debugInfo.figmaApiTest.status === 403) {
            console.log("\n🔧 Solution: Your API key doesn't have access to this file");
            console.log("1. Make sure the file is public or you have access");
            console.log("2. Try with a different file");
          } else if (debugInfo.figmaApiTest.status === 404) {
            console.log("\n🔧 Solution: File not found");
            console.log("1. Check if the file ID is correct");
            console.log("2. Make sure the file exists and is accessible");
          }
        }
      }
    }
    
  } catch (error) {
    console.error("❌ Failed to test debug endpoint:", error);
    console.log("\n💡 This might mean:");
    console.log("1. The server hasn't been updated yet");
    console.log("2. There's a deployment issue");
    console.log("3. The debug endpoint isn't available");
  }
}

// Run the test
testDebugEndpoint(); 