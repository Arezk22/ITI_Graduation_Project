import { BrowserRouter, Routes, Route } from "react-router-dom";

// import Notifications from "./pages/Notifications";



import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Security from "./pages/Security";
import Contact from "./pages/Contact";
import SignIn from "./pages/SignIn";
import SignUp from "./pages/SignUp";
import OwnerSignUp from "./pages/OwnerSignUp";
import ContractorSignUp from "./pages/ContractorSignUp";
import OwnerDashboard from "./pages/OwnerDashboard";
import CreateTender from "./pages/CreateTender";
import Evaluation from "./pages/Evaluation";
import AIAnalysis from "./pages/AIAnalysis";
import Reports from "./pages/Reports";
import TenderDetails from "./pages/TenderDetails";
import OwnerAllTenders from "./pages/OwnerAllTenders";

import ProposalDetails from "./pages/ProposalDetails";
import OwnerCompareSubmission from "./pages/OwnerCompareSubmission";

import ContractorProfileView from "./pages/ContractorProfileView";
import OwnerContractorAwardedProjects from "./pages/OwnerContractorAwardedProjects";

// Contractor Pages
import ContractorDashboard from "./pages/ContractorDashboard";
// import ContractorNotifications from "./pages/ContractorNotifications";
import ContractorDocumentChat from "./pages/ContractorDocumentChat";
import SubmitProposal from "./pages/SubmitProposal";
import ContractorProfile from "./pages/ContractorProfile";
import ContractorAllProposals from "./pages/ContractorAllProposals";

import ContractorOwnerProfile from "./pages/ContractorOwnerProfile";
import ContractorTenderDetails from "./pages/ContractorTenderDetails";
import ContractorOwnerAllTenders from "./pages/ContractorOwnerAllTenders";
import ContractorAwardedProjects from "./pages/ContractorAwardedProjects";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/security" element={<Security />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/signin" element={<SignIn />} />
        <Route path="/signup" element={<SignUp />} />
        <Route path="/signup/owner" element={<OwnerSignUp />} />
        <Route path="/signup/contractor" element={<ContractorSignUp />} />
        <Route path="/owner/dashboard" element={<OwnerDashboard />} />
        <Route path="/owner/create-tender" element={<CreateTender />} />
        {/* <Route path="/owner/notifications" element={<Notifications />} /> */}
        <Route path="/owner/evaluation" element={<Evaluation />} />
        <Route path="/owner/ai-analysis" element={<AIAnalysis />} />
        <Route path="/owner/reports" element={<Reports />} />
        {/* <Route path="/owner/contractor/profile" element={<ContractorProfile />} /> */}
        <Route path="/owner/tender-details" element={<TenderDetails />} />
        <Route path="/owner/tender-details/:id" element={<TenderDetails />} />
        <Route path="/owner/all-tenders" element={<OwnerAllTenders />} />

        <Route path="/owner/proposal-details/:tenderId/:submissionId" element={<ProposalDetails />} />
        <Route path="/owner/tender-details/:tenderId/submissions" element={<OwnerCompareSubmission />} />
        <Route path="/owner/contractor-profile/:contractorId/awarded-projects" element={<OwnerContractorAwardedProjects />} />

        <Route path="/owner/contractor-profile/:contractorId" element={<ContractorProfileView />} />

        {/* Contractor Routes */}
        <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
        <Route path="/contractor/profile" element={<ContractorProfile />} />
        <Route path="/contractor/proposals" element={<ContractorAllProposals />} />
        <Route path="/contractor/owner-profile/:ownerId" element={<ContractorOwnerProfile />} />
        
        {/* <Route path="/contractor/notifications" element={<ContractorNotifications />} /> */}

        <Route path="/contractor/document-chat" element={<ContractorDocumentChat />} />
        <Route path="/contractor/submit-proposal" element={<SubmitProposal />} />
        <Route path="/contractor/submit-proposal/:id" element={<SubmitProposal />} />
        <Route path="/contractor/tender-details/:id" element={<ContractorTenderDetails />} />
        <Route path="/contractor/owner-profile/:ownerId/tenders" element={<ContractorOwnerAllTenders />} />
        <Route path="/contractor/awarded-projects" element={<ContractorAwardedProjects />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
