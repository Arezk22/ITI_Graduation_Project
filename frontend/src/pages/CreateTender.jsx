

import OwnerLayout from "../components/OwnerLayout";

function CreateTender() {
  return (
    <OwnerLayout activePage="create">
      <section className="create-tender-content">
        <div className="create-tender-header">
          <h2>Create New Tender</h2>
          <p>Fill in the project details to invite contractors to submit proposals.</p>
        </div>

        <div className="tender-steps">
          <div className="step-item active">
            <span>1</span>
            Project Details
          </div>
          <div className="step-line"></div>

          <div className="step-item">
            <span>2</span>
            Budget & Timeline
          </div>
          <div className="step-line"></div>

          <div className="step-item">
            <span>3</span>
            Documents
          </div>
          <div className="step-line"></div>

          <div className="step-item">
            <span>4</span>
            Review & Publish
          </div>
        </div>

        <div className="create-form-card">
          <div className="form-body">
            <h5>Project Information</h5>

            <div className="mb-3">
              <label className="form-label">Project Name *</label>
              <input
                type="text"
                className="form-control create-input"
                placeholder="e.g. Eastfield Tower Complex Phase 2"
              />
            </div>

            <div className="mb-4">
              <label className="form-label">Project Description *</label>
              <textarea
                className="form-control create-textarea"
                placeholder="Describe the scope of work, key deliverables, and any special requirements..."
              ></textarea>
            </div>

            <div className="row g-4">
              <div className="col-md-6">
                <label className="form-label">Project Category *</label>
                <select className="form-select create-input">
                  <option>Select category</option>
                  <option>Residential Construction</option>
                  <option>Commercial Construction</option>
                  <option>Infrastructure</option>
                  <option>Renovation</option>
                </select>
              </div>

              <div className="col-md-6">
                <label className="form-label">Project Location</label>
                <div className="location-input">
                  <i className="bi bi-geo-alt"></i>
                  <input placeholder="City, Country" />
                </div>
              </div>
            </div>

            <div className="criteria-header">
              <label>Evaluation Criteria Weights</label>
              <span>Total: 100%</span>
            </div>

            <div className="criteria-grid">
              <div className="criteria-box">
                <p>Price</p>
                <strong>40</strong>
                <span>%</span>
              </div>

              <div className="criteria-box">
                <p>Technical</p>
                <strong>35</strong>
                <span>%</span>
              </div>

              <div className="criteria-box">
                <p>Experience</p>
                <strong>15</strong>
                <span>%</span>
              </div>

              <div className="criteria-box">
                <p>Compliance</p>
                <strong>10</strong>
                <span>%</span>
              </div>
            </div>
          </div>

          <div className="form-actions">
            <button className="btn back-step-btn">Back</button>
            <button className="btn continue-step-btn">
              Continue <i className="bi bi-chevron-right"></i>
            </button>
          </div>
        </div>
      </section>
    </OwnerLayout>
  );
}

export default CreateTender;