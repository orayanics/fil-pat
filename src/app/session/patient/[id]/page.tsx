"use client";
import { useParams } from "next/navigation";

export default function Session() {
  const id = useParams().id;
  return (
    <div>
      <h1>Session Page</h1>
      <p>Welcome to the patient session.</p>
      <p>Session ID: {id}</p>
    </div>
  );
}
