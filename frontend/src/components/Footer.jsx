import { Link } from "react-router-dom";


function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-content">

        <div className="footer-brand d-flex align-items-center gap-2 fw-bold">
            <span className="brand-icon">
                <i className="bi bi-building"></i>
            </span>
            BuildTender AI
        </div>
        <div className="footer-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms of Service</Link>
            <Link to="/security">Security</Link>
            <Link to="/contact">Contact</Link>
        </div>

        <p className="mb-0">© 2026 BuildTender AI. All rights reserved.</p>
      </div>
    </footer>
  );
}

export default Footer;