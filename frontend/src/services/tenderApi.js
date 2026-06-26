import api from "./api";

export const createTender = (form) => {
  const formData = new FormData();

  formData.append("title", form.projectName);
  formData.append("description", form.description);
  formData.append("project_category", form.category || "other");
  formData.append("location", form.location || "N/A");
  formData.append("budget", form.Budget);
  formData.append("duration_months", form.Project_Duration || 0);
  formData.append("status", "open");

  if (form.Project_Start_Date) {
    formData.append("start_date", form.Project_Start_Date);
  }

  if (form.Submission_Deadline) {
    formData.append("deadline_at", `${form.Submission_Deadline}T00:00:00Z`);
  }

const evaluationRules = Object.entries(form.evaluationRules || {}).map(
  ([ruleName, ruleValue]) => ({
    rule_name: ruleName,
    rule_value: String(ruleValue),
  })
);

formData.append("evaluation_rules", JSON.stringify(evaluationRules));

  if (form.BOQ) {
    formData.append("files", form.BOQ);
    formData.append("file_categories", "boq");
  }

  if (form.Construction_Drawings) {
    formData.append("files", form.Construction_Drawings);
    formData.append("file_categories", "drawing");
  }

  if (form.Technical_Specifications) {
    formData.append("files", form.Technical_Specifications);
    formData.append("file_categories", "specification");
  }

  if (form.Other_Documents) {
    formData.append("files", form.Other_Documents);
    formData.append("file_categories", "other");
  }

  return api.post("/tenders", formData);
};

export const getAllTenders = () => {
  return api.get("/tenders");
};

export const getTenderById = (id) => {
  return api.get(`/tenders/${id}`);
};

export const updateTender = (id, payload) => api.put(`/tenders/${id}`, payload);


export const deleteTender = (id) => {
  return api.delete(`/tenders/${id}`);
};