// custom server
// to run: update package.json scripts to include:
// "dev": "node server/server.js"
// "build": "next build"
// "start": "NODE_ENV=production node server/server.js"

import { createServer } from "http";
import { parse } from "url";
import next from "next";

import "./websocket";

const dev = process.env.NODE_ENV !== "production";
const hostname = process.env.APP_HOSTNAME || "localhost";
const port = process.env.APP_PORT ? parseInt(process.env.APP_PORT, 10) : 3000;

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url!, true);
    handle(req, res, parsedUrl);
  }).listen(port);

  console.log(
    `> Server listening at http://localhost:${port} as ${
      dev ? "development" : "production"
    }`
  );
});
