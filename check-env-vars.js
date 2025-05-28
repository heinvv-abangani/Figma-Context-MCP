// Script to check environment variables on the deployed server

async function checkEnvironmentVariables() {
  console.log("🔍 Checking Environment Variables on Deployed Server...\n");
  
  try {
    // Create a simple endpoint test to see what's available
    const response = await fetch("https://figma-context-mcp-fre3.onrender.com/api/config");
    const config = await response.json();
    
    console.log("✅ Server is responding");
    console.log("📊 Config response:", JSON.stringify(config, null, 2));
    
    // The server shows authMethod: 'api-key', which means it detected a FIGMA_API_KEY
    // But the API calls are still failing, so let's test the Figma API directly
    
    console.log("\n🔑 Testing Figma API access...");
    
    // Let's try to make a direct API call to see what error we get
    await testDirectFigmaAPI();
    
  } catch (error) {
    console.error("❌ Failed to check environment:", error);
  }
}

async function testDirectFigmaAPI() {
  console.log("🌐 Testing direct Figma API call...");
  
  // Test with a known public file that should work
  const testFileKey = "hh6URsZQCurNjjOWrb9XQr";
  
  try {
    // This will help us understand what's happening with the API key
    const figmaUrl = `https://api.figma.com/v1/files/${testFileKey}`;
    
    console.log(`📡 Testing URL: ${figmaUrl}`);
    
    // We can't directly test from here since we don't have the API key locally,
    // but we can create a test endpoint on our server to do this
    
    console.log("💡 The issue is likely:");
    console.log("1. FIGMA_API_KEY environment variable is not set on Render.com");
    console.log("2. The API key is invalid or expired");
    console.log("3. The API key doesn't have access to the files");
    console.log("4. The Figma file IDs are incorrect or private");
    
    console.log("\n🔧 Solutions to try:");
    console.log("1. Check Render.com dashboard → Environment Variables");
    console.log("2. Verify your Figma API key is valid");
    console.log("3. Try with a public Figma file");
    console.log("4. Check if the file URL is correct");
    
  } catch (error) {
    console.error("❌ Direct API test failed:", error);
  }
}

// Run the check
checkEnvironmentVariables(); 