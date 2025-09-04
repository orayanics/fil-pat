import SocketProvider from "@/context/SocketProvider";

export default function layout({children}: {children: React.ReactNode}) {
  return <SocketProvider>{children}</SocketProvider>;
}
