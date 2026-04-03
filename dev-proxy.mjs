import http from "http";
import httpProxy from "http-proxy";

const proxy = httpProxy.createProxyServer({});

const HUB = "http://127.0.0.1:3002";
const CARE = "http://127.0.0.1:3001";

const server = http.createServer((req, res) => {
  const host = (req.headers.host || "").toLowerCase();

  if (host.startsWith("care.localhost")) {
    proxy.web(req, res, { target: CARE });
    return;
  }

  proxy.web(req, res, { target: HUB });
});

server.on("upgrade", (req, socket, head) => {
  const host = (req.headers.host || "").toLowerCase();

  if (host.startsWith("care.localhost")) {
    proxy.ws(req, socket, head, { target: CARE });
    return;
  }

  proxy.ws(req, socket, head, { target: HUB });
});

server.listen(3000, () => {
  console.log("Proxy running");
  console.log("Hub  -> http://localhost:3000");
  console.log("Care -> http://care.localhost:3000");
});