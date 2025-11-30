"use client";

import dynamic from "next/dynamic";

const ExportPdf = dynamic(() => import("@/modules/pdf"), { ssr: false });

export default function PdfPage() {
  return <ExportPdf />;
}
