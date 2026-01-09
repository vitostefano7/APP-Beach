import API_URL from "../config/api";

export const resolveAvatarUrl = (avatarUrl?: string | null): string | null => {
  if (!avatarUrl) return null;
  if (/^https?:\/\//i.test(avatarUrl)) return avatarUrl;

  const baseUrl = API_URL.replace(/\/$/, "");
  const cleanPath = avatarUrl.startsWith("/") ? avatarUrl.slice(1) : avatarUrl;
  return `${baseUrl}/${cleanPath}`;
};
