import { BrowserRouter, Routes, Route } from "react-router-dom";

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
import Notifications from "./pages/Notifications";
import Evaluation from "./pages/Evaluation";
import AIAnalysis from "./pages/AIAnalysis";
import DocumentChat from "./pages/DocumentChat";
import Reports from "./pages/Reports";
import ContractorProfile from "./pages/ContractorProfile";
import TenderDetails from "./pages/TenderDetails";


// Contractor Pages
import ContractorDashboard from "./pages/ContractorDashboard";
import MyContractorProfile from "./pages/MyContractorProfile";
import ContractorNotifications from "./pages/ContractorNotifications";
import ContractorDocumentChat from "./pages/ContractorDocumentChat";
import SubmitProposal from "./pages/SubmitProposal";
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
        <Route path="/owner/notifications" element={<Notifications />} />
        <Route path="/owner/evaluation" element={<Evaluation />} />
        <Route path="/owner/ai-analysis" element={<AIAnalysis />} />
        <Route path="/owner/document-chat" element={<DocumentChat />} />
        <Route path="/owner/reports" element={<Reports />} />
        <Route path="/owner/contractor-profile" element={<ContractorProfile />} />
        <Route path="/owner/tender-details" element={<TenderDetails />} />
        <Route path="/owner/tender-details/:id" element={<TenderDetails />} />


{/* Contractor Routes */}
        <Route path="/contractor/dashboard" element={<ContractorDashboard />} />
        <Route path="/contractor/profile" element={<MyContractorProfile />} />
        <Route path="/contractor/notifications" element={<ContractorNotifications />} />
        <Route path="/contractor/document-chat" element={<ContractorDocumentChat />} />
        <Route path="/contractor/submit-proposal" element={<SubmitProposal />} />

        
      </Routes>
    </BrowserRouter>
  );
}

export default App;