import axios from "axios";

const client = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
  headers: { "Content-Type": "application/json" },
});

client.interceptors.request.use((config) => {
  const token = localStorage.getItem("sparkmatch_token");
  if (token) config.headers.Authorization = `Token ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const url = error.config?.url || "";
    const isAuthCall = url.includes("/auth/login/") || url.includes("/auth/register/");
    if (error.response?.status === 401 && !isAuthCall) {
      localStorage.removeItem("sparkmatch_token");
      window.location.href = "/login";
    }
    return Promise.reject(error);
  },
);

export default client;
