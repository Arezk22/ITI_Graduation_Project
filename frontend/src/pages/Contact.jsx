import PageHeader from "../components/PageHeader";

function Contact() {
  return (
    <>
      <PageHeader
        title="Contact Us"
        description="Have questions about BuildTender AI? Reach out to the project team."
      />

      <div className="container">
        <div className="page-card">
          <h3>Email</h3>
          <p>support@buildtender.ai</p>

          <h3>Project Team</h3>
          <p>
            BuildTender AI Graduation Project Team — ITI Full Stack Development
            Track.
          </p>

          <h3>Location</h3>
          <p>Cairo, Egypt</p>
        </div>
      </div>
    </>
  );
}

export default Contact;