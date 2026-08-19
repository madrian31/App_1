import { Sidebar } from "../../components/sidebar/Sidebar";
import useLookupLists from "../../hooks/useLookupLists";
import useThemePresets from "../../hooks/useThemePresets";
import { LOOKUP_LISTS } from "../../types/lookupList";
import LookupListEditor from "../../components/settings/LookupListEditor";
import ThemePresetEditor from "../../components/settings/ThemePresetEditor";
import "./settings.css";

export default function ManageLists() {
  const { lists, loading, savingKey, error, addValue, removeValue, renameValue } = useLookupLists();
  const themePresets = useThemePresets();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <div className="page-header">
            <div className="page-header-left">
              <h1>Manage Lists</h1>
              <p>Edit the dropdown options used across Members and other forms.</p>
            </div>
          </div>

          {error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {error}
            </div>
          )}

          {themePresets.error && (
            <div className="modal-error visit-form-error">
              <i className="fa-solid fa-circle-exclamation" aria-hidden="true" />
              {themePresets.error}
            </div>
          )}

          {loading ? (
            <p>Loading lists…</p>
          ) : (
            <div className="lookup-lists-grid">
              {LOOKUP_LISTS.map((l) => (
                <div className="members-card lookup-list-card" key={l.key}>
                  <LookupListEditor
                    label={l.label}
                    values={lists[l.key]}
                    saving={savingKey === l.key}
                    onAdd={(value) => addValue(l.key, value)}
                    onRemove={(value) => removeValue(l.key, value)}
                    onRename={(oldValue, newValue) => renameValue(l.key, oldValue, newValue)}
                  />
                </div>
              ))}

              <div className="members-card lookup-list-card">
                <ThemePresetEditor
                  presets={themePresets.presets}
                  saving={themePresets.saving}
                  onAdd={themePresets.add}
                  onEdit={themePresets.edit}
                  onRemove={themePresets.remove}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}