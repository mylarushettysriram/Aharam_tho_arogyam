import React, { useEffect, useState } from "react";
import orderService from "../../services/orderService";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

const NEXT_STATUS = {
  accepted: "processing",
  processing: "out_for_delivery",
  out_for_delivery: "delivered",
};
const NEXT_LABEL = {
  accepted: "Mark Processing",
  processing: "Mark Out for Delivery",
  out_for_delivery: "Mark Delivered",
};

function displayStatus(status) {
  return (status === "accepted" ? "confirmed" : status).replace(/_/g, " ");
}

export default function FarmerOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  function load() {
    setLoading(true);
    orderService
      .getFarmerOrders()
      .then((res) => setOrders(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load orders"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function act(id, action) {
    setBusyId(id);
    try {
      if (action === "accept") {
        await orderService.accept(id);
      } else if (action === "reject") {
        await orderService.reject(id);
      } else {
        await orderService.updateStatus(id, action);
      }
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Action failed");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="page">
      <h1>Orders</h1>
      <ErrorMessage message={error} />
      {orders.length === 0 ? (
        <p className="empty-state">No orders yet.</p>
      ) : (
        <div className="order-list">
          {orders.map((o) => (
            <div key={o.id} className="order-card">
              <div className="order-card-header">
                <strong>Order #{o.id}</strong>
                <span className={`badge badge-${o.status}`}>{displayStatus(o.status)}</span>
              </div>
              <p>Customer: {o.customer?.name} ({o.customer?.phone})</p>
              <ul>
                {o.items.map((i) => (
                  <li key={i.id}>{i.riceProduct?.name} × {i.quantity} bags = ₹{i.subtotal}</li>
                ))}
              </ul>
              <p>Total: <strong>₹{o.total_amount}</strong></p>
              <p className="muted">Deliver to: {o.delivery_address}, {o.delivery_city}, {o.delivery_state} - {o.delivery_pincode}</p>

              <div className="card-actions">
                {o.status === "pending" && (
                  <>
                    <button className="btn btn-primary" disabled={busyId === o.id} onClick={() => act(o.id, "accept")}>
                      Accept Order
                    </button>
                    <button className="btn btn-danger" disabled={busyId === o.id} onClick={() => act(o.id, "reject")}>
                      Reject Order
                    </button>
                  </>
                )}
                {NEXT_STATUS[o.status] && (
                  <button className="btn btn-secondary" disabled={busyId === o.id} onClick={() => act(o.id, NEXT_STATUS[o.status])}>
                    {NEXT_LABEL[o.status]}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
