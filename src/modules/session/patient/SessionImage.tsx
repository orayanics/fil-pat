import { useSocketContext } from "@/context/SocketProvider";
import Image from "next/image";

export default function SessionImage() {
  const { currentItem } = useSocketContext();
  const url = currentItem?.item.image;

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "90dvh",
        margin: "auto auto",
      }}
    >
      {currentItem && (
        <Image
          src={url || "https://placehold.co/600x400/png?text=Filipino+PAT"}
          alt="Session Image"
          width={600}
          height={400}
          loading="lazy"
          objectFit="contain"
        />
      )}
    </div>
  );
}
