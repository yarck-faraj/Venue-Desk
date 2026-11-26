import { createHash } from "node:crypto";
import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const template = new URL("../src/sw/sw.js", import.meta.url);

export function precacheWorker() {
  return {
    name: "venuedesk-precache",
    apply: "build",
    async writeBundle(output) {
      const dir = output.dir;
      const entries = await readdir(dir, { recursive: true, withFileTypes: true });
      const files = entries
        .filter((entry) => entry.isFile())
        .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
        .filter((name) => name !== "sw.js")
        .sort();
      const source = await readFile(template, "utf8");
      const digest = createHash("sha256").update(source);
      for (const file of files) {
        digest.update(JSON.stringify(file));
        digest.update(
          createHash("sha256")
            .update(await readFile(path.join(dir, file)))
            .digest(),
        );
      }
      const cache = "vd-" + digest.digest("hex").slice(0, 20);
      const shell = await readFile(path.join(dir, "index.html"), "utf8");
      const sdk = [
        ...shell.matchAll(/<script[^>]+src=["'](https:\/\/www[.]gstatic[.]com\/firebasejs\/[^"']+)["']/gi),
      ].map((match) => match[1]);
      const urls = ["./", ...files.map((file) => "./" + file), ...sdk];
      const worker = source
        .replace('"__CACHE_NAME__"', JSON.stringify(cache))
        .replace('"__PRECACHE_FILES__"', JSON.stringify(urls));
      await writeFile(path.join(dir, "sw.js"), worker);
    },
  };
}
