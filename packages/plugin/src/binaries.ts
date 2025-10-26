import os from "os";
import fs from "fs";
import path from "path";
import https from "https";

const BASE_URL = "https://github.com/Grimmins/Vigil-3/releases/download/main";

const BINARIES: Record<string, string> = {
  linux: "slither-linux",
  darwin: "slither-macos",
  win32: "slither-win.exe",
};

export async function getSlitherBinaryPath(): Promise<string> {
  const platform = os.platform();
  const binaryName = BINARIES[platform];

  if (!binaryName) {
    throw new Error(`Unsupported OS platform: ${platform}`);
  }

  const cacheDir = path.join(os.homedir(), ".vigil3");
  const binaryPath = path.join(cacheDir, binaryName);

  if (!fs.existsSync(cacheDir)) {
    fs.mkdirSync(cacheDir, {recursive: true});
  }

  if (!fs.existsSync(binaryPath)) {
    console.log(`[vigil3] Downloading Slither binary for ${platform}...`);
    await downloadBinary(`${BASE_URL}/${binaryName}`, binaryPath);
    fs.chmodSync(binaryPath, 0o755);
  }

  return binaryPath;
}

function downloadBinary(url: string, dest: string) {
  const file = fs.createWriteStream(dest);

  return new Promise<void>((resolve, reject) => {
    https.get(url, (response) => {
      if (response.statusCode !== 200) {
        reject(new Error(`Download failed: ${response.statusCode}`));
        return;
      }

      response.pipe(file);
      file.on("finish", () => {
        file.close();
        resolve();
      });
    }).on("error", (err) => {
      fs.unlink(dest, () => reject(err));
    });
  });
}
