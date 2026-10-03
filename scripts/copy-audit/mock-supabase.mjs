#!/usr/bin/env node
/**
 * COPY-RESET — empty Supabase stand-in for copy measurement.
 *
 * Some apps throw when the database is unreachable, so their public pages render
 * an error boundary instead of their copy. This answers every request the way an
 * EMPTY, reachable project would: REST reads return no rows, single-row reads
 * return "0 rows", writes succeed with nothing, auth has no session. Pages then
 * render their own copy and empty states. Measurement only — never production.
 *
 *   node scripts/copy-audit/mock-supabase.mjs [--port 54329]
 */
import { createServer } from "node:http";

const i = process.argv.indexOf("--port");
const port = Number(i !== -1 ? process.argv[i + 1] : 54329);

const json = (res, status, body, headers = {}) => {
  res.writeHead(status, { "content-type": "application/json", ...headers });
  res.end(body === undefined ? "" : JSON.stringify(body));
};

createServer((req, res) => {
  const url = new URL(req.url, "http://localhost");
  const p = url.pathname;
  const accept = String(req.headers.accept || "");
  req.resume();

  if (p.startsWith("/rest/v1/rpc/")) return json(res, 200, null);
  if (p.startsWith("/rest/v1/")) {
    if (req.method === "GET" || req.method === "HEAD") {
      if (accept.includes("application/vnd.pgrst.object+json")) {
        return json(res, 406, {
          code: "PGRST116",
          details: "The result contains 0 rows",
          hint: null,
          message: "JSON object requested, multiple (or no) rows returned",
        });
      }
      return json(res, 200, [], { "content-range": "*/0" });
    }
    return json(res, req.method === "POST" ? 201 : 204, req.method === "POST" ? [] : undefined, { "content-range": "*/0" });
  }
  if (p.startsWith("/auth/v1/user")) return json(res, 401, { code: 401, msg: "No session", error_code: "no_session" });
  if (p.startsWith("/auth/v1/")) return json(res, 200, {});
  if (p.startsWith("/storage/v1/object/list")) return json(res, 200, []);
  if (p.startsWith("/storage/v1/")) return json(res, 404, { statusCode: "404", error: "not_found", message: "Object not found" });
  return json(res, 404, { message: "not found" });
}).listen(port, "127.0.0.1", () => console.log(`[mock-supabase] listening on http://127.0.0.1:${port}`));
