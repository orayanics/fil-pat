import React from "react";
import Table from "@/modules/users/Table";
import AuthGuard from "@/components/auth/authGuard";

export default function page() {
  return (
    <AuthGuard adminOnly={true}>
      <div>
        <Table />
      </div>
    </AuthGuard>
  );
}
