import React from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  function handleLogout() {
    const confirmed = window.confirm("Are you sure you want to logout?");
    if (!confirmed) return;

    logout();
    navigate("/login");
  }

  return (
    <nav className="navbar">
      <Link to="/" className="navbar-brand">🌾 Aharam Tho Arogyam</Link>
      <div className="navbar-links">
        {!user && (
          <>
            <Link to="/customer/dashboard">Browse Rice</Link>
            <NavLink
              to="/customer/login"
              className={({ isActive }) =>
                isActive ? "btn-nav-primary" : "btn-nav-secondary"
              }
            >
              Customer Login
            </NavLink>
            <NavLink
              to="/farmer/login"
              className={({ isActive }) =>
                isActive ? "btn-nav-primary" : "btn-nav-secondary"
              }
            >
              Farmer Login
            </NavLink>
            <NavLink
              to="/register"
              className={({ isActive }) =>
                isActive ? "btn-nav-primary" : "btn-nav-secondary"
              }
            >
              Register
            </NavLink>
          </>
        )}
        {user && user.role === "farmer" && (
          <>
            <Link to="/farmer/dashboard">Dashboard</Link>
            <Link to="/farmer/rice">My Rice</Link>
            <Link to="/farmer/orders">Orders</Link>
            <button className="btn-link" onClick={handleLogout}>Logout</button>
          </>
        )}
        {user && user.role === "customer" && (
          <>
            <Link to="/customer/rice">Browse Rice</Link>
            <Link to="/customer/orders">My Orders</Link>
            <button className="btn-link" onClick={handleLogout}>Logout</button>
          </>
        )}
      </div>
    </nav>
  );
}
