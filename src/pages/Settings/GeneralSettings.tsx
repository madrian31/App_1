import { Sidebar } from "../../components/sidebar/Sidebar";
import StartingBalanceEditor from "../../components/settings/StartingBalanceEditor";
import useGeneralFundSettings from "../../hooks/useGeneralFundSettings";
import { useCurrentUserName } from "../../auth/authContext";
import "./settings.css";

export default function GeneralSettings() {
  const currentUser = useCurrentUserName();
  const fund = useGeneralFundSettings(currentUser);

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>General Settings</h1>
              <p>App-wide settings, such as the church's General Fund starting balance.</p>
            </div>
          </div>

          {fund.error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {fund.error}
            </div>
          )}

          <div className="lookup-lists-grid">
            <div className="members-card lookup-list-card">
              <StartingBalanceEditor
                loading={fund.loading}
                startingBalance={fund.startingBalance}
                isSet={fund.isSet}
                modifiedBy={fund.modifiedBy}
                dateModified={fund.dateModified}
                saving={fund.saving}
                onSave={fund.saveStartingBalance}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
