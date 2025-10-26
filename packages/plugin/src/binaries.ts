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

function downloadBinary(url: string, dest: string, redirectCount = 0): Promise<void> {
  const MAX_REDIRECTS = 5;

  return new Promise<void>((resolve, reject) => {
    const file = fs.createWriteStream(dest);

    https
      .get(url, (res) => {
        const { statusCode, headers } = res;

        // Gérer les redirections
        if (
          statusCode &&
          [301, 302, 303, 307, 308].includes(statusCode) &&
          headers.location
        ) {
          if (redirectCount >= MAX_REDIRECTS) {
            file.close();
            fs.unlink(dest, () => reject(new Error("Too many redirects")));
            return;
          }

          file.close();
          fs.unlink(dest, () => {
            const nextUrl = headers.location!.startsWith("http")
              ? headers.location!
              : new URL(headers.location!, url).href;
            console.log(`[vigil3] Redirecting to ${nextUrl}`);
            downloadBinary(nextUrl, dest, redirectCount + 1)
              .then(resolve)
              .catch(reject);
          });
          return;
        }

        if (statusCode !== 200) {
          file.close();
          fs.unlink(dest, () =>
            reject(new Error(`Download failed: ${statusCode}`))
          );
          return;
        }

        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve();
        });
      })
      .on("error", (err) => {
        file.close();
        fs.unlink(dest, () => reject(err));
      });
  });
}
