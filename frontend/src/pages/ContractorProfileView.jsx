import { useParams } from "react-router-dom";
import OwnerLayout from "../components/OwnerLayout";

function ContractorProfileView() {
  const { contractorId } = useParams();

  return (
    <OwnerLayout activePage="evaluation">
      <section className="evaluation-content">
        <div className="evaluation-header">
          <div>
            <h2>Contractor Profile</h2>
            <p>Contractor ID: {contractorId}</p>
          </div>
        </div>

        <div className="dashboard-card mt-4">
          <h5>Company Overview</h5>
          <p className="text-muted mb-0">
            Contractor profile details will appear here after connecting the
            contractor profile endpoint.
          </p>
        </div>
      </section>
    </OwnerLayout>
  );
}

export default ContractorProfileView;