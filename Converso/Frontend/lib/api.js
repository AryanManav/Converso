export function getApiBaseUrl() {
  if (typeof window !== "undefined" && window.location.hostname) {
    const protocol = window.location.protocol === "https:" ? "https:" : "http:";
    return `${protocol}//${window.location.hostname}:3001`;
  }
  if (process.env.NEXT_PUBLIC_BACKEND_URL) {
    return process.env.NEXT_PUBLIC_BACKEND_URL;
  }
  return "http://localhost:3001";
}

export const API_BASE_URL = getApiBaseUrl();

export function apiUrl(path) {
  return `${getApiBaseUrl()}${path}`;
}
