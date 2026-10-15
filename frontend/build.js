// Placeholder build: copies src/ into build/ so Render has something to publish.
// Delete this file once the real frontend (with its own build step) is added.
const fs = require("fs");
const path = require("path");

const src = path.join(__dirname, "src");
const out = path.join(__dirname, "build");

fs.rmSync(out, { recursive: true, force: true });
fs.cpSync(src, out, { recursive: true });
console.log("Placeholder frontend copied to build/");
