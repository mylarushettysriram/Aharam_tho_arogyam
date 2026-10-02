import React, { useState } from "react";
import orderService from "../../services/orderService";

export default function ReviewForm({ orderId, riceProductId }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    try {
      await orderService.createReview({ order_id: orderId, rice_product_id: riceProductId, rating, comment });
      setSubmitted(true);
    } catch (err) {
      setError(err?.response?.data?.message || "Could not submit review");
    }
  }

  if (submitted) return <p className="stock-ok">Thanks for your review!</p>;

  return (
    <form onSubmit={handleSubmit} className="review-form">
      {error && <div className="error-message">{error}</div>}
      <label>Rate this product</label>
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))}>
        {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n > 1 ? "s" : ""}</option>)}
      </select>
      <input placeholder="Optional comment" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button type="submit" className="btn btn-secondary">Submit Review</button>
    </form>
  );
}
