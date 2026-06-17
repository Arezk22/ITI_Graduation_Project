import PageHeader from "../components/PageHeader";

function Terms() {
  return (
    <>
      <PageHeader
        title="Terms of Service"
        description="Understand the usage rules and responsibilities when using BuildTender AI."
      />

      <div className="container">
        <div className="page-card">
          <h3>Acceptable Use</h3>
          <p>
            Users may upload tender-related documents, BOQs, proposals, and
            procurement data for AI-assisted analysis.
          </p>

          <h3>AI Recommendations</h3>
          <p>
            AI outputs are designed to support decision-making and should be
            reviewed by qualified professionals before final approval.
          </p>

          <h3>User Responsibility</h3>
          <p>
            Users are responsible for ensuring that uploaded documents are
            accurate, authorized, and legally acceptable.
          </p>
        </div>
      </div>
    </>
  );
}

export default Terms;