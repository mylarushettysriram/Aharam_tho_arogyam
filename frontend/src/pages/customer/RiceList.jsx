import React, { useEffect, useState } from "react";
import riceService from "../../services/riceService";
import RiceCard from "../../components/customer/RiceCard";
import Loader from "../../components/common/Loader";
import ErrorMessage from "../../components/common/ErrorMessage";

export default function RiceList() {
  const [rice, setRice] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");

  function load(params = {}) {
    setLoading(true);
    riceService
      .getAll(params)
      .then((res) => setRice(res.data))
      .catch((err) => setError(err?.response?.data?.message || "Failed to load rice"))
      .finally(() => setLoading(false));
  }

  useEffect(() => load(), []);

  function handleFilter(e) {
    e.preventDefault();
    const params = {};
    if (search) params.search = search;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;
    load(params);
  }

  return (
    <div className="page">
      <h1>Browse Rice</h1>
      <form className="filter-bar" onSubmit={handleFilter}>
        <input placeholder="Search rice or variety..." value={search} onChange={(e) => setSearch(e.target.value)} />
        <input type="number" placeholder="Min price" value={minPrice} onChange={(e) => setMinPrice(e.target.value)} />
        <input type="number" placeholder="Max price" value={maxPrice} onChange={(e) => setMaxPrice(e.target.value)} />
        <button type="submit" className="btn btn-primary">Filter</button>
      </form>

      <ErrorMessage message={error} />
      {loading ? (
        <Loader />
      ) : rice.length === 0 ? (
        <p className="empty-state">No rice found matching your search.</p>
      ) : (
        <div className="grid">
          {rice.map((r) => <RiceCard key={r.id} rice={r} />)}
        </div>
      )}
    </div>
  );
}
