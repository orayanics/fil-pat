"use client";
import { AlertFail } from "@/components/Alert";
import { useSocketContext } from "@/context/SocketProvider";

export default function SessionLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected } = useSocketContext();
  return (
    <>
      {!isConnected && <AlertFail isConnected={isConnected} />}
      {children}
    </>
  );
}
