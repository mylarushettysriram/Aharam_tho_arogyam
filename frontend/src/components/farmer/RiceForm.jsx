import React, { useState } from "react";

// Shared form used by both AddRice and EditRice pages.
export default function RiceForm({ initialValues, onSubmit, submitLabel = "Save" }) {
  const [values, setValues] = useState({
    name: initialValues?.name || "",
    variety: initialValues?.variety || "",
    description: initialValues?.description || "",
    price_per_bag: initialValues?.price_per_bag || "",
    bag_weight: initialValues?.bag_weight || "",
    quantity_available: initialValues?.quantity_available ?? "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [preview, setPreview] = useState(initialValues?.imagePreviewUrl || null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  function handleChange(e) {
    setValues({ ...values, [e.target.name]: e.target.value });
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (!file) return;
    setImageFile(file);
    setPreview(URL.createObjectURL(file));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");

    if (!values.name || !values.variety || !values.price_per_bag || !values.bag_weight) {
      setError("Please fill in all required fields.");
      return;
    }

    const formData = new FormData();
    Object.entries(values).forEach(([key, val]) => formData.append(key, val));
    if (imageFile) formData.append("image", imageFile);

    setSubmitting(true);
    try {
      await onSubmit(formData);
    } catch (err) {
      setError(err?.response?.data?.message || "Something went wrong.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="form-card">
      {error && <div className="error-message">{error}</div>}

      <label>Rice Name *</label>
      <input name="name" value={values.name} onChange={handleChange} placeholder="e.g. Premium Basmati Rice" />

      <label>Variety *</label>
      <input name="variety" value={values.variety} onChange={handleChange} placeholder="e.g. Basmati" />

      <label>Description</label>
      <textarea name="description" value={values.description} onChange={handleChange} rows={3} />

      <div className="form-row">
        <div>
          <label>Price per Bag (₹) *</label>
          <input type="number" min="1" name="price_per_bag" value={values.price_per_bag} onChange={handleChange} />
        </div>
        <div>
          <label>Bag Weight *</label>
          <input name="bag_weight" value={values.bag_weight} onChange={handleChange} placeholder="e.g. 25kg" />
        </div>
      </div>

      <label>Available Quantity (bags) *</label>
      <input
        type="number"
        min="0"
        name="quantity_available"
        value={values.quantity_available}
        onChange={handleChange}
      />

      <label>Rice Image</label>
      <input type="file" accept="image/*" onChange={handleImageChange} />
      {preview && <img src={preview} alt="preview" className="image-preview" />}

      <button type="submit" className="btn btn-primary" disabled={submitting}>
        {submitting ? "Saving..." : submitLabel}
      </button>
    </form>
  );
}
