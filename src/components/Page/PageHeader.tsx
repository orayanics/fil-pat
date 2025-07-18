import Image from "next/image";
import Link from "next/link";
import { Box, IconButton } from "@mui/joy";

import { ModalTrigger } from "@/components/Modal";
import { PageStatus } from "@/components/Page";

import { redirect } from "next/navigation";

export default function PageHeader({ isLink = true }: { isLink: boolean }) {
  const { ModalComponent, setIsOpen, isOpen } = ModalTrigger({
    type: "modal_warning",
    action: "redirect",
    onConfirm: (confirmed) => {
      if (confirmed) {
        redirect("/dashboard");
      }
    },
  });

  return (
    <Box
      sx={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 1,
        paddingBottom: 1,
        padding: 1,
        borderBottom: "1px solid #ddd",
      }}
    >
      {isOpen && <ModalComponent />}
      <IconButton
        variant="plain"
        color="neutral"
        size="sm"
        component={isLink ? Link : "button"}
        {...(isLink ? { href: "/dashboard" } : {})}
        onClick={() => {
          if (!isLink) {
            setIsOpen((prev) => !prev);
          }
        }}
      >
        <Image src="/crs-logo.png" alt="Fil-PAT Logo" width={25} height={25} />
      </IconButton>
      <PageStatus />
    </Box>
  );
}
