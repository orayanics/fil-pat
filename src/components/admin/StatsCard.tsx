"use client";

import { Card, CardContent, Typography, Box, Chip } from "@mui/joy";
import { ReactNode } from "react";
import { TrendingUp, TrendingDown } from "@mui/icons-material";

interface StatsCardProps {
  title: string;
  value: string | number;
  icon: ReactNode;
  color?: "primary" | "success" | "warning" | "danger" | "neutral";
  trend?: {
    value: number;
    isPositive: boolean;
  };
  subtitle?: string;
}

export default function StatsCard({ 
  title, 
  value, 
  icon, 
  color = "primary",
  trend,
  subtitle 
}: StatsCardProps) {
  return (
    <Card
      variant="outlined"
      sx={{
        height: "100%",
        transition: "all 0.2s",
        "&:hover": {
          boxShadow: "md",
          transform: "translateY(-2px)",
        },
      }}
    >
      <CardContent>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 2 }}>
          <Box>
            <Typography level="body-sm" sx={{ color: "text.secondary", mb: 0.5 }}>
              {title}
            </Typography>
            <Typography level="h2" fontWeight="bold" color={color}>
              {value}
            </Typography>
            {subtitle && (
              <Typography level="body-xs" sx={{ color: "text.tertiary", mt: 0.5 }}>
                {subtitle}
              </Typography>
            )}
          </Box>
          <Box
            sx={{
              p: 1.5,
              borderRadius: "lg",
              bgcolor: `${color}.softBg`,
              color: `${color}.500`,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        </Box>
        
        {trend && (
          <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
            <Chip
              size="sm"
              variant="soft"
              color={trend.isPositive ? "success" : "danger"}
              startDecorator={trend.isPositive ? <TrendingUp /> : <TrendingDown />}
            >
              {trend.isPositive ? "+" : ""}{trend.value}%
            </Chip>
            <Typography level="body-xs" sx={{ color: "text.tertiary" }}>
              vs last month
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
