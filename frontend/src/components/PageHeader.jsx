import { Link } from "react-router-dom";

function PageHeader({ title, description }) {
  return (
    <section className="legal-hero">
      <div className="container text-center">
        <Link to="/" className="back-home-btn">
          ← Back to Home
        </Link>

        <h1>{title}</h1>
        <p>{description}</p>
      </div>
    </section>
  );
}

export default PageHeader;