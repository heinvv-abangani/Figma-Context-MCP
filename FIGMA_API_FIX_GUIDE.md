# 🔧 Figma API Fix Guide

## Current Issue
Your MCP server is working perfectly, but the Figma API calls are failing with "Bad Request" errors. This means the `FIGMA_API_KEY` environment variable is either missing or invalid.

## 🚀 Step-by-Step Solution

### Step 1: Get a Valid Figma API Key

1. **Go to Figma Settings**
   - Open [Figma](https://figma.com)
   - Click your profile picture → Settings
   - Go to "Account" tab
   - Scroll down to "Personal access tokens"

2. **Create a New Token**
   - Click "Create new token"
   - Give it a name like "MCP Server Token"
   - Click "Create token"
   - **COPY THE TOKEN IMMEDIATELY** (you won't see it again!)

### Step 2: Set Environment Variable on Render.com

1. **Go to Render Dashboard**
   - Open [render.com](https://render.com)
   - Go to your `figma-mcp-server` service

2. **Set Environment Variables**
   - Click "Environment" tab
   - Add a new environment variable:
     - **Key**: `FIGMA_API_KEY`
     - **Value**: Your copied Figma token (starts with `figd_...`)
   - Click "Save Changes"

3. **Redeploy**
   - The service should automatically redeploy
   - Wait for deployment to complete (green status)

### Step 3: Deploy Updated Code (Optional but Recommended)

To get better debugging capabilities:

1. **Push the updated code**:
   ```bash
   git add .
   git commit -m "Add Figma API debug endpoint"
   git push origin main
   ```

2. **Wait for automatic deployment** on Render.com

### Step 4: Test the Fix

Run this command to test if the API key is working:

```bash
node test-debug-endpoint.js
```

If the debug endpoint is available, you'll see detailed information about the API key status.

### Step 5: Test Figma Data Retrieval

Once the API key is set, test with the correct MCP protocol:

```javascript
// Correct way to call your MCP server
const initResponse = await fetch("https://figma-context-mcp-fre3.onrender.com/mcp", {
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
      clientInfo: { name: "test-client", version: "1.0.0" }
    }
  })
});

// Get session ID from headers
const sessionId = initResponse.headers.get("mcp-session-id");

// Then call the Figma tool
const toolResponse = await fetch("https://figma-context-mcp-fre3.onrender.com/mcp", {
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
      arguments: {
        fileKey: "z8nv6p3cbJCgTp7hbHXGil"
      }
    }
  })
});
```

## 🔍 Troubleshooting

### If you still get errors after setting the API key:

1. **Check API Key Format**
   - Should start with `figd_`
   - Should be around 40+ characters long
   - No extra spaces or characters

2. **Check File Access**
   - Make sure the Figma file is accessible
   - Try with a public file first
   - Check if the file ID is correct

3. **Test with Different Files**
   - Try with this public file: `hh6URsZQCurNjjOWrb9XQr`
   - If that works, the issue is with your specific file

4. **Check Figma File URL Format**
   - URL should be: `https://www.figma.com/file/z8nv6p3cbJCgTp7hbHXGil/...`
   - The file key is the part after `/file/` and before the next `/`

## 🎯 Expected Success

Once fixed, you should see:
- ✅ Successful API calls
- 📊 Figma design data returned
- 🎨 Layout information, components, and styles

## 📞 Quick Test Commands

After setting the API key, run:

```bash
# Test the debug endpoint
node test-debug-endpoint.js

# Test the full MCP flow
node test-mcp-final.js
```

## 🚨 Common Mistakes

1. **Wrong Environment Variable Name**: Must be exactly `FIGMA_API_KEY`
2. **Spaces in API Key**: Copy the token exactly, no extra spaces
3. **Old/Expired Token**: Create a fresh token if issues persist
4. **Private File**: Make sure you have access to the Figma file

Once you complete these steps, your MCP server should return the correct Figma data! 🎉 