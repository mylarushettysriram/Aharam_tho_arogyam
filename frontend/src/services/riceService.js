import api from "./api";

const riceService = {
  getAll: (params) => api.get("/rice", { params }).then((res) => res.data),
  getById: (id) => api.get(`/rice/${id}`).then((res) => res.data),
  getMyRice: () => api.get("/farmer/rice").then((res) => res.data),
  create: (formData) =>
    api
      .post("/rice", formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((res) => res.data),
  update: (id, formData) =>
    api
      .put(`/rice/${id}`, formData, { headers: { "Content-Type": "multipart/form-data" } })
      .then((res) => res.data),
  remove: (id) => api.delete(`/rice/${id}`).then((res) => res.data),
  getReviews: (id) => api.get(`/rice/${id}/reviews`).then((res) => res.data),
};

export default riceService;
