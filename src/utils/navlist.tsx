import { HomeRounded, GroupRounded } from "@mui/icons-material";
import { useSocketStore } from "@/context/socketStore";

export function usePrivateList() {
  const user = useSocketStore((state) => state.user);
  const isAdmin = user?.is_admin;

  return [
    {
      title: "Home",
      icon: <HomeRounded />,
      href: isAdmin ? "/admin-dashboard" : "/clinician-dashboard",
    },
    ...(isAdmin
      ? [
          {
            title: "Users",
            icon: <GroupRounded />,
            href: "/users",
          },
        ]
      : [
          {
            title: "Patients",
            icon: <GroupRounded />,
            href: "/clinician-dashboard/patients",
          },
        ]),
  ];
}
