import OwnerLayout from "../components/OwnerLayout";

function ContractorProfile() {
  const projects = [
    ["Riverside Commercial Park", "Commercial", "$5.5M", "Completed May 2026", "94/100"],
    ["Al Noor Medical Extension", "Healthcare", "$3.2M", "Completed Feb 2026", "91/100"],
    ["Westside Logistics Hub", "Industrial", "$4.1M", "Completed Nov 2025", "88/100"],
    ["Harbor View Residences", "Residential", "$6.8M", "Completed Jun 2025", "92/100"],
    ["Central Tower Phase 1", "Commercial", "$9.2M", "Completed Jan 2025", "86/100"],
  ];

  return (
    <OwnerLayout activePage="evaluation">
      <section className="contractor-profile-content">
        <div className="contractor-hero-card">
          <div className="contractor-main-info">
            <div className="contractor-avatar">A</div>

            <div>
              <h2>AlSalam Construction</h2>

              <div className="contractor-meta">
                <span><i className="bi bi-geo-alt"></i> Dubai, UAE</span>
                <span><i className="bi bi-building"></i> Est. 2012</span>
                <span><i className="bi bi-currency-dollar"></i> $4.2M avg project value</span>
              </div>

              <div className="contractor-contact">
                <span><i className="bi bi-envelope"></i> rania@alsalam-construction.ae</span>
                <span><i className="bi bi-telephone"></i> +971 4 XXX XXXX</span>
                <span><i className="bi bi-globe"></i> alsalam-construction.ae</span>
              </div>
            </div>
          </div>

          <div className="trust-score-box">
            <h3><i className="bi bi-star-fill"></i> 88 <span>/100</span></h3>
            <p>Trust Score</p>
            <small>↑ +2 this month</small>
          </div>

          <div className="contractor-stats">
            <div>
              <h3>47</h3>
              <p>Projects Completed</p>
            </div>

            <div>
              <h3>$142M+</h3>
              <p>Total Project Value</p>
            </div>

            <div>
              <h3>64%</h3>
              <p>Win Rate</p>
            </div>

            <div>
              <h3>91/100</h3>
              <p>Avg Delivery Score</p>
            </div>
          </div>
        </div>

        <div className="row g-4 mt-1">
          <div className="col-lg-8">
            <div className="dashboard-card profile-chart-card">
              <div className="card-header-clean">
                <h5>Trust Score History</h5>
                <span className="trend-badge">Trending Up ↑</span>
              </div>

              <div className="trust-chart">
                <svg viewBox="0 0 700 220" preserveAspectRatio="none">
                  <polyline
                    points="20,155 140,140 260,130 380,105 500,120 620,95 680,85"
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="4"
                  />
                  <circle cx="20" cy="155" r="5" fill="#2563eb" />
                  <circle cx="140" cy="140" r="5" fill="#2563eb" />
                  <circle cx="260" cy="130" r="5" fill="#2563eb" />
                </svg>

                <div className="chart-months">
                  <span>Dec</span>
                  <span>Jan</span>
                  <span>Feb</span>
                  <span>Mar</span>
                  <span>Apr</span>
                  <span>May</span>
                  <span>Jun</span>
                </div>
              </div>
            </div>
          </div>

          <div className="col-lg-4">
            <div className="dashboard-card certification-card">
              <h5><i className="bi bi-shield-check text-primary"></i> Certifications</h5>

              {[
                "ISO 9001:2015 Quality Management",
                "ISO 45001:2018 Occupational Health",
                "Green Building LEED Silver",
                "UAE Trade License",
                "CIDB Grade 7 Registration",
              ].map((cert) => (
                <div className="cert-row" key={cert}>
                  <i className="bi bi-check-circle"></i>
                  <div>
                    <strong>{cert}</strong>
                    <p>Expires Dec 2026</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="dashboard-card mt-4">
          <div className="card-header-clean">
            <h5>Previous Projects</h5>
            <p className="mb-0 text-muted">Showing 5 of 47</p>
          </div>

          <div className="profile-projects-list">
            {projects.map((p) => (
              <div className="profile-project-row" key={p[0]}>
                <div>
                  <h5>
                    {p[0]} <span>{p[1]}</span>
                  </h5>
                  <p>
                    <i className="bi bi-currency-dollar"></i> {p[2]}{" "}
                    <i className="bi bi-calendar ms-2"></i> {p[3]}
                  </p>
                </div>

                <div className="project-score">
                  <strong>{p[4]}</strong>
                  <p>Client Score</p>
                </div>

                <span className="completed-badge">Completed</span>
              </div>
            ))}
          </div>
        </div>

        <div className="dashboard-card mt-4">
          <h5 className="mb-4 fw-bold">Annual Tender Win Rate</h5>

          <div className="annual-chart">
            {[2022, 2023, 2024, 2025, 2026].map((year, i) => (
              <div className="annual-group" key={year}>
                <div className="annual-bars">
                  <span className="annual-bg" style={{ height: `${[70, 90, 100, 70, 35][i]}%` }}></span>
                  <span className="annual-blue" style={{ height: `${[40, 55, 65, 50, 25][i]}%` }}></span>
                </div>
                <p>{year}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </OwnerLayout>
  );
}

export default ContractorProfile;