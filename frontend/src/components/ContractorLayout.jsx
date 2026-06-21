import { useState } from "react";
import { useNavigate } from "react-router-dom";

function ContractorLayout({ activePage, children }) {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  const handleSignOut = () => {
    navigate("/");
  };

  return (
    <div className={`owner-layout ${sidebarOpen ? "" : "sidebar-collapsed"}`}>
      <aside className="owner-sidebar">
        <div className="sidebar-brand" onClick={() => navigate("/contractor/dashboard")}>
          <span className="brand-icon">
            <i className="bi bi-building"></i>
          </span>
          <div>
            <h5>BuildTender</h5>
            <p>AI Platform</p>
          </div>
        </div>

        <span className="owner-badge">Contractor</span>

        <nav className="sidebar-menu">
          <button
            className={activePage === "dashboard" ? "active" : ""}
            onClick={() => navigate("/contractor/dashboard")}
          >
            <i className="bi bi-grid"></i>
            Dashboard
          </button>

          <button
            className={activePage === "submit-proposal" ? "active" : ""}
            onClick={() => navigate("/contractor/submit-proposal")}
          >
            <i className="bi bi-clipboard-check"></i>
            Submit Proposal
          </button>

          <button
            className={activePage === "profile" ? "active" : ""}
            onClick={() => navigate("/contractor/profile")}
          >
            <i className="bi bi-star"></i>
            My Profile
          </button>

          <button
            className={activePage === "document-chat" ? "active" : ""}
            onClick={() => navigate("/contractor/document-chat")}
          >
            <i className="bi bi-chat-left"></i>
            Document Chat
          </button>

        </nav>

        <div className="sidebar-bottom">
          <button
            className={activePage === "notifications" ? "active" : ""}
            onClick={() => navigate("/contractor/notifications")}
          >
            <i className="bi bi-bell"></i>
            Notifications
            <span>4</span>
          </button>

          <button>
            <i className="bi bi-gear"></i>
            Settings
          </button>

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
              <div className="avatar">RA</div>
              <div>
                <h6>Rania Al-Hassan</h6>
                <p>AlSalam Construction</p>
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
            <button
              className="notification-icon-btn"
              onClick={() => navigate("/contractor/notifications")}
            >
              <i className="bi bi-bell"></i>
              <span></span>
            </button>

            <button
              className="top-avatar-btn"
              onClick={() => navigate("/contractor/dashboard")}
            >
              <div className="avatar">RA</div>
            </button>
          </div>
        </header>

        <div className="owner-page-wrapper">
          {children}
        </div>
      </main>
    </div>
  );
}

export default ContractorLayout;