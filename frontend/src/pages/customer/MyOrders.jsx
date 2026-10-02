import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import orderService from "../../services/orderService";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

function displayStatus(status) {
  if (status === "cancelled") return "Order was canceled.";
  if (status === "pending") return "Rice booking confirmed!";
  return (status === "accepted" ? "confirmed" : status).replace(/_/g, " ");
}

export default function MyOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    orderService
      .getMyOrders()
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleCancel(id) {
    if (!window.confirm("Cancel this order?")) return;
    try {
      await orderService.cancel(id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Cancel failed");
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="page">
      <h1>My Orders</h1>
      <ErrorMessage message={error} />
      {orders.length === 0 ? (
        <p className="empty-state">You haven't placed any orders yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <div key={o.id} className="order-card">
              <div className="order-card-header">
                <Link to={`/customer/orders/${o.id}`}><strong>Order #{o.id}</strong></Link>
                {o.status !== "accepted" && (
                  <span className={`badge badge-${o.status}`}>{displayStatus(o.status)}</span>
                )}
              </div>
              <p>Farmer: {o.farmer?.name}</p>
              {o.farmer?.phone && (
                <p>
                  Farmer contact: <a href={`tel:${o.farmer.phone}`}>{o.farmer.phone}</a>
                </p>
              )}
              <p>Total: <strong>₹{o.total_amount}</strong></p>
              <div className="card-actions">
                <Link to={`/customer/orders/${o.id}`} className="btn btn-secondary">View Details</Link>
                {["pending", "accepted"].includes(o.status) && (
                  <button className="btn btn-danger" onClick={() => handleCancel(o.id)}>Cancel</button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
