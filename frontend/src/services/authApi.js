
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

export const googleAuth = (id_token, role = null) => {
    return api.post("/google/auth/", {
        id_token,
        role,
    });
};


