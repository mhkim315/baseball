import { Paths, File, Directory } from "expo-file-system";
import { readAsStringAsync } from "expo-file-system/legacy";
import { manipulateAsync, SaveFormat } from "expo-image-manipulator";

function getPhotoDir(): Directory {
  return new Directory(Paths.document, "jikgwan");
}

export async function ensurePhotoDir(): Promise<Directory> {
  const dir = getPhotoDir();
  if (!dir.exists) {
    dir.create();
  }
  return dir;
}

export function generatePhotoName(): string {
  const now = new Date();
  const ts = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}_${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}${String(now.getMilliseconds()).padStart(3, "0")}`;
  const rand = Math.random().toString(36).slice(2, 6);
  return `jikgwan_${ts}_${rand}.jpg`;
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binaryStr = atob(base64);
  const bytes = new Uint8Array(binaryStr.length);
  for (let i = 0; i < binaryStr.length; i++) {
    bytes[i] = binaryStr.charCodeAt(i);
  }
  return bytes;
}

export async function savePhoto(sourceUri: string, fileName: string): Promise<string> {
  const dir = await ensurePhotoDir();
  const dest = new File(dir, fileName);

  // If source is a file:// URI, try move/copy (fast path)
  if (sourceUri.startsWith("file://")) {
    const src = new File(sourceUri);
    if (src.exists) {
      try {
        src.move(dest);
        return dest.uri;
      } catch {
        try {
          src.copy(dest);
          if (src.exists) src.delete();
          return dest.uri;
        } catch {}
      }
    }
  }

  // Fallback: read source via legacy API (handles content:// on Android),
  // decode base64, and write as bytes
  try {
    const base64 = await readAsStringAsync(sourceUri, { encoding: "base64" });
    dest.write(base64ToUint8Array(base64));
    return dest.uri;
  } catch (e) {
    throw new Error("사진 저장 실패");
  }
}

export async function resizePhoto(uri: string, maxWidth = 1200): Promise<string> {
  try {
    const result = await manipulateAsync(uri, [{ resize: { width: maxWidth } }], {
      format: SaveFormat.JPEG,
      compress: 0.85,
    });
    return result.uri;
  } catch {
    console.warn("resizePhoto failed, returning original");
    return uri;
  }
}

export async function getSavedPhotos(): Promise<string[]> {
  const dir = await ensurePhotoDir();
  const files = dir.list();
  return files
    .filter((f): f is File => f instanceof File && f.extension === ".jpg")
    .sort((a, b) => b.name.localeCompare(a.name))
    .map((f) => f.uri);
}

export async function deletePhoto(uri: string): Promise<void> {
  try {
    const file = new File(uri);
    if (file.exists) {
      file.delete();
    }
  } catch {
    // non-critical
  }
}
