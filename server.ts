// Production server for FIL-PAT
// Starts Next.js and WebSocket server
// Binds to 0.0.0.0 for LAN access

import { createServer } from "http";
import { parse } from "url";
import next from "next";

import "./websocket";

const dev = process.env.NODE_ENV !== "production";
// Bind to 0.0.0.0 to allow access from other devices on the same network
const hostname = process.env.APP_HOSTNAME || "0.0.0.0";
const port = process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 3000;

console.log(`Starting FIL-PAT server in ${dev ? 'development' : 'production'} mode...`);
console.log(`Server will listen on ${hostname}:${port}`);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port, hostname as any, () => {
    console.log(`
╔══════════════════════════════════════════════════════════╗
║                 FIL-PAT Server Running                   ║
╠══════════════════════════════════════════════════════════╣
║  Mode:        ${dev ? 'Development' : 'Production'}      ║
║  Listening:   http://${hostname}:${port}                 ║
║  WebSocket:   Port 8080                                  ║
╠══════════════════════════════════════════════════════════╣
║  ✓ Ready to accept connections from network devices      ║
║  ✓ Patient devices can connect via QR code               ║
╚══════════════════════════════════════════════════════════╝
    `);
  });
}).catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
