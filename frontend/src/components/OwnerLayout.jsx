import { useState } from "react";
import { useNavigate } from "react-router-dom";
// import { ownerDashboardData } from "../data/ownerDashboardData";

function getInitials(name) {
  if (!name) return "U";

  const parts = name.trim().split(" ").filter(Boolean);

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return parts[0][0].toUpperCase();
}

function OwnerLayout({ activePage, children }) {


  // const data = ownerDashboardData;
  const navigate = useNavigate();

  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const userName = localStorage.getItem("userName") || "User";
const companyName = localStorage.getItem("companyName") || "Company Name";
const userInitials = getInitials(userName);



  // const handleSignOut = () => {
  //   navigate("/");
  // };

  const handleSignOut = () => {
  localStorage.removeItem("accessToken");
  localStorage.removeItem("refreshToken");
  localStorage.removeItem("userRole");
  localStorage.removeItem("userEmail");
  localStorage.removeItem("userName");
  localStorage.removeItem("companyName");
  localStorage.removeItem("contractorTenderSearch");

  navigate("/");
};
  
  return (
    
    <div className={`owner-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="owner-sidebar">
        <div
          className="sidebar-brand"
          onClick={() => navigate("/owner/dashboard")}
        >
          <span className="brand-icon">
            <i className="bi bi-building"></i>
          </span>
          <div>
            <h5>BuildTender</h5>
            <p>AI Platform</p>
          </div>
        </div>

        <span className="owner-badge">Project Owner</span>

        <nav className="sidebar-menu">
          <button
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => navigate("/owner/dashboard")}
          >
            <i className="bi bi-grid"></i>
            Dashboard
          </button>

          <button
            className={activePage === "create" ? "active" : ""}
            onClick={() => navigate("/owner/create-tender")}
          >
            <i className="bi bi-plus-circle"></i>
            Create Tender
          </button>

          <button
            className={activePage === "tender-details" ? "active" : ""}
            onClick={() => navigate("/owner/tender-details")}
          >
            <i className="bi bi-file-earmark-text"></i>
            Tender Details
          </button>

          <button
            className={activePage === "evaluation" ? "active" : ""}
            onClick={() => navigate("/owner/evaluation")}
          >
            <i className="bi bi-bar-chart"></i>
            Evaluation
          </button>

          <button
            className={activePage === "ai-analysis" ? "active" : ""}
            onClick={() => navigate("/owner/ai-analysis")}
          >
            <i className="bi bi-cpu"></i>
            AI Analysis
          </button>

          {/* <button
            className={activePage === "document-chat" ? "active" : ""}
            onClick={() => navigate("/owner/document-chat")}
          >
            <i className="bi bi-chat-left"></i>
            Document Chat
          </button> */}

          <button
            className={activePage === "reports" ? "active" : ""}
            onClick={() => navigate("/owner/reports")}
          >
            <i className="bi bi-download"></i>
            Reports
          </button>
        </nav>

        <div className="sidebar-bottom">
          {/* <button
            className={activePage === "notifications" ? "active" : ""}
            onClick={() => navigate("/owner/notifications")}
          >
            <i className="bi bi-bell"></i>
            Notifications
            <span>4</span>
          </button> */}

          {/* <button>
            <i className="bi bi-gear"></i>
            Settings
          </button> */}

          <div className="profile-wrapper">
            {profileMenuOpen && (
              <button className="signout-btn" onClick={handleSignOut}>
                <i className="bi bi-box-arrow-left"></i>
                Sign Out
              </button>
            )}

            <button
              className="owner-profile profile-click"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
<div className="avatar">{userInitials}</div>
<div>
  <h6>{userName}</h6>
  <p>{companyName}</p>
</div>
              <i className="bi bi-chevron-down ms-auto"></i>
            </button>
          </div>
        </div>
      </aside>

      <main className="owner-main">
        <header className="owner-topbar">
          <button
            className="menu-btn"
            onClick={() => setSidebarOpen(!sidebarOpen)}
          >
            <i className="bi bi-list"></i>
          </button>

          <div className="search-box">
            <i className="bi bi-search"></i>
            <input placeholder="Search tenders, contractors..." />
          </div>

          <div className="topbar-actions">
            {/* <button
              className="notification-icon-btn"
              onClick={() => navigate("/owner/notifications")}
            >
              <i className="bi bi-bell"></i>
              <span></span>
            </button> */}

            <button
              className="top-avatar-btn"
              onClick={() => navigate("/owner/dashboard")}
            >
<div className="avatar">{userInitials}</div>
            </button>
          </div>
        </header>

        <div
          className={`owner-page-wrapper ${
            activePage === "document-chat" ? "no-page-padding" : ""
          }`}
        >
          {" "}
          {children}
        </div>
      </main>
    </div>
  );
}

export default OwnerLayout;
