"use client";
import Link from "next/link";
import {Box, Breadcrumbs, Link as LinkUI} from "@mui/joy";
import {ChevronRightRounded} from "@mui/icons-material";
import {usePathname} from "next/navigation";

export default function PrivateBreadcrumbs() {
  const pathname = usePathname();
  const displayPath = pathname.slice(1);

  return (
    <Box sx={{display: "flex", alignItems: "center", gap: 2}}>
      <Breadcrumbs
        size="sm"
        aria-label="breadcrumbs"
        separator={<ChevronRightRounded />}
        sx={{pl: 0}}
      >
        <LinkUI
          component={Link}
          href={pathname}
          color="neutral"
          sx={{textDecoration: "none"}}
        >
          {displayPath
            ? displayPath.charAt(0).toUpperCase() + displayPath.slice(1)
            : "Home"}
        </LinkUI>
      </Breadcrumbs>
    </Box>
  );
}
