import Link from "next/link";
import { Box, Breadcrumbs, Link as LinkUI } from "@mui/joy";
import { ChevronRightRounded } from "@mui/icons-material";

export default function PrivateBreadcrumbs() {
  return (
    <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
      <Breadcrumbs
        size="sm"
        aria-label="breadcrumbs"
        separator={<ChevronRightRounded />}
        sx={{ pl: 0 }}
      >
        <LinkUI
          component={Link}
          href="/dashboard"
          color="neutral"
          sx={{ textDecoration: "none" }}
        >
          Home
        </LinkUI>
      </Breadcrumbs>
    </Box>
  );
}
