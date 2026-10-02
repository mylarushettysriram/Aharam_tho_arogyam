import api from "./api";

const authService = {
  register: (payload) => api.post("/auth/register", payload).then((res) => res.data),
  verifyOtp: (payload) => api.post("/auth/verify-otp", payload).then((res) => res.data),
  login: (payload) => api.post("/auth/login", payload).then((res) => res.data),
  requestPasswordReset: (payload) => api.post("/auth/forgot-password", payload).then((res) => res.data),
  resetPassword: (payload) => api.post("/auth/reset-password", payload).then((res) => res.data),
  getMe: () => api.get("/auth/me").then((res) => res.data),
};

export default authService;
