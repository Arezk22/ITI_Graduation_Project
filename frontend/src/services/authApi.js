const API_BASE = "http://localhost:8000";

const CONNECTION_ERROR = {
  detail:
    "Cannot connect to the server. Make sure the backend is running on port 8000.",
};

async function parseResponse(response) {
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw data;
  }

  return data;
}

async function apiRequest(url, options) {
  let response;

  try {
    response = await fetch(url, options);
  } catch {
    throw CONNECTION_ERROR;
  }

  return parseResponse(response);
}

export async function login(email, password) {
  return apiRequest(`${API_BASE}/api/v1/login/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
}

export async function register(userData) {
  return apiRequest(`${API_BASE}/api/v1/register/`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(userData),
  });
}

export function mapRegisterErrors(error) {
  const backendErrors = {};

  if (error.detail) {
    backendErrors.form = Array.isArray(error.detail) ? error.detail[0] : error.detail;
  }

  if (error.email) {
    backendErrors.email = Array.isArray(error.email) ? error.email[0] : error.email;
  }

  if (error.first_name) {
    backendErrors.fullName = Array.isArray(error.first_name)
      ? error.first_name[0]
      : error.first_name;
  }

  if (error.username) {
    backendErrors.fullName = Array.isArray(error.username)
      ? error.username[0]
      : error.username;
  }

  if (error.company_name) {
    backendErrors.companyName = Array.isArray(error.company_name)
      ? error.company_name[0]
      : error.company_name;
  }

  if (error.password) {
    backendErrors.password = Array.isArray(error.password)
      ? error.password[0]
      : error.password;
  }

  if (error.role) {
    backendErrors.role = Array.isArray(error.role) ? error.role[0] : error.role;
  }

  return backendErrors;
}
