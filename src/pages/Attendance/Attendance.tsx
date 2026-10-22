import { useRef, useState, type ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useAttendanceTracker, { type AttendanceTrackee } from "../../hooks/useAttendanceTracker";
import useAttendanceImport from "../../hooks/useAttendanceImport";
import AttendanceCard from "../../components/attendance/AttendanceCard";
import AttendanceImportModal from "../../components/attendance/AttendanceImportModal";
import { useCurrentUserName } from "../../auth/authContext";

const MEMBERS_COLLECTION_NAME = "members";
const MEMBERS_ATTENDANCE_COLLECTION_NAME = "membersAttendance";

function mapMemberTrackee(id: string, data: Record<string, unknown>): AttendanceTrackee | null {
  // Archived members are hidden. Filtered here rather than with a Firestore
  // where("isArchived", "==", false), because that would also drop any member
  // doc that simply doesn't have the field.
  if (data.isArchived === true) return null;

  const fullName = [data.firstName, data.lastName]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();
  if (!fullName) return null;

  return { id, name: fullName, badge: data.isVisitor === true ? "Visitor" : undefined };
}

export default function MembersAttendance() {
  const currentUser = useCurrentUserName();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importOpen, setImportOpen] = useState(false);

  const attendance = useAttendanceTracker({
    trackeeCollectionName: MEMBERS_COLLECTION_NAME,
    attendanceCollectionName: MEMBERS_ATTENDANCE_COLLECTION_NAME,
    mapTrackee: mapMemberTrackee,
  });

  const importer = useAttendanceImport(currentUser);

  function onFileChosen(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow choosing the same file again later
    if (!file) return;
    setImportOpen(true);
    importer.selectFile(file);
  }

  function closeImport() {
    if (importer.step === "importing") return;
    // Reload whenever something may have been written (success or partial failure).
    if (importer.step === "done" || importer.step === "error") attendance.refetch();
    importer.reset();
    setImportOpen(false);
  }

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <AttendanceCard
            title="Attendance Tracker"
            countLabel="member"
            addButtonLabel="Add Member"
            onAdd={() => navigate("/Profile/new")}
            toolbarActions={
              <>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx,.xls"
                  hidden
                  onChange={onFileChosen}
                />
                <button className="attendance-import-btn" onClick={() => fileInputRef.current?.click()}>
                  <i className="fa-solid fa-file-import" aria-hidden="true" /> Import
                </button>
              </>
            }
            {...attendance}
          />
        </div>
      </main>

      {importOpen && <AttendanceImportModal importer={importer} onClose={closeImport} />}
    </div>
  );
}
