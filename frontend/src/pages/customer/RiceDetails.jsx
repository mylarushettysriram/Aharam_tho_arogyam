import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import riceService from "../../services/riceService";
import { imageUrl } from "../../services/api";
import { useAuth } from "../../context/AuthContext";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function RiceDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [rice, setRice] = useState(null);
  const [qty, setQty] = useState(1);
  const [error, setError] = useState("");

  useEffect(() => {
    riceService
      .getById(id)
      .then((res) => setRice(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load rice"));
  }, [id]);

  if (error) return <ErrorMessage message={error} />;
  if (!rice) return <Loader />;

  const outOfStock = rice.quantity_available <= 0;

  function handleBuy() {
    if (!user) return navigate("/login");
    if (qty < 1 || qty > rice.quantity_available) {
      alert(`Please choose between 1 and ${rice.quantity_available} bags.`);
      return;
    }
    navigate("/customer/checkout", {
      state: { rice, quantity: qty },
    });
  }

  return (
    <div className="page">
      <div className="rice-details">
        <img src={imageUrl(rice.image) || "https://via.placeholder.com/500x360?text=Rice"} alt={rice.name} />
        <div>
          <h1>{rice.name}</h1>
          <p className="muted">{rice.variety} • {rice.bag_weight}</p>
          <p>{rice.description}</p>
          <p className="price-large">₹{rice.price_per_bag} / bag</p>
          {outOfStock ? (
            <p className="stock-out">Out of stock</p>
          ) : (
            <p className="stock-ok">{rice.quantity_available} bags available</p>
          )}

          {rice.farmer && (
            <div className="farmer-info">
              <h4>Sold by</h4>
              <p>{rice.farmer.name} — {rice.farmer.city}, {rice.farmer.state}</p>
            </div>
          )}

          {rice.averageRating !== null && (
            <p>⭐ {rice.averageRating} ({rice.reviewCount} review{rice.reviewCount !== 1 ? "s" : ""})</p>
          )}

          {!outOfStock && (
            <div className="buy-box">
              <label>Number of bags</label>
              <input
                type="number"
                min={1}
                max={rice.quantity_available}
                value={qty}
                onChange={(e) => setQty(Number(e.target.value))}
              />
              <button className="btn btn-primary" onClick={handleBuy}>Buy Now</button>
            </div>
          )}

          {rice.reviews && rice.reviews.length > 0 && (
            <div className="reviews">
                <h4>Comments & Reviews</h4>
              {rice.reviews.map((r) => (
                <div key={r.id} className="review-item">
                  <strong>{r.customer?.name}</strong> — {"⭐".repeat(r.rating)}
                  {r.comment && <p>{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
