"use client";
import {useState} from "react";

export function useAlert() {
  const [open, setOpen] = useState(false);

  const toggle = () => setOpen((prev) => !prev);

  return {open, toggle, setOpen};
}
