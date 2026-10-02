import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import RiceForm from "../../components/farmer/RiceForm";
import riceService from "../../services/riceService";
import { imageUrl } from "../../services/api";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function EditRice() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [rice, setRice] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    riceService
      .getById(id)
      .then((res) => setRice(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load rice"));
  }, [id]);

  async function handleSubmit(formData) {
    await riceService.update(id, formData);
    navigate("/farmer/rice");
  }

  if (error) return <ErrorMessage message={error} />;
  if (!rice) return <Loader />;

  return (
    <div className="page">
      <h1>Edit Rice</h1>
      <RiceForm
        initialValues={{ ...rice, imagePreviewUrl: imageUrl(rice.image) }}
        onSubmit={handleSubmit}
        submitLabel="Save Changes"
      />
    </div>
  );
}
