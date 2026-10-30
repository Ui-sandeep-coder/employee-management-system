
import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:3000/api/v1",
  headers: {
    "Content-Type": "application/json",
  },
});

// 1. Automatically attach JWT to API requests.
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// 2. Handle expired or invalid JWT responses.
api.interceptors.response.use(
  (response) => {
    // Successful response: return it normally.
    return response;
  },
  (error) => {
    const status = error.response?.status;
    const requestUrl = error.config?.url ?? "";

    // Login failures (wrong email/password) should remain on Login.
    const isLoginRequest = requestUrl.includes("/auth/login");

    if (status === 401 && !isLoginRequest) {
      sessionStorage.removeItem("token");

      // Redirect only when the user is not already on Login.
      if (window.location.pathname !== "/login") {
        window.location.replace("/login");
      }
    }

    return Promise.reject(error);
  },
);

export default api;
