
"use client";
import { useSocketStore } from "@/context/socketStore";
import Image from "next/image";

export default function SessionImage() {
  const currentItem = useSocketStore((state) => state.currentItem);

  console.log('SessionImage - currentItem:', currentItem);
  console.log('SessionImage - image_url:', currentItem?.image_url);

  const url = currentItem?.image_url;

  // Handle base64 data URIs and regular URLs
  const imageSource = url && url.trim() !== ''
    ? (url.startsWith('data:') ? url : url.startsWith('http') ? url : `data:image/png;base64,${url}`)
    : "https://placehold.co/600x400/png?text=Filipino+PAT";

  console.log('SessionImage - final url:', imageSource);
  
  // Use img tag for base64 data URIs, Next Image for URLs
  const isDataUri = imageSource.startsWith('data:');
  
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100dvh",
      }}
    >
      {isDataUri ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imageSource}
          alt="Session Image"
          style={{ 
            objectFit: "contain", 
            margin: "auto",
            maxWidth: "600px",
            maxHeight: "400px",
            width: "auto",
            height: "auto"
          }}
        />
      ) : (
        <Image
          src={imageSource}
          alt="Session Image"
          width={600}
          height={400}
          loading="lazy"
          style={{ objectFit: "contain", margin: "auto" }}
        />
      )}
    </div>
  );
}
