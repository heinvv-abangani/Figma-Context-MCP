# Deployment Guide for Render.com

This guide explains how to deploy the Figma MCP Server to Render.com.

## Prerequisites

1. A Render.com account
2. A Figma Personal Access Token or OAuth Token
3. This repository pushed to GitHub/GitLab

## Deployment Options

### Option 1: Native Node.js Deployment (Recommended)

1. **Connect Repository**
   - Go to Render.com dashboard
   - Click "New +" → "Web Service"
   - Connect your GitHub/GitLab repository

2. **Configure Service**
   - **Name**: `figma-mcp-server`
   - **Runtime**: `Node`
   - **Build Command**: `pnpm install && pnpm build`
   - **Start Command**: `pnpm start:http`
   - **Plan**: `Starter` (or higher based on needs)

3. **Environment Variables**
   Set these in Render's environment variables section:
   ```
   NODE_ENV=production
   FIGMA_API_KEY=your_figma_personal_access_token
   # OR
   FIGMA_OAUTH_TOKEN=your_figma_oauth_token
   ```

4. **Health Check**
   - **Health Check Path**: `/health`

### Option 2: Docker Deployment

1. **Use the provided Dockerfile**
   - Render will automatically detect the Dockerfile
   - Set the same environment variables as above

## Environment Variables

| Variable | Required | Description |
|----------|----------|-------------|
| `FIGMA_API_KEY` | Yes* | Your Figma Personal Access Token |
| `FIGMA_OAUTH_TOKEN` | Yes* | Your Figma OAuth Token (alternative to API key) |
| `NODE_ENV` | No | Set to `production` for deployment |
| `PORT` | No | Automatically set by Render |

*Either `FIGMA_API_KEY` or `FIGMA_OAUTH_TOKEN` is required.

## Getting Figma Tokens

### Personal Access Token (Recommended for personal use)
1. Go to [Figma Account Settings](https://www.figma.com/settings)
2. Scroll to "Personal access tokens"
3. Click "Create new token"
4. Give it a name and click "Create"
5. Copy the token and use it as `FIGMA_API_KEY`

### OAuth Token (For applications)
Follow the [Figma OAuth documentation](https://www.figma.com/developers/api#oauth2) to set up OAuth flow.

## Available Endpoints

After deployment, your service will have these endpoints:

- `GET /health` - Health check endpoint
- `GET /api/status` - Service status
- `GET /api/config` - Configuration info
- `POST /mcp` - MCP StreamableHTTP endpoint
- `GET /sse` - Server-Sent Events endpoint
- `POST /messages` - SSE message endpoint

## CORS Configuration

The server is configured with CORS support for:
- Local development (`localhost:3000`, `localhost:3001`, `localhost:8080`)
- Cursor IDE (`https://cursor.sh`, `https://www.cursor.sh`)

To add more origins, modify the `corsMiddleware` in `src/server.ts`.

## Monitoring

- Use `/health` endpoint for uptime monitoring
- Use `/api/status` for detailed service information
- Check Render logs for debugging

## Scaling

For high-traffic scenarios:
1. Upgrade to a higher Render plan
2. Consider using Render's autoscaling features
3. Monitor memory and CPU usage in Render dashboard

## Troubleshooting

### Common Issues

1. **"FIGMA_API_KEY is required" error**
   - Ensure you've set either `FIGMA_API_KEY` or `FIGMA_OAUTH_TOKEN` in environment variables

2. **Build failures**
   - Check that `pnpm` is available (it should be in Node 18+)
   - Verify all dependencies are in `package.json`

3. **CORS errors**
   - Add your domain to the `allowedOrigins` array in `src/server.ts`

4. **Health check failures**
   - Ensure the service is listening on the correct port
   - Check that `/health` endpoint is accessible

### Logs

Access logs through:
- Render dashboard → Your service → Logs tab
- Use `console.log` statements for debugging (they'll appear in Render logs)

## Security Considerations

1. **Never commit tokens to version control**
2. **Use environment variables for all secrets**
3. **Regularly rotate your Figma tokens**
4. **Monitor access logs for unusual activity**
5. **Keep dependencies updated**

## Performance Optimization

1. **Enable compression** (already configured)
2. **Use appropriate Render plan** for your traffic
3. **Monitor response times** via Render metrics
4. **Consider caching** for frequently accessed Figma data

## Support

For deployment issues:
- Check Render documentation
- Review application logs
- Ensure all environment variables are set correctly 