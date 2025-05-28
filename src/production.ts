export const productionConfig = {
  cors: {
    allowedOrigins: [
      "http://localhost:3000",
      "http://localhost:3001", 
      "http://localhost:8080",
      "https://cursor.sh",
      "https://www.cursor.sh"
    ]
  },
  server: {
    defaultPort: 10000,
    enableCompression: true,
    enableHealthCheck: true
  },
  logging: {
    level: process.env.NODE_ENV === "production" ? "info" : "debug"
  }
}; 