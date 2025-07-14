import Link from "next/link";
import {
  ListItem,
  ListItemButton,
  ListItemContent,
  Typography,
} from "@mui/joy";

import { PrivateList } from "@/utils/navlist";
import { usePathname } from "next/navigation";

export default function NavList() {
  const currentPath = usePathname().split("/").pop() || "Home";
  const isActive = (href: string) => currentPath === href.split("/").pop();
  return (
    <>
      {PrivateList.map((item) => (
        <Link key={item.title} href={item.href}>
          <ListItem>
            <ListItemButton selected={isActive(item.href)}>
              {item.icon}
              <ListItemContent>
                <Typography level="title-sm">{item.title}</Typography>
              </ListItemContent>
            </ListItemButton>
          </ListItem>
        </Link>
      ))}
    </>
  );
}
