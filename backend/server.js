// Placeholder server so the staging web service starts and answers health checks.
// Replace with the real API. Keep a /healthz route that returns 200.
const http = require("http");

const port = process.env.PORT || 3000;

const server = http.createServer((req, res) => {
  if (req.url === "/healthz") {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("ok");
    return;
  }
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify({ service: "growline-backend", status: "placeholder" }));
});

server.listen(port, "0.0.0.0", () => {
  console.log(`GrowLine backend placeholder listening on port ${port}`);
});
