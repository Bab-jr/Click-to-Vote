import { APP_CONFIG } from "@/config/appConfig";

export function getFileUrl(path) {
  if (!path) return null;

  const base =
    APP_CONFIG.api.baseUrl.replace("/api.php", "");

  // Old Cloudflare URLs
  if (path.includes("trycloudflare.com")) {
    const filename = path.split("inhs-election/uploads/")[1];

    if (!filename) return path;

    return `${base}/uploads/${filename}`;
  }

  // Already a complete URL
  if (path.startsWith("http")) {
    return path;
  }

  // Relative upload path
  return `${base}/${path}`;
}