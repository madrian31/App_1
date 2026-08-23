import { useRef, useState } from "react";
import useMemberImport from "../../hooks/useMemberImport";
import useAnniversaryImport from "../../hooks/useAnniversaryImport";
import useDateRepair from "../../hooks/useDateRepair";
import { getAllMembers } from "../../services/members/memberService/membersService";
import { exportMembersToFile } from "../../services/members/memberService/memberImportExport";
import ImportPreviewModal from "./ImportPreviewModal";
import AnniversaryImportPreviewModal from "../calendar/AnniversaryImportPreviewModal";
import DateRepairModal from "./DateRepairModal";

interface ImportExportBarProps {
  currentUser: string;
  onImported: () => void;
}

export default function ImportExportBar({ currentUser, onImported }: ImportExportBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const repairFileInputRef = useRef<HTMLInputElement>(null);

  const importState = useMemberImport();
  const anniversaryImport = useAnniversaryImport();
  const repairState = useDateRepair();

  const [showModal, setShowModal] = useState(false);
  const [showAnniversaryModal, setShowAnniversaryModal] = useState(false);
  const [showRepairModal, setShowRepairModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [exporting, setExporting] = useState(false);

  function handleImportClick() {
    fileInputRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setPendingFile(file);
    setShowModal(true);
    await importState.selectFile(file);
  }

  async function handleMembersImported() {
    onImported();
    setShowModal(false);

    if (pendingFile) {
      const found = await anniversaryImport.selectFile(pendingFile);
      if (found) setShowAnniversaryModal(true);
      setPendingFile(null);
    }
  }

  function handleRepairClick() {
    repairFileInputRef.current?.click();
  }
  async function handleRepairFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setShowRepairModal(true);
    await repairState.scanFile(file);
  }

  async function handleExportClick() {
    setExporting(true);
    try {
      const members = await getAllMembers();
      exportMembersToFile(members.filter((m) => !m.isArchived));
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="import-export-bar">
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileChange} />
      <input ref={repairFileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleRepairFileChange} />

      <button className="btn-secondary" onClick={handleImportClick}>
        <i className="fa-solid fa-file-import" aria-hidden="true" />
        Import
      </button>
      <button className="btn-secondary" onClick={handleExportClick} disabled={exporting}>
        <i className={`fa-solid ${exporting ? "fa-spinner fa-spin" : "fa-file-export"}`} aria-hidden="true" />
        {exporting ? "Exporting…" : "Export"}
      </button>
      <button className="btn-secondary" onClick={handleRepairClick} title="One-time fix for dates imported before the timezone bug fix">
        <i className="fa-solid fa-wrench" aria-hidden="true" />
        Fix Dates
      </button>

      {showModal && (
        <ImportPreviewModal importState={importState} currentUser={currentUser} onClose={() => setShowModal(false)} onImported={handleMembersImported} />
      )}
      {showAnniversaryModal && (
        <AnniversaryImportPreviewModal importState={anniversaryImport} onClose={() => setShowAnniversaryModal(false)} onImported={onImported} />
      )}
      {showRepairModal && (
        <DateRepairModal repairState={repairState} onClose={() => setShowRepairModal(false)} onRepaired={onImported} />
      )}
    </div>
  );
}