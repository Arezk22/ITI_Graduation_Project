// import axios from "axios";

// const api = axios.create({
//   baseURL: "/api/v1",
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
//       originalRequest &&
//       !originalRequest._retry &&
//       !originalRequest.url.includes("/login/") &&
//       !originalRequest.url.includes("/refresh/")
//     ) {
//       originalRequest._retry = true;

//       try {
//         const refreshToken = localStorage.getItem("refreshToken");

//         if (!refreshToken) throw new Error("No refresh token");

//         const refreshResponse = await axios.post("/api/v1/refresh/", {
//           refresh: refreshToken,
//         });

//         const newAccessToken = refreshResponse.data.access;

//         localStorage.setItem("accessToken", newAccessToken);

//         originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

//         return api(originalRequest);
//       } catch {
//         localStorage.clear();
//         window.location.href = "/signin";
//       }
//     }

//     return Promise.reject(error);
//   }
// );

// export default api;



















// import axios from "axios";

// const api = axios.create({
//   baseURL: "/api/v1",
// });

// api.interceptors.request.use((config) => {
//   const token = localStorage.getItem("accessToken");

//   if (token) {
//     config.headers.Authorization = `Bearer ${token}`;
//   }

//   return config;
// });

// export default api;



import axios from "axios";

const api = axios.create({
  baseURL: "/api/v1",
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

    const isTokenExpired =
      error.response?.data?.code === "token_not_valid" &&
      error.response?.data?.messages?.some(
        (msg) => msg.message === "Token is expired"
      );

    if (
      (error.response?.status === 401 ||
        error.response?.status === 403 ||
        isTokenExpired) &&
      originalRequest &&
      !originalRequest._retry &&
      !originalRequest.url.includes("/login/") &&
      !originalRequest.url.includes("/refresh/")
    ) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem("refreshToken");

        if (!refreshToken) {
          throw new Error("No refresh token");
        }

        const refreshResponse = await axios.post("/api/v1/refresh/", {
          refresh: refreshToken,
        });

        const newAccessToken = refreshResponse.data.access;

        localStorage.setItem("accessToken", newAccessToken);

        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;

        return api(originalRequest);
      } catch (refreshError) {
        localStorage.clear();
        window.location.href = "/signin";
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

export default api;