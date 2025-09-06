"use client";
import SocketProvider from "@/context/SocketProvider";
import SessionPdf from "./SessionPdf";

export default function Index() {
  return (
    <SocketProvider>
      <SessionPdf />
    </SocketProvider>
  );
}
