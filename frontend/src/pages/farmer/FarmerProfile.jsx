import React from "react";
import { useAuth } from "../../context/AuthContext";

export default function FarmerProfile() {
  const { user } = useAuth();
  if (!user) return null;
  return (
    <div className="page">
      <h1>My Profile</h1>
      <div className="card profile-card">
        <p><strong>Name:</strong> {user.name}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Phone:</strong> {user.phone}</p>
        <p><strong>Address:</strong> {user.address}, {user.city}, {user.state} - {user.pincode}</p>
        <p><strong>Role:</strong> Farmer</p>
      </div>
    </div>
  );
}
