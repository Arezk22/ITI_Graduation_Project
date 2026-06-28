import PageHeader from "../components/PageHeader";

function Privacy() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="Learn how BuildTender AI protects user information and tender documents."
      />

      <div className="container">
        <div className="page-card">
          <h3>Data Collection</h3>
          <p>
            BuildTender AI collects user account information and uploaded tender
            documents only for analysis, evaluation, and procurement workflow
            support.
          </p>

          <h3>Document Privacy</h3>
          <p>
            Uploaded tender files, BOQs, contracts, and technical documents are
            treated as confidential project data.
          </p>

          <h3>Third-Party Sharing</h3>
          <p>
            BuildTender AI does not sell or share user data with third parties
            without permission.
          </p>
        </div>
      </div>
    </>
  );
}

export default Privacy;