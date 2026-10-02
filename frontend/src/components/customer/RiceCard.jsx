import React from "react";
import { Link } from "react-router-dom";
import { imageUrl } from "../../services/api";

export default function RiceCard({ rice }) {
  const outOfStock = rice.quantity_available <= 0;
  return (
    <div className="card rice-card">
      <img
        src={imageUrl(rice.image) || "https://via.placeholder.com/300x220?text=Rice"}
        alt={rice.name}
        className="rice-card-img"
      />
      <div className="card-body">
        <h3>{rice.name}</h3>
        <p className="muted">{rice.variety} • {rice.bag_weight}</p>
        {rice.farmer && <p className="muted">Sold by {rice.farmer.name} ({rice.farmer.city})</p>}
        <p className="price">₹{rice.price_per_bag} / bag</p>
        {outOfStock ? (
          <p className="stock-out">Out of stock</p>
        ) : (
          <p className="stock-ok">{rice.quantity_available} bags available</p>
        )}
        <Link to={`/customer/rice/${rice.id}`} className="btn btn-primary">View Details</Link>
      </div>
    </div>
  );
}
