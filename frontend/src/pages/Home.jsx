import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import FeatureCard from "../components/FeatureCard";
import Footer from "../components/Footer";
import { Link } from "react-router-dom";

function Home() {
  return (
    <>
      <Navbar />
      <Hero />

      <section className="stats-section">
        <div className="container">
          <div className="row text-center">
            <div className="col-md-3 stat-item">
              <h3>2,400+</h3>
              <p>Tenders Processed</p>
            </div>
            <div className="col-md-3 stat-item">
              <h3>94%</h3>
              <p>Evaluation Accuracy</p>
            </div>
            <div className="col-md-3 stat-item">
              <h3>340+</h3>
              <p>Contractors Rated</p>
            </div>
            <div className="col-md-3 stat-item">
              <h3>68%</h3>
              <p>Time Saved vs Manual</p>
            </div>
          </div>
        </div>
      </section>

      <section className="features-section">
        <div className="container">
          <div className="text-center mb-5">
            <h2>Everything you need for smarter procurement</h2>
            <p>Built specifically for construction project owners, procurement teams, and contractors.</p>
          </div>

          <div className="row g-4">
            <FeatureCard
              icon="bi-cpu"
              title="AI-Powered Evaluation"
              text="Automatically score and rank contractor submissions using machine learning models trained on construction procurement data."
            />
            <FeatureCard
              icon="bi-shield-check"
              title="Risk Intelligence"
              text="Detect anomalies, suspicious pricing patterns, and high-risk submissions before they cost your project."
            />
            <FeatureCard
              icon="bi-bar-chart"
              title="Multi-Criteria Scoring"
              text="Evaluate contractors on price, technical quality, trust score, experience, and compliance -- all in one dashboard."
            />
            <FeatureCard
              icon="bi-file-earmark-text"
              title="Document Intelligence"
              text="Chat with your tender documents, extract key clauses, and get AI-generated summaries of BOQs and specifications."
            />
            <FeatureCard
              icon="bi-people"
              title="Contractor Trust Network"
              text="Build a verified network of pre-qualified contractors with performance histories and trust scores."
            />
            <FeatureCard
              icon="bi-lightning-charge"
              title="End-to-End Workflow"
              text="From tender creation to award letter, manage the entire procurement lifecycle in a single platform."
            />
          </div>
        </div>
      </section>

      <section className="how-section">
        <div className="container text-center">
          <h2>How BuildTender AI works</h2>
          <p>From tender creation to contractor award in four streamlined steps.</p>

          <div className="row mt-5">
            <div className="col-md-3 step">
              <span>01</span>
              <i className="bi bi-file-earmark-plus"></i>
              <h5>Create Tender</h5>
              <p>Upload BOQs, drawings, and specifications. set evaluation criteria and deadlines.</p>
            </div>
            <div className="col-md-3 step">
              <span>02</span>
              <i className="bi bi-inbox"></i>
              <h5>Receive Submissions</h5>
              <p>Contractors submit technical and financial proposals through a structured portal.</p>
            </div>
            <div className="col-md-3 step">
              <span>03</span>
              <i className="bi bi-cpu"></i>
              <h5>AI Evaluation</h5>
              <p>Our AI scores, compares, and flags risk factors across all submissions instantly.</p>
            </div>
            <div className="col-md-3 step">
              <span>04</span>
              <i className="bi bi-award"></i>
              <h5>Award with Confidence</h5>
              <p>Export ranked reports, generate award letters, and track contractor performance.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-box">
          <h2>Ready to transform your tender process?</h2>
          <p>Join project owners and contractors already using BuildTender AI.</p>

          <div className="cta-buttons">
            {/* <a href="#" className="btn cta-primary-btn">Start Now</a> */}
            <Link to="/signup" className="btn cta-secondary-btn">Get Started</Link>
            <Link to="/signin" className="btn cta-secondary-btn">Sign In</Link>
    </div>
        </div>
      </section>

      <Footer />
    </>
  );
}

export default Home;