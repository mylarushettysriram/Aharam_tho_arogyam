import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import riceService from "../../services/riceService";
import RiceCard from "../../components/farmer/RiceCard";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function MyRice() {
  const [rice, setRice] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  function load() {
    setLoading(true);
    riceService
      .getMyRice()
      .then((res) => setRice(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load rice"))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleDelete(id) {
    if (!window.confirm("Delete this rice listing?")) return;
    try {
      await riceService.remove(id);
      load();
    } catch (err) {
      alert(err?.response?.data?.message || "Delete failed");
    }
  }

  if (loading) return <Loader />;

  return (
    <div className="page">
      <div className="page-header">
        <h1>My Rice Listings</h1>
        <Link to="/farmer/rice/add" className="btn btn-primary">+ Add New Rice</Link>
      </div>
      <ErrorMessage message={error} />
      {rice.length === 0 ? (
        <p className="empty-state">You haven't listed any rice yet. Add your first product!</p>
      ) : (
        <div className="grid">
          {rice.map((r) => <RiceCard key={r.id} rice={r} onDelete={handleDelete} />)}
        </div>
      )}
    </div>
  );
}
