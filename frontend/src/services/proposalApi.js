import api from "./api";

/**
 * Submit a proposal (tender submission) with files
 * @param {number} tenderId - The tender ID
 * @param {Object} files - Object containing file objects from input fields
 * @returns Promise with submission response
 */
export const submitProposal = (tenderId, files) => {
  const formData = new FormData();

  // Add all non-null files to formData
  // Map file keys to submission file format
  if (files.technicalProposal) {
    formData.append("files", files.technicalProposal);
  }

  if (files.financialProposal) {
    formData.append("files", files.financialProposal);
  }

  if (files.boqPricing) {
    formData.append("files", files.boqPricing);
  }

  if (files.certificates) {
    formData.append("files", files.certificates);
  }

  if (files.companyDocuments) {
    formData.append("files", files.companyDocuments);
  }

  return api.post(`/tenders/${tenderId}/submissions`, formData);
};

/**
 * Get all submissions for a contractor
 * @returns Promise with list of submissions
 */
export const getMySubmissions = () => {
  return api.get("/submissions/my");
};

/**
 * Get submission details
 * @param {number} tenderId - The tender ID
 * @param {number} submissionId - The submission ID
 * @returns Promise with submission details
 */
export const getSubmissionDetail = (tenderId, submissionId) => {
  return api.get(`/tenders/${tenderId}/submissions/${submissionId}`);
};
