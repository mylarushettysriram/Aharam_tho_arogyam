import api from "./api";

const orderService = {
  create: (payload) => api.post("/orders", payload).then((res) => res.data),
  createPaymentOrder: (payload) => api.post("/payments/order", payload).then((res) => res.data),
  verifyPayment: (payload) => api.post("/payments/verify", payload).then((res) => res.data),
  getById: (id) => api.get(`/orders/${id}`).then((res) => res.data),
  cancel: (id) => api.put(`/orders/${id}/cancel`).then((res) => res.data),

  getMyOrders: () => api.get("/customer/orders").then((res) => res.data),

  getFarmerOrders: () => api.get("/farmer/orders").then((res) => res.data),
  accept: (id) => api.put(`/farmer/orders/${id}/accept`).then((res) => res.data),
  reject: (id) => api.put(`/farmer/orders/${id}/reject`).then((res) => res.data),
  updateStatus: (id, status) => api.put(`/farmer/orders/${id}/status`, { status }).then((res) => res.data),
  getFarmerStats: () => api.get("/farmer/stats").then((res) => res.data),

  createReview: (payload) => api.post("/reviews", payload).then((res) => res.data),
};

export default orderService;
