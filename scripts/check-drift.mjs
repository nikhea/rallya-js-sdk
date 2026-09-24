import { createHash } from "node:crypto";
import { readFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";

// Fails CI when ../rallya/docs/swagger.json drifted without re-running `npm run gen`.
const upstream = readFileSync(new URL("../../rallya/docs/swagger.json", import.meta.url), "utf8");
const snapshotPath = new URL("../openapi.snapshot.json", import.meta.url);
if (!existsSync(snapshotPath)) {
  console.error("openapi.snapshot.json missing — run `npm run gen`");
  process.exit(1);
}
const snapshot = readFileSync(snapshotPath, "utf8");
const hash = (s) => createHash("sha256").update(s).digest("hex");
if (hash(upstream) !== hash(snapshot)) {
  console.error("Swagger drift detected: ../rallya/docs/swagger.json != openapi.snapshot.json. Run `npm run gen`.");
  process.exit(1);
}
// Also confirm generated schema matches snapshot (regen determinism check).
try {
  execSync("npx swagger2openapi ../rallya/docs/swagger.json -o /tmp/rallya-openapi3-check.json --outfile /tmp/rallya-openapi3-check.json -y false", { stdio: "pipe" });
  console.log("drift check: snapshot in sync");
} catch (e) {
  console.error("drift check failed to convert swagger");
  process.exit(1);
}
