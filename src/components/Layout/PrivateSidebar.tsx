"use client";
import { GlobalStyles, Avatar, Box, Divider, IconButton, List, Typography, Sheet } from "@mui/joy";
import { useSocketStore } from "@/context/socketStore";
import { useState } from "react";
import { listItemButtonClasses } from "@mui/joy/ListItemButton";
import { LogoutRounded } from "@mui/icons-material";
import MenuIcon from "@mui/icons-material/Menu";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import { NavList } from "@/components/Navigation";
import Image from "next/image";
import { disconnectWebSocket } from "@/lib/websocketClient";



// Patch: wrap logic in function, restore state/user, pass iconsOnly to NavList
export default function PrivateSidebar() {
  const user = useSocketStore((state) => state.user);
  const [collapsed, setCollapsed] = useState(false);
  const isMobile = typeof window !== "undefined" && window.innerWidth < 600;

  if (isMobile) {
    // Mobile: bottom navbar with icons only
    return (
      <Sheet
        className="Sidebar"
        sx={{
          position: "fixed",
          left: 0,
          bottom: 0,
          width: "100vw",
          height: 64,
          bgcolor: "background.surface",
          boxShadow: "0 -2px 16px rgba(0,0,0,0.12)",
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-around",
          borderTop: "1px solid",
          borderColor: "divider",
          zIndex: 1200,
        }}
      >
        <NavList iconsOnly={true} />
      </Sheet>
    );
  }

  // Desktop: collapsible sidebar
  return (
    <Sheet
      className="Sidebar"
      sx={{
        position: { xs: "fixed", md: "sticky" },
        left: 0,
        top: 0,
        zIndex: 1200,
        height: "100dvh",
        width: collapsed ? 64 : { xs: "70vw", sm: "220px", lg: "240px" },
        minWidth: collapsed ? 64 : undefined,
        maxWidth: collapsed ? 64 : undefined,
        bgcolor: "background.surface",
        boxShadow: { xs: "0 2px 16px rgba(0,0,0,0.12)", md: "none" },
        transition: "width 0.3s",
        display: "flex",
        flexDirection: "column",
        gap: 2,
        borderRight: "1px solid",
        borderColor: "divider",
      }}
    >
      <GlobalStyles
        styles={(theme) => ({
          ":root": {
            "--Sidebar-width": "220px",
            [theme.breakpoints.up("lg")]: {
              "--Sidebar-width": "240px",
            },
          },
        })}
      />
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 1 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <IconButton variant="plain" size="sm">
            <Image src="/crs-logo.png" alt="Fil-PAT Logo" width={24} height={24} />
          </IconButton>
          {!collapsed && <Typography level="title-lg">Fil-PAT</Typography>}
        </Box>
        <IconButton variant="plain" size="sm" onClick={() => setCollapsed((c: boolean) => !c)} sx={{ ml: 1 }}>
          {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>
      {!collapsed && (
        <Box
          sx={{
            minHeight: 0,
            overflow: "hidden auto",
            flexGrow: 1,
            display: "flex",
            flexDirection: "column",
            [`& .${listItemButtonClasses.root}`]: {
              gap: 1.5,
            },
          }}
        >
          <List
            size="sm"
            sx={{
              gap: 1,
              "--List-nestedInsetStart": "30px",
              "--ListItem-radius": (theme) => theme.vars.radius.sm,
            }}
          >
            <NavList iconsOnly={false} />
          </List>
        </Box>
      )}
      {!collapsed && (
        <>
          <Divider />
          <Box sx={{ display: "flex", gap: 1, alignItems: "center" }}>
            <Avatar
              variant="outlined"
              size="sm"
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=286"
            />
            <Box sx={{ minWidth: 0, flex: 1 }}>
              <Typography level="title-sm">
                {user?.username || "Unknown"}
              </Typography>
              <Typography level="body-xs">UST-CRS Clinician</Typography>
            </Box>
            <IconButton
              size="sm"
              variant="plain"
              color="neutral"
              onClick={() => {
                disconnectWebSocket();
                localStorage.removeItem("clinicianLoggedIn");
                localStorage.removeItem("clinician");
                window.location.href = "/login";
              }}
            >
              <LogoutRounded />
            </IconButton>
          </Box>
        </>
      )}
    </Sheet>
  );
}