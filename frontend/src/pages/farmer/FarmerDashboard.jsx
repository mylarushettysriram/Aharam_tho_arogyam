import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import orderService from "../../services/orderService";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function FarmerDashboard() {
  const [stats, setStats] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService
      .getFarmerStats()
      .then((res) => setStats(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load stats"))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <Loader />;

  return (
    <div className="page">
      <h1>Farmer Dashboard</h1>
      <ErrorMessage message={error} />
      {stats && (
        <div className="stats-grid">
          <div className="stat-card"><span className="stat-value">{stats.totalListings}</span><span>Total Rice Listings</span></div>
          <div className="stat-card"><span className="stat-value">{stats.availableBags}</span><span>Available Bags</span></div>
          <div className="stat-card"><span className="stat-value">{stats.pendingOrders}</span><span>Pending Orders</span></div>
          <div className="stat-card"><span className="stat-value">{stats.completedOrders}</span><span>Completed Orders</span></div>
          <div className="stat-card"><span className="stat-value">₹{stats.totalSales}</span><span>Total Sales</span></div>
        </div>
      )}
      <div className="dashboard-actions">
        <Link to="/farmer/rice/add" className="btn btn-primary">+ Add New Rice</Link>
        <Link to="/farmer/rice" className="btn btn-secondary">Manage My Rice</Link>
        <Link to="/farmer/orders" className="btn btn-secondary">View Orders</Link>
      </div>
    </div>
  );
}
