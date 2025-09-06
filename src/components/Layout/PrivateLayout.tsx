import Box from "@mui/joy/Box";
import {Breadcrumbs, PrivateHeader, PrivateSidebar} from "@/components/Layout";

export default function PrivateLayout({children}: {children: React.ReactNode}) {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: {xs: "column", md: "row"},
        width: "100vw",
        minHeight: "100dvh",
        justifyContent: "start",
      }}
    >
      <PrivateHeader />
      <PrivateSidebar />

      <Box
        component="main"
        className="MainContent"
        sx={{
          px: {xs: 2, md: 6},
          pb: {xs: 2, sm: 2, md: 3},
          flex: 1,
          display: "flex",
          flexDirection: "column",
          height: "100dvh",
          gap: 1,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            gap: 2,
          }}
        >
          <Breadcrumbs />
        </Box>

        {children}
      </Box>
    </Box>
  );
}
