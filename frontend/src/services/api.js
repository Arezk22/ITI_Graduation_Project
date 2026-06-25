// import axios from "axios";

// const api = axios.create({
//   baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// api.interceptors.response.use(
//   (response) => response,
//   async (error) => {
//     const originalRequest = error.config;

//     if (
//       error.response?.status === 401 &&
//       !originalRequest._retry &&
//       !originalRequest.url.includes("/login") &&
//       !originalRequest.url.includes("/refresh")
//     ) {
//       originalRequest._retry = true;

//       try {
//         const refreshToken = localStorage.getItem("refreshToken");

//         if (!refreshToken) throw new Error("No refresh token");

//         const refreshResponse = await axios.post(
//           `${api.defaults.baseURL}/refresh`,
//           { refresh: refreshToken }
//         );

//         const newAccessToken = refreshResponse.data.access;

//         localStorage.setItem("accessToken", newAccessToken);

//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

//         return api(originalRequest);
//       } catch {
//         localStorage.removeItem("accessToken");
//         localStorage.removeItem("refreshToken");
//         window.location.href = "/signin";
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;
import axios from "axios";

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000",
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("accessToken");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (
      error.response?.status === 401 &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login") &&
      !originalRequest.url.includes("/refresh")
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const refreshResponse = await axios.post(
          `${api.defaults.baseURL}/refresh`,
          { refresh: refreshToken }
        );

        const newAccessToken = refreshResponse.data.access;

        localStorage.setItem("accessToken", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch {
        localStorage.removeItem("accessToken");
        localStorage.removeItem("refreshToken");
        window.location.href = "/signin";
      }
    }

    return Promise.reject(error);
  }
);

export default api;