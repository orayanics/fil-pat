import { useSocketContext } from "@/context/SocketProvider";
import Image from "next/image";

export default function SessionImage() {
  const { currentItem } = useSocketContext();
  const url = currentItem?.image;

  return (
    <div style={{ padding: "16px" }}>
      {currentItem && (
        <Image
          src={url || "https://placehold.co/600x400?text=Filipino+PAT"}
          alt="Session Image"
          fill
          loading="lazy"
          style={{ objectFit: "contain" }}
        />
      )}
    </div>
  );
}
