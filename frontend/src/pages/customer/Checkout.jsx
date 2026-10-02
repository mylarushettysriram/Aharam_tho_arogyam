import React, { useState } from "react";
import { useLocation, useNavigate, Navigate } from "react-router-dom";
import orderService from "../../services/orderService";
import { useAuth } from "../../context/AuthContext";
import ErrorMessage from "../../components/common/ErrorMessage";

const UPI_ID = "6303146241-3@ybl";

function loadRazorpay() {
  return new Promise((resolve, reject) => {
    if (window.Razorpay) return resolve();
    const script = document.createElement("script");
    script.src = "https://checkout.razorpay.com/v1/checkout.js";
    script.onload = resolve;
    script.onerror = () => reject(new Error("Could not load the payment service"));
    document.body.appendChild(script);
  });
}

export default function Checkout() {
  const { state } = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    delivery_name: user?.name || "",
    delivery_phone: user?.phone || "",
    alternate_phone: "",
    delivery_address: user?.address || "",
    delivery_city: user?.city || "",
    delivery_state: user?.state || "",
    delivery_pincode: user?.pincode || "",
  });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [paymentConfirmed, setPaymentConfirmed] = useState(false);
  const [showReview, setShowReview] = useState(false);

  if (!state || !state.rice) {
    return <Navigate to="/customer/rice" replace />;
  }
  const { rice, quantity } = state;
  const total = (Number(rice.price_per_bag) * quantity).toFixed(2);
  const upiLink = `upi://pay?pa=${encodeURIComponent(UPI_ID)}&pn=${encodeURIComponent("Aharam Tho Arogyam")}&am=${total}&cu=INR&tn=${encodeURIComponent(`${rice.name} order`)}`;
  const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(upiLink)}`;

  function update(field, value) {
    setForm({ ...form, [field]: value });
  }

  function validateDeliveryDetails() {
    const requiredFields = [
      "delivery_name",
      "delivery_phone",
      "delivery_address",
      "delivery_city",
      "delivery_state",
      "delivery_pincode",
    ];

    for (const field of requiredFields) {
      if (!String(form[field] || "").trim()) {
        return false;
      }
    }

    return true;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!showReview) {
      if (!validateDeliveryDetails()) {
        setError("Please fill in all customer delivery details before confirming the order.");
        return;
      }
      setShowReview(true);
      return;
    }

    setSubmitting(true);
    try {
      let paymentId = null;
      if (paymentMethod === "upi") {
        await loadRazorpay();
        const paymentOrderResponse = await orderService.createPaymentOrder({
          items: [{ rice_product_id: rice.id, quantity }],
        });
        const paymentOrder = paymentOrderResponse.data;
        await new Promise((resolve, reject) => {
          const checkout = new window.Razorpay({
            key: paymentOrder.keyId,
            amount: paymentOrder.amount,
            currency: paymentOrder.currency,
            name: "Aharam Tho Arogyam",
            description: `${rice.name} order`,
            prefill: {
              name: form.delivery_name,
              contact: form.delivery_phone,
            },
            handler: async (response) => {
              try {
                await orderService.verifyPayment(response);
                paymentId = response.razorpay_payment_id;
                setPaymentConfirmed(true);
                resolve();
              } catch (err) {
                reject(err);
              }
            },
            modal: { ondismiss: () => reject(new Error("Payment was not completed")) },
          });
          checkout.open();
        });
      }

      const res = await orderService.create({
        items: [{ rice_product_id: rice.id, quantity }],
        payment_method: paymentMethod,
        payment_id: paymentId,
        ...form,
      });
      navigate(`/customer/orders/${res.data.id}`, {
        state: { orderSuccess: true },
      });
    } catch (err) {
      // This is where the concurrency check surfaces: if someone else just
      // bought the last bags, the backend rejects this with a clear message.
      setError(err?.response?.data?.message || "Order failed");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="page checkout-page">
      <div className="checkout-header">
        <div>
          <span className="checkout-kicker">Secure checkout</span>
          <h1>Complete your order</h1>
        </div>
        <span className="checkout-chip">Fast delivery</span>
      </div>

      <div className="checkout-progress" aria-label="Checkout progress">
        <div className="progress-step active"><span>1</span><strong>Delivery</strong></div>
        <div className="progress-line" />
        <div className="progress-step"><span>2</span><strong>Payment</strong></div>
        <div className="progress-line" />
        <div className="progress-step"><span>3</span><strong>Confirmation</strong></div>
      </div>

      <div className="checkout-layout">
        <form className="form-card checkout-form" onSubmit={handleSubmit}>
          <div className="section-heading">
            <h2>Delivery details</h2>
            <p>Where should we bring your fresh rice?</p>
          </div>

          <ErrorMessage message={error} />

          <div className="field-group">
            <label>Full Name</label>
            <input value={form.delivery_name} onChange={(e) => update("delivery_name", e.target.value)} required />
          </div>

          <div className="field-group">
            <label>Phone</label>
            <input value={form.delivery_phone} onChange={(e) => update("delivery_phone", e.target.value)} required />
          </div>

          <div className="field-group">
            <label>Alternate Phone (Optional)</label>
            <input value={form.alternate_phone} onChange={(e) => update("alternate_phone", e.target.value)} placeholder="Another contact number for delivery updates" />
          </div>

          <div className="field-group">
            <label>Delivery Address</label>
            <input value={form.delivery_address} onChange={(e) => update("delivery_address", e.target.value)} required />
          </div>

          <div className="form-row">
            <div className="field-group">
              <label>City</label>
              <input value={form.delivery_city} onChange={(e) => update("delivery_city", e.target.value)} required />
            </div>
            <div className="field-group">
              <label>State</label>
              <input value={form.delivery_state} onChange={(e) => update("delivery_state", e.target.value)} required />
            </div>
          </div>

          <div className="field-group">
            <label>Pincode</label>
            <input value={form.delivery_pincode} onChange={(e) => update("delivery_pincode", e.target.value)} required />
          </div>

          <fieldset className="payment-methods">
            <legend>Payment Method</legend>
            <label className={`payment-option ${paymentMethod === "cod" ? "active" : ""}`}>
              <input
                type="radio"
                name="payment_method"
                value="cod"
                checked={paymentMethod === "cod"}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPaymentConfirmed(false);
                }}
              />
              <span><strong>Cash on Delivery</strong><small>Pay when your order arrives</small></span>
            </label>
            <label className={`payment-option ${paymentMethod === "upi" ? "active" : ""}`}>
              <input
                type="radio"
                name="payment_method"
                value="upi"
                checked={paymentMethod === "upi"}
                onChange={(e) => {
                  setPaymentMethod(e.target.value);
                  setPaymentConfirmed(false);
                }}
              />
              <span><strong>UPI QR Code</strong><small>Fast and secure online payment</small></span>
            </label>
          </fieldset>

          {paymentMethod === "upi" && (
            <div className="upi-payment card">
              <div className="upi-header">
                <h3>Pay ₹{total} with UPI</h3>
                <span className="upi-badge">Secure</span>
              </div>
              <div className="qr-box">
                <img src={qrCodeUrl} alt="UPI payment QR code" width="220" height="220" />
              </div>
              <p>Scan the QR code with your UPI app.</p>
              <p className="upi-id">UPI number: {UPI_ID}</p>
              <p className={paymentConfirmed ? "stock-ok" : "muted"}>
                {paymentConfirmed ? "Payment confirmed." : "Payment will be verified after checkout."}
              </p>
            </div>
          )}

          {showReview && (
            <div className="card review-card">
              <h3>Review your details</h3>
              <p><strong>Name:</strong> {form.delivery_name}</p>
              <p><strong>Phone:</strong> {form.delivery_phone}</p>
              {form.alternate_phone && <p><strong>Alternate Phone:</strong> {form.alternate_phone}</p>}
              <p><strong>Address:</strong> {form.delivery_address}</p>
              <p><strong>City:</strong> {form.delivery_city}</p>
              <p><strong>State:</strong> {form.delivery_state}</p>
              <p><strong>Pincode:</strong> {form.delivery_pincode}</p>
            </div>
          )}

          <div className="checkout-actions">
            {showReview && (
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setShowReview(false)}
              >
                Edit Details
              </button>
            )}
            <button
              type="submit"
              className="btn btn-primary checkout-button"
              disabled={submitting}
            >
              {submitting
                ? "Processing payment..."
                : showReview
                  ? "Confirm and Place Order"
                  : paymentMethod === "upi"
                    ? "Review Order"
                    : "Review Order"}
            </button>
          </div>
          <p className="checkout-assurance">Your information is used only to deliver this order.</p>
        </form>

        <aside className="order-summary card">
          <div className="summary-header">
            <h3>Order Summary</h3>
            <span className="summary-tag">{quantity} bags</span>
          </div>

          <div className="summary-product">
            <div className="summary-product-icon">R</div>
            <div>
              <p className="summary-label">Item</p>
              <h4>{rice.name}</h4>
            </div>
            <div className="summary-price">₹{rice.price_per_bag}</div>
          </div>

          <div className="summary-line">
            <span>{rice.name} × {quantity}</span>
            <span>₹{total}</span>
          </div>
          <div className="summary-line muted-line">
            <span>Delivery</span>
            <span>Free</span>
          </div>
          <div className="summary-divider" />
          <div className="summary-total">
            <span>Total</span>
            <strong>₹{total}</strong>
          </div>
          <div className="summary-note">Free delivery included. Stock is reserved when you place the order.</div>
        </aside>
      </div>
    </div>
  );
}
