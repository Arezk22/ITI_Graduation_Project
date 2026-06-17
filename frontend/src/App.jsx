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
        
        
      </Routes>
    </BrowserRouter>
  );
}

export default App;