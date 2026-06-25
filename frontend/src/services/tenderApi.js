import api from "./api";

export const getAllTenders = () => {
  return api.get("/tenders");
};

export const getTenderById = (id) => {
  return api.get(`/tenders/${id}`);
};

export const deleteTender = (id) => {
  return api.delete(`/tenders/${id}`);
};

export const updateTender = (id, tenderData) => {
  return api.put(`/tenders/${id}`, {
    title: tenderData.title,
    description: tenderData.description,
    project_category: tenderData.project_category,
    location: tenderData.location,
    budget: tenderData.budget,
    start_date: tenderData.start_date,
    duration_months: tenderData.duration_months,
    deadline_at: tenderData.deadline_at,
    status: tenderData.status || "open",
  });
};

export const createTender = (form) => {
  const formData = new FormData();

  formData.append("title", form.projectName);
  formData.append("description", form.description);
  formData.append("budget", form.Budget);
  formData.append("deadline_at", `${form.Submission_Deadline}T00:00:00Z`);
  formData.append("status", "open");
  formData.append("project_category", form.category || "other");
  formData.append("location", form.location || "N/A");
  formData.append("start_date", form.Project_Start_Date || "2026-01-01");
  formData.append("duration_months", form.Project_Duration || 0);

  formData.append(
    "evaluation_rules",
    JSON.stringify([
      { rule_name: "Price", rule_value: "70" },
      { rule_name: "Experience", rule_value: "30" },
    ])
  );

  if (form.BOQ) {
    formData.append("files", form.BOQ);
    formData.append("file_categories", "boq");
  }

  if (form.Construction_Drawings) {
    formData.append("files", form.Construction_Drawings);
    formData.append("file_categories", "technical");
  }

  if (form.Technical_Specifications) {
    formData.append("files", form.Technical_Specifications);
    formData.append("file_categories", "technical");
  }

  if (form.Other_Documents) {
    formData.append("files", form.Other_Documents);
    formData.append("file_categories", "other");
  }

  return api.post("/tenders", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });
};