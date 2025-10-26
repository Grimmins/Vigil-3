#!/usr/bin/env node
import os from "os";
import fs from "fs";
import path from "path";
import https from "https";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BASE_URL = "https://github.com/Grimmins/Vigil3/releases/download/main";
const BINARIES = {
  linux: "slither-linux",
  darwin: "slither-macos",
  win32: "slither-win.exe",
};

function downloadWithRedirect(url, dest, cb) {
  https
    .get(url, (res) => {
      if (res.statusCode === 302 || res.statusCode === 301) {
        // Follow redirect
        const redirectUrl = res.headers.location;
        downloadWithRedirect(redirectUrl, dest, cb);
        return;
      }
      if (res.statusCode !== 200) {
        cb(new Error(`Download failed: ${res.statusCode}`));
        return;
      }
      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on("finish", () => file.close(() => cb(null)));
    })
    .on("error", (err) => cb(err));
}

(async function main() {
  try {
    const platform = os.platform();
    const binary = BINARIES[platform];
    if (!binary) {
      console.error(`[vigil3] Unsupported platform: ${platform}`);
      return;
    }

    const cacheDir = path.join(os.homedir(), ".vigil3");
    const dest = path.join(cacheDir, binary);
    if (fs.existsSync(dest)) {
      console.log("[vigil3] Binary already installed.");
      return;
    }

    if (!fs.existsSync(cacheDir)) fs.mkdirSync(cacheDir, { recursive: true });

    const url = `${BASE_URL}/${binary}`;
    console.log(`[vigil3] Downloading Slither binary...`);

    downloadWithRedirect(url, dest, (err) => {
      if (err) {
        console.error("[vigil3] Download failed:", err.message);
        return;
      }
      fs.chmodSync(dest, 0o755);
      console.log(`[vigil3] Installed at ${dest}`);
    });
  } catch (err) {
    console.error("[vigil3] Postinstall failed:", err);
  }
})();
