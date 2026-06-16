import PageHeader from "../components/PageHeader";

function Security() {
  return (
    <>
      <PageHeader
        title="Security"
        description="BuildTender AI is designed to protect sensitive tender, contractor, and procurement data."
      />

      <div className="container">
        <div className="page-card">
          <h3>Role-Based Access</h3>
          <p>
            Access to tender documents and analysis results is restricted based
            on user roles and permissions.
          </p>

          <h3>Document Protection</h3>
          <p>
            Uploaded documents are securely stored and isolated to prevent
            unauthorized access between organizations.
          </p>

          <h3>Audit Logging</h3>
          <p>
            Important user actions, document uploads, and AI analysis events are
            logged for transparency and accountability.
          </p>

          <h3>AI Safety</h3>
          <p>
            The platform includes safeguards against prompt injection and
            malicious document manipulation.
          </p>
        </div>
      </div>
    </>
  );
}

export default Security;