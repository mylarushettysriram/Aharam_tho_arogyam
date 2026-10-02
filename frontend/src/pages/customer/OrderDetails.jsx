import React, { useEffect, useState } from "react";
import { useLocation, useParams } from "react-router-dom";
import orderService from "../../services/orderService";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";
import ReviewForm from "../../components/customer/ReviewForm";

function displayStatus(status) {
  if (status === "pending") return "Rice booking confirmed!";
  return (status === "accepted" ? "confirmed" : status).replace(/_/g, " ");
}

const statusSteps = ["accepted", "processing", "out_for_delivery", "delivered"];

function statusLabel(status) {
  if (status === "accepted") return "Confirmed";
  if (status === "out_for_delivery") return "Out for delivery";
  return status.charAt(0).toUpperCase() + status.slice(1);
}

export default function OrderDetails() {
  const { id } = useParams();
  const { state: navigationState } = useLocation();
  const [order, setOrder] = useState(null);
  const [error, setError] = useState("");
  const [cancelling, setCancelling] = useState(false);

  function load() {
    orderService
      .getById(id)
      .then((res) => setOrder(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load order"));
  }

  useEffect(load, [id]);

  async function handleCancel() {
    if (!window.confirm("Cancel this order?")) return;

    setCancelling(true);
    setError("");
    try {
      const response = await orderService.cancel(id);
      setOrder(response.data);
    } catch (err) {
      setError(err?.response?.data?.message || "Cancel failed");
    } finally {
      setCancelling(false);
    }
  }

  if (error) return <ErrorMessage message={error} />;
  if (!order) return <Loader />;

  const isCancelled = order.status === "cancelled";
  const activeStep = statusSteps.indexOf(order.status);

  return (
    <div className="page order-details-page">
      {navigationState?.orderSuccess && !isCancelled && (
        <div className="order-success-banner">
          <span className="success-icon">✓</span>
          <div>
            <strong>Rice booking confirmed!</strong>
            <p>Your order was accepted because the requested rice was available.</p>
          </div>
        </div>
      )}

      <div className="order-hero">
        <div>
          <span className="checkout-kicker">Order details</span>
          <h1>Order #{order.id}</h1>
          <p className="order-subtitle">Thank you for choosing Aharam Tho Arogyam</p>
        </div>
        <span className={`order-status-pill ${isCancelled ? "cancelled" : ""}`}>
          <span className="status-dot" /> {isCancelled ? "Canceled" : statusLabel(order.status)}
        </span>
      </div>

      {!isCancelled && (
        <div className="order-timeline card">
          <div className="timeline-track">
            {statusSteps.map((step, index) => (
              <div className={`timeline-step ${index <= activeStep ? "complete" : ""} ${index === activeStep ? "current" : ""}`} key={step}>
                <span className="timeline-marker">{index <= activeStep ? "✓" : index + 1}</span>
                <span>{statusLabel(step)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {isCancelled && (
        <div className="cancelled-notice">
          <strong>Order was canceled.</strong>
          <p>This order is no longer active and the stock has been returned.</p>
        </div>
      )}

      <div className="order-details-grid">
        <div className="order-main-column">
          <section className="detail-panel card">
            <div className="panel-heading">
              <div><span className="panel-eyebrow">Your purchase</span><h2>Order items</h2></div>
              <span className="item-count">{order.items.length} item{order.items.length > 1 ? "s" : ""}</span>
            </div>
            <div className="order-items">
              {order.items.map((i) => (
                <div className="order-item" key={i.id}>
                  <div className="item-icon">🌾</div>
                  <div className="item-info">
                    <h3>{i.riceProduct?.name}</h3>
                    <p>{i.quantity} bag{i.quantity > 1 ? "s" : ""} × ₹{i.price_per_bag}</p>
                    {order.status === "delivered" && (
                      <ReviewForm orderId={order.id} riceProductId={i.rice_product_id} />
                    )}
                  </div>
                  <strong>₹{i.subtotal}</strong>
                </div>
              ))}
            </div>
            <div className="order-total-row"><span>Total</span><strong>₹{order.total_amount}</strong></div>
            <div className="order-total-row"><span>Payment method</span><strong>{order.payment_method === "upi" ? "UPI" : "Cash on Delivery"}</strong></div>
          </section>

          <section className="detail-panel card delivery-panel">
            <div className="panel-heading">
              <div><span className="panel-eyebrow">Where it is going</span><h2>Delivery details</h2></div>
              <span className="delivery-icon">⌖</span>
            </div>
            <div className="delivery-content">
              <div className="delivery-avatar">{order.delivery_name?.charAt(0).toUpperCase()}</div>
              <div>
                <strong>{order.delivery_name}</strong>
                <p>{order.delivery_phone}</p>
                {order.alternate_phone && <p>Alternate: {order.alternate_phone}</p>}
                <p>{order.delivery_address}, {order.delivery_city}, {order.delivery_state} - {order.delivery_pincode}</p>
              </div>
            </div>
          </section>
        </div>

        <aside className="order-side-column">
          {!isCancelled && ["pending", "accepted"].includes(order.status) && (
            <button className="btn btn-danger cancel-order-button" onClick={handleCancel} disabled={cancelling}>
              {cancelling ? "Cancelling..." : "Cancel Order"}
            </button>
          )}
          <section className="farmer-panel card">
            <span className="panel-eyebrow">Your rice partner</span>
            <h2>Farmer contact</h2>
            <div className="farmer-contact">
              <div className="farmer-avatar">{order.farmer?.name?.charAt(0).toUpperCase()}</div>
              <div><strong>{order.farmer?.name || "Farmer"}</strong><p>Rice producer</p></div>
            </div>
            {order.farmer?.phone ? (
              <a className="call-farmer-button" href={`tel:${order.farmer.phone}`}>☎ Call farmer <span>{order.farmer.phone}</span></a>
            ) : <p className="muted">Farmer phone number unavailable</p>}
          </section>
          <div className="order-help"><strong>Need help?</strong><p>Keep your order number ready when contacting support.</p></div>
        </aside>
      </div>
    </div>
  );
}
