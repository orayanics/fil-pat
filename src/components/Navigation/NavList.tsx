"use client";
import Link from "next/link";
import {
  ListItem,
  ListItemButton,
  ListItemContent,
  Typography,
} from "@mui/joy";
import DescriptionOutlinedIcon from "@mui/icons-material/DescriptionOutlined";
import ListAltOutlinedIcon from "@mui/icons-material/ListAltOutlined";
import { usePrivateList } from "@/utils/navlist";
import { usePathname } from "next/navigation";
import { useSocketStore } from "@/context/socketStore";

export default function NavList({ iconsOnly = false }: { iconsOnly?: boolean }) {
  const user = useSocketStore((state) => state.user);
  const isAdmin = user?.is_admin;
  const pathname = usePathname() || "";
  const currentPath = pathname.split("/").pop() || "Home";
  const isActive = (href: string) => currentPath === href.split("/").pop();
  const navItems = usePrivateList();

  return (
    <>
      {navItems.map((item: { title: string; href: string; icon: React.ReactElement }) => (
        <ListItem key={item.title}>
          <ListItemButton
            component={Link}
            href={item.href}
            selected={isActive(item.href)}
          >
            {item.icon}
            {!iconsOnly && (
              <ListItemContent>
                <Typography level="title-sm">{item.title}</Typography>
              </ListItemContent>
            )}
          </ListItemButton>
        </ListItem>
      ))}
      {/* Admin-only links */}
      {isAdmin && (
        <>
          <ListItem>
            <ListItemButton
              component={Link}
              href="/admin-dashboard/reports"
              selected={isActive("reports")}
            >
              <DescriptionOutlinedIcon sx={{ mr: 1 }} />
              {!iconsOnly && (
                <ListItemContent>
                  <Typography level="title-sm">Reports</Typography>
                </ListItemContent>
              )}
            </ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton
              component={Link}
              href="/admin-dashboard/activity-logs"
              selected={isActive("activity-logs")}
            >
              <ListAltOutlinedIcon sx={{ mr: 1 }} />
              {!iconsOnly && (
                <ListItemContent>
                  <Typography level="title-sm">Activity Logs</Typography>
                </ListItemContent>
              )}
            </ListItemButton>
          </ListItem>
        </>
      )}
    </>
  );
}
