export default async function getLocalIp(): Promise<string> {
  // Try to detect a local network IP using WebRTC. If that fails, fall back to window.location.origin.
  if (typeof window === 'undefined') return '';

  // Fast path: if RTCPeerConnection unsupported, return origin
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const RTCPeerConnection: any = (window as any).RTCPeerConnection || (window as any).webkitRTCPeerConnection || (window as any).mozRTCPeerConnection;
  if (!RTCPeerConnection) return window.location.origin;

  try {
    const pc = new RTCPeerConnection({ iceServers: [] });
    const ips = new Set<string>();
    // create a bogus data channel
    try { pc.createDataChannel(''); } catch {}
    const offer = await pc.createOffer();
    await pc.setLocalDescription(offer);

    return await new Promise((resolve) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      pc.onicecandidate = (event: any) => {
        if (!event || !event.candidate) {
          pc.close();
          // pick the best private IPv4 if found
          const found = Array.from(ips).find(ip => ip.startsWith('192.168.') || ip.startsWith('10.') || (ip.startsWith('172.') && (() => { const second = parseInt(ip.split('.')[1] || '0', 10); return second >= 16 && second <= 31; })()) || ip === '127.0.0.1');
          const ipToUse = found ?? window.location.hostname;
          resolve(ipToUse);
        } else {
          const s = event.candidate.candidate as string;
          const regex = /([0-9]{1,3}(?:\.[0-9]{1,3}){3})/g;
          let m: RegExpExecArray | null;
          while ((m = regex.exec(s))) {
            ips.add(m[1]);
          }
        }
      };
      // timeout fallback
      setTimeout(() => {
        try { pc.close(); } catch {}
        // fallback to hostname only (not a full URL)
        resolve(window.location.hostname);
      }, 1500);
    });
  } catch {
    // fallback to hostname only
    return window.location.hostname;
  }
}
