"use client";
import {AlertFail} from "@/components/Alert";
import {useSocketContext} from "@/context/SocketProvider";
import {SessionLayout} from "@/components/Layout";

export default function Layout({children}: {children: React.ReactNode}) {
  const {isConnected} = useSocketContext();
  return (
    <>
      {!isConnected && <AlertFail isConnected={isConnected} />}
      <SessionLayout>{children}</SessionLayout>
    </>
  );
}
