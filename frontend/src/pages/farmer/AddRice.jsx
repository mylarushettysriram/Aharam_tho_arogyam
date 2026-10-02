import React from "react";
import { useNavigate } from "react-router-dom";
import RiceForm from "../../components/farmer/RiceForm";
import riceService from "../../services/riceService";

export default function AddRice() {
  const navigate = useNavigate();

  async function handleSubmit(formData) {
    await riceService.create(formData);
    navigate("/farmer/rice");
  }

  return (
    <div className="page">
      <h1>Add New Rice</h1>
      <RiceForm onSubmit={handleSubmit} submitLabel="Add Rice" />
    </div>
  );
}
