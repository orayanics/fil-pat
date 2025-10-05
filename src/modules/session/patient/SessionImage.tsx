"use client";
import {usePatient} from "@/context/PatientProvider";
import Image from "next/image";

export default function SessionImage() {
  const {currentItem} = usePatient();
  const url = currentItem?.item?.image;

  const isUrl = url
    ? url
    : "https://placehold.co/600x400/png?text=Filipino+PAT";

  console.log(isUrl);
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        height: "100dvh",
      }}
    >
      {isUrl && (
        <Image
          src={isUrl}
          alt="Session Image"
          width={600}
          height={400}
          loading="lazy"
          style={{objectFit: "contain", margin: "auto"}}
        />
      )}
    </div>
  );
}
