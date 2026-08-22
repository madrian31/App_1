import { useNavigate } from "react-router-dom";
import { Sidebar } from "../../components/sidebar/Sidebar";
import useAttendanceTracker, { type AttendanceTrackee } from "../../hooks/useAttendanceTracker";
import AttendanceCard from "../../components/attendance/AttendanceCard";

const MEMBERS_COLLECTION_NAME = "members";
const MEMBERS_ATTENDANCE_COLLECTION_NAME = "membersAttendance";

function mapMemberTrackee(id: string, data: Record<string, unknown>): AttendanceTrackee | null {
  // TEMP DEBUG: log every raw doc so we can see the actual field names/values.
  console.log("MEMBERS doc:", id, data);

  const fullName = [data.firstName, data.lastName]
    .filter((part): part is string => typeof part === "string" && part.trim().length > 0)
    .join(" ")
    .trim();
  return fullName ? { id, name: fullName } : null;
}

export default function MembersAttendance() {
  const navigate = useNavigate();

  const attendance = useAttendanceTracker({
    trackeeCollectionName: MEMBERS_COLLECTION_NAME,
    attendanceCollectionName: MEMBERS_ATTENDANCE_COLLECTION_NAME,
    // TEMP DEBUG: isArchived filter removed — put it back once field names are confirmed.
    trackeeQueryConstraints: [],
    mapTrackee: mapMemberTrackee,
  });

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
            {...attendance}
          />
        </div>
      </main>
    </div>
  );
}