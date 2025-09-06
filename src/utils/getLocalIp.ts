export default function getLocalIp(): string | null {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }
  return null;
}
