import React from "react";
import { Link } from "react-router-dom";
import { imageUrl } from "../../services/api";

export default function RiceCard({ rice, onDelete }) {
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
        <p className="price">₹{rice.price_per_bag} / bag</p>
        <p className={rice.quantity_available > 0 ? "stock-ok" : "stock-out"}>
          {rice.quantity_available > 0 ? `${rice.quantity_available} bags available` : "Out of stock"}
        </p>
        <div className="card-actions">
          <Link to={`/farmer/rice/edit/${rice.id}`} className="btn btn-secondary">Edit</Link>
          <button className="btn btn-danger" onClick={() => onDelete(rice.id)}>Delete</button>
        </div>
      </div>
    </div>
  );
}
