import React from "react";
import { Navigate } from "react-router-dom";

// The spec's customer dashboard cards (Available Rice / My Orders / etc.)
// map naturally onto the Browse Rice page, so we route dashboard -> rice list.
export default function CustomerDashboard() {
  return <Navigate to="/customer/rice" replace />;
}
