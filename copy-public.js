// scripts/copy-public.js
import fs from "fs";
import path from "path";

const src = path.resolve("public");
const dest = path.resolve("dist/public");

try {
  fs.cpSync(src, dest, { recursive: true });
  console.log("✅ Copied public/ into dist/public");
} catch (err) {
  console.error("❌ Error copying public/ to dist/public:", err);
  process.exit(1);
}
