"use client";
import React, { useState, useEffect } from "react";
import {
  GlobalStyles,
  Avatar,
  Box,
  Divider,
  IconButton,
  List,
  Typography,
  Sheet,
  Drawer,
} from "@mui/joy";
import { useSocketStore } from "@/context/socketStore";
import { listItemButtonClasses } from "@mui/joy/ListItemButton";
import {
  LogoutRounded,
  Menu as MenuIcon,
  ChevronLeft as ChevronLeftIcon,
  CloseRounded,
} from "@mui/icons-material";
import { NavList } from "@/components/Navigation";
import Image from "next/image";
import { disconnectWebSocket } from "@/lib/websocketClient";

export default function PrivateSidebar() {
  const user = useSocketStore((state) => state.user);
  const [collapsed, setCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  // Detect mobile layout
  useEffect(() => {
    if (typeof window === "undefined") return;
    const mq = window.matchMedia("(max-width: 900px)");
    const update = () => setIsMobile(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);

  // 🔹 MOBILE VIEW (Top Navbar + Drawer)
  if (isMobile) {
    return (
      <>
        {/* Top Navbar */}
        <Sheet
          sx={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            height: 64,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            bgcolor: "background.surface",
            px: 2,
            borderBottom: "1px solid",
            borderColor: "divider",
            zIndex: 1200,
            boxShadow: "0 2px 10px rgba(0,0,0,0.1)",
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <Image src="/crs-logo.png" alt="Fil-PAT Logo" width={28} height={28} />
            <Typography level="title-lg">Fil-PAT</Typography>
          </Box>

          <IconButton variant="plain" onClick={() => setDrawerOpen(true)}>
            <MenuIcon />
          </IconButton>
        </Sheet>

        {/* Drawer (off-canvas sidebar) */}
        <Drawer
          open={drawerOpen}
          onClose={() => setDrawerOpen(false)}
          size="sm"
          sx={{
            "& .MuiDrawer-content": {
              bgcolor: "background.surface",
              p: 2,
              display: "flex",
              flexDirection: "column",
              height: "100%",
              width: "75vw",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
        >
          <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
            <Typography level="title-lg">Menu</Typography>
            <IconButton variant="plain" onClick={() => setDrawerOpen(false)}>
              <CloseRounded />
            </IconButton>
          </Box>
          <List sx={{ flexGrow: 1 }}>
            <NavList iconsOnly={false} />
          </List>
          <Divider />
          <Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
            <Avatar
              variant="outlined"
              size="sm"
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=286"
            />
            <Box sx={{ flex: 1, ml: 1 }}>
              <Typography level="title-sm">{user?.username || "Unknown"}</Typography>
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
        </Drawer>
      </>
    );
  }

  // 🔹 DESKTOP VIEW (Collapsible Sidebar)
  return (
    <Sheet
      sx={{
        position: "sticky",
        top: 0,
        left: 0,
        height: "100vh",
        width: collapsed ? 64 : 240,
        bgcolor: "background.surface",
        borderRight: "1px solid",
        borderColor: "divider",
        transition: "width 0.3s ease",
        display: "flex",
        flexDirection: "column",
        zIndex: 1100,
      }}
    >
      <GlobalStyles
        styles={{
          ":root": {
            "--Sidebar-width": "240px",
          },
        }}
      />

      {/* Header */}
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: collapsed ? "center" : "space-between",
          p: 2,
          borderBottom: "1px solid",
          borderColor: "divider",
        }}
      >
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Image src="/crs-logo.png" alt="Fil-PAT Logo" width={28} height={28} />
          {!collapsed && <Typography level="title-lg">Fil-PAT</Typography>}
        </Box>
        <IconButton variant="plain" size="sm" onClick={() => setCollapsed((c) => !c)}>
          {collapsed ? <MenuIcon /> : <ChevronLeftIcon />}
        </IconButton>
      </Box>

      {/* Navigation */}
      <Box
        sx={{
          flexGrow: 1,
          overflowY: "auto",
          p: collapsed ? 1 : 2,
          [`& .${listItemButtonClasses.root}`]: {
            gap: 1.5,
            justifyContent: collapsed ? "center" : "flex-start",
          },
        }}
      >
        <List>
          <NavList iconsOnly={collapsed} />
        </List>
      </Box>

      {/* User Info */}
      {!collapsed && (
        <>
          <Divider />
          <Box sx={{ display: "flex", alignItems: "center", gap: 1, p: 2 }}>
            <Avatar
              variant="outlined"
              size="sm"
              src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=286"
            />
            <Box sx={{ flexGrow: 1 }}>
              <Typography level="title-sm">{user?.username || "Unknown"}</Typography>
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
