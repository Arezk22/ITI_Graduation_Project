import { Link } from "react-router-dom";

function Navbar() {
  return (
    <nav className="navbar navbar-expand-lg bg-white border-bottom py-3">
      <div className="container">
        <a className="navbar-brand d-flex align-items-center gap-2 fw-bold" href="#">
          <span className="brand-icon">
            <i className="bi bi-building"></i>
          </span>
          BuildTender AI
        </a>

        <div className="ms-auto d-flex gap-3 align-items-center">
            <Link to="/signin" className="nav-link text-dark">Sign In</Link>
            <Link to="/signup" className="btn btn-primary">Get Started</Link>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;