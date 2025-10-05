import Image from "next/image";
import {Box, IconButton} from "@mui/joy";

import {AlertWarning, useAlert} from "@/components/Alert";
import {PageStatus} from "@/components/Page";

export default function PageHeader() {
  const {open, toggle, setOpen} = useAlert();
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
        width: "100%",
      }}
    >
      <AlertWarning
        description="You are about to be redirected to a different page. Any unsaved or unsubmitted changes will be lost. Do you want to continue?"
        open={open}
        onClose={() => setOpen(false)}
      />
      <IconButton
        variant="plain"
        color="neutral"
        size="sm"
        component={"button"}
        onClick={toggle}
      >
        <Image src="/crs-logo.png" alt="Fil-PAT Logo" width={25} height={25} />
      </IconButton>
      <PageStatus />
    </Box>
  );
}
