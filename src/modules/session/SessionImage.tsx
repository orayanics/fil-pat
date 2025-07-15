import { useSocketContext } from "@/context/SocketProvider";
import Image from "next/image";

export default function SessionImage() {
  const { isConnected, currentItem } = useSocketContext();

  return (
    <div>
      <p>Is {isConnected ? "connected" : "disconnected"}</p>
      {currentItem && (
        <Image
          src={currentItem.image}
          alt="Session Image"
          width={500}
          height={500}
        />
      )}
    </div>
  );
}
