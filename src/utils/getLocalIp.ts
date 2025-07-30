const getLocalIp = (): string | null => {
  if (typeof window === "undefined") return null;

  const hostname = window.location.hostname;
  const port = window.location.port;

  return `http://${hostname}:${port}`;
};

export default getLocalIp;
