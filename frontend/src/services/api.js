import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:5000/api",
});

// Attach the simple local user id to protected requests.
api.interceptors.request.use((config) => {
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    config.headers["X-User-Id"] = JSON.parse(savedUser).id;
  }
  return config;
});

// Helper to turn a relative image path from the backend into a full URL.
export function imageUrl(path) {
  if (!path) return null;
  const base = import.meta.env.VITE_UPLOADS_URL || "http://localhost:5000/uploads";
  return `${base}/${path}`;
}

export default api;
