import React from "react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="page-center">
      <h2>404 - Page Not Found</h2>
      <Link to="/">Go home</Link>
    </div>
  );
}
