// import api from "./api";

// export const login = (email, password) => {
//   return api.post("/login/", {
//     email,
//     username: email,
//     password,
//   });
// };

// export const register = (userData) => {
//   return api.post("/register/", userData);
// };

// export function saveTokens(access, refresh) {
//   localStorage.setItem("accessToken", access);
//   localStorage.setItem("refreshToken", refresh);
// }

// export function clearSession() {
//   localStorage.removeItem("accessToken");
//   localStorage.removeItem("refreshToken");
//   localStorage.removeItem("userRole");
//   localStorage.removeItem("userEmail");
//   localStorage.removeItem("userName");
//   localStorage.removeItem("companyName");
// }

// export function mapRegisterErrors(error) {
//   const data = error?.response?.data || error || {};
//   const backendErrors = {};

//   if (data.detail) backendErrors.form = Array.isArray(data.detail) ? data.detail[0] : data.detail;
//   if (data.email) backendErrors.email = Array.isArray(data.email) ? data.email[0] : data.email;
//   if (data.username) backendErrors.fullName = Array.isArray(data.username) ? data.username[0] : data.username;
//   if (data.company_name) backendErrors.companyName = Array.isArray(data.company_name) ? data.company_name[0] : data.company_name;
//   if (data.password) backendErrors.password = Array.isArray(data.password) ? data.password[0] : data.password;
//   if (data.role) backendErrors.role = Array.isArray(data.role) ? data.role[0] : data.role;

//   return backendErrors;
// }
import api from "./api";

export const login = (email, password) => {
  return api.post("/login/", {
    email,
    password,
  });
};

export const register = (userData) => {
  return api.post("/register/", userData);
};

export function saveTokens(access, refresh) {
  localStorage.setItem("accessToken", access);
  localStorage.setItem("refreshToken", refresh);
}

export function clearSession() {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
}

export function mapRegisterErrors(error) {
  const data = error?.response?.data || error || {};
  const backendErrors = {};

  if (data.detail) {
    backendErrors.form = Array.isArray(data.detail)
      ? data.detail[0]
      : data.detail;
  }

  if (data.email) {
    backendErrors.email = Array.isArray(data.email)
      ? data.email[0]
      : data.email;
  }

  if (data.first_name) {
    backendErrors.fullName = Array.isArray(data.first_name)
      ? data.first_name[0]
      : data.first_name;
  }

  if (data.username) {
    backendErrors.fullName = Array.isArray(data.username)
      ? data.username[0]
      : data.username;
  }

  if (data.company_name) {
    backendErrors.companyName = Array.isArray(data.company_name)
      ? data.company_name[0]
      : data.company_name;
  }

  if (data.password) {
    backendErrors.password = Array.isArray(data.password)
      ? data.password[0]
      : data.password;
  }

  if (data.role) {
    backendErrors.role = Array.isArray(data.role)
      ? data.role[0]
      : data.role;
  }

  return backendErrors;
}

// const API_BASE = "http://localhost:8000";

// const CONNECTION_ERROR = {
//   detail:
//     "Cannot connect to the server. Make sure the backend is running on port 8000.",
// };

// async function parseResponse(response) {
//   const data = await response.json().catch(() => ({}));

//   if (!response.ok) {
//     throw data;
//   }

//   return data;
// }

// async function apiRequest(url, options) {
//   let response;

//   try {
//     response = await fetch(url, options);
//   } catch {
//     throw CONNECTION_ERROR;
//   }

//   return parseResponse(response);
// }

// export async function login(email, password) {
//   return apiRequest(`${API_BASE}/api/v1/login/`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify({ email, password }),
//   });
// }

// export async function register(userData) {
//   return apiRequest(`${API_BASE}/api/v1/register/`, {
//     method: "POST",
//     headers: { "Content-Type": "application/json" },
//     body: JSON.stringify(userData),
//   });
// }

// export function mapRegisterErrors(error) {
//   const backendErrors = {};

//   if (error.detail) {
//     backendErrors.form = Array.isArray(error.detail) ? error.detail[0] : error.detail;
//   }

//   if (error.email) {
//     backendErrors.email = Array.isArray(error.email) ? error.email[0] : error.email;
//   }

//   if (error.first_name) {
//     backendErrors.fullName = Array.isArray(error.first_name)
//       ? error.first_name[0]
//       : error.first_name;
//   }

//   if (error.username) {
//     backendErrors.fullName = Array.isArray(error.username)
//       ? error.username[0]
//       : error.username;
//   }

//   if (error.company_name) {
//     backendErrors.companyName = Array.isArray(error.company_name)
//       ? error.company_name[0]
//       : error.company_name;
//   }

//   if (error.password) {
//     backendErrors.password = Array.isArray(error.password)
//       ? error.password[0]
//       : error.password;
//   }

//   if (error.role) {
//     backendErrors.role = Array.isArray(error.role) ? error.role[0] : error.role;
//   }

//   return backendErrors;
// }

// export function saveTokens(access, refresh) {
//   localStorage.setItem("accessToken", access);
//   localStorage.setItem("refreshToken", refresh);
// }