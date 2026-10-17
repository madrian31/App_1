import { useEffect, useRef, useState } from "react";
import type { Member } from "../../types/member";
import useMemberImport from "../../hooks/useMemberImport";
import useAnniversaryImport from "../../hooks/useAnniversaryImport";
import { getAllMembers } from "../../services/members/memberService/membersService";
import { exportMembersToFile } from "../../services/members/memberService/memberImportExport";
import { exportMembersToPdf } from "../../services/members/memberService/memberPdfExport";
import ImportPreviewModal from "./ImportPreviewModal";
import AnniversaryImportPreviewModal from "../calendar/AnniversaryImportPreviewModal";

interface ImportExportBarProps {
  currentUser: string;
  onImported: () => void;
  /** Members for the PDF export — the list as currently filtered on the page.
   *  When omitted, the PDF option is hidden. */
  pdfMembers?: Member[];
}

export default function ImportExportBar({ currentUser, onImported, pdfMembers }: ImportExportBarProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const importState = useMemberImport();
  const anniversaryImport = useAnniversaryImport();

  const [showModal, setShowModal] = useState(false);
  const [showAnniversaryModal, setShowAnniversaryModal] = useState(false);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [exporting, setExporting] = useState(false);
  const [exportMenuOpen, setExportMenuOpen] = useState(false);
  const exportMenuRef = useRef<HTMLDivElement>(null);

  // Close the export menu on outside click or Escape.
  useEffect(() => {
    if (!exportMenuOpen) return;
    function onPointerDown(e: PointerEvent) {
      if (!exportMenuRef.current?.contains(e.target as Node)) setExportMenuOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setExportMenuOpen(false);
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [exportMenuOpen]);

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

  async function handleExportClick() {
    setExportMenuOpen(false);
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

  async function handleExportPdfClick() {
    if (!pdfMembers || pdfMembers.length === 0) return;
    setExportMenuOpen(false);
    setExporting(true);
    try {
      await exportMembersToPdf(pdfMembers);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setExporting(false);
    }
  }

  const pdfCount = pdfMembers?.length ?? 0;

  return (
    <div className="import-export-bar">
      <input ref={fileInputRef} type="file" accept=".xlsx,.xls" style={{ display: "none" }} onChange={handleFileChange} />

      <button className="btn-secondary" onClick={handleImportClick}>
        <i className="fa-solid fa-file-import" aria-hidden="true" />
        Import
      </button>
      {pdfMembers ? (
        <div className="export-menu-wrap" ref={exportMenuRef}>
          <button
            className="btn-secondary"
            onClick={() => setExportMenuOpen((o) => !o)}
            disabled={exporting}
            aria-haspopup="menu"
            aria-expanded={exportMenuOpen}
          >
            <i className={`fa-solid ${exporting ? "fa-spinner fa-spin" : "fa-file-export"}`} aria-hidden="true" />
            {exporting ? "Exporting…" : "Export"}
            {!exporting && <i className="fa-solid fa-chevron-down export-menu-caret" aria-hidden="true" />}
          </button>

          {exportMenuOpen && (
            <div className="export-menu" role="menu">
              <button type="button" role="menuitem" className="export-menu-item" onClick={handleExportClick}>
                <i className="fa-solid fa-file-excel" aria-hidden="true" />
                <span>
                  <strong>Excel (.xlsx)</strong>
                  <small>All active members, re-importable</small>
                </span>
              </button>
              <button
                type="button"
                role="menuitem"
                className="export-menu-item"
                onClick={handleExportPdfClick}
                disabled={pdfCount === 0}
              >
                <i className="fa-solid fa-file-pdf" aria-hidden="true" />
                <span>
                  <strong>PDF — one member per page</strong>
                  <small>
                    {pdfCount === 0 ? "No members in the current list" : `${pdfCount} member${pdfCount === 1 ? "" : "s"} in the current list`}
                  </small>
                </span>
              </button>
            </div>
          )}
        </div>
      ) : (
        <button className="btn-secondary" onClick={handleExportClick} disabled={exporting}>
          <i className={`fa-solid ${exporting ? "fa-spinner fa-spin" : "fa-file-export"}`} aria-hidden="true" />
          {exporting ? "Exporting…" : "Export"}
        </button>
      )}

      {showModal && (
        <ImportPreviewModal importState={importState} currentUser={currentUser} onClose={() => setShowModal(false)} onImported={handleMembersImported} />
      )}
      {showAnniversaryModal && (
        <AnniversaryImportPreviewModal importState={anniversaryImport} onClose={() => setShowAnniversaryModal(false)} onImported={onImported} />
      )}
    </div>
  );
}