import React from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function Home() {
  const { user } = useAuth();
  return (
    <div className="hero">
      <h1>Fresh Rice, Straight From the Farmer</h1>
      <p>Buy quality rice directly from local farmers - no middlemen, fair prices.</p>
      <div className="hero-actions">
        {!user && (
          <>
            <Link to="/register" className="btn btn-primary">Get Started</Link>
            <Link to="/customer/rice" className="btn btn-secondary">Browse Rice</Link>
          </>
        )}
        {user && user.role === "customer" && (
          <Link to="/customer/rice" className="btn btn-primary">Browse Rice</Link>
        )}
        {user && user.role === "farmer" && (
          <Link to="/farmer/dashboard" className="btn btn-primary">Go to Dashboard</Link>
        )}
      </div>
    </div>
  );
}
