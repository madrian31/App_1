import { Sidebar } from "../../components/sidebar/Sidebar";
import useSundaySchoolAttendance from "../../hooks/useSundaySchoolAttendance";
import PageHeader from "../../components/members/PageHeader";
import SundaySchoolAttendanceToolbar from "../../components/sundaySchool/SundaySchoolAttendanceToolbar";
import SundaySchoolAttendanceTable from "../../components/sundaySchool/SundaySchoolAttendanceTable";
import Toast from "../../components/members/Toast";
import "./sundaySchool.css";

export default function SundaySchoolAttendance() {
  const {
    monthLabel,
    monthsShort,
    viewMonth,
    sundays,
    goPrevMonth,
    goNextMonth,
    goToday,
    loading,
    children,
    totalActiveCount,
    attendance,
    search,
    onSearchChange,
    toast,
    toggleAttendance,
  } = useSundaySchoolAttendance();

  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <div className="page">
          <PageHeader title="Sunday School Attendance" count={totalActiveCount} countLabel="active child" />

          <SundaySchoolAttendanceToolbar
            monthLabel={monthLabel}
            sundayCount={sundays.length}
            onPrevMonth={goPrevMonth}
            onNextMonth={goNextMonth}
            onToday={goToday}
            search={search}
            onSearchChange={onSearchChange}
          />

          <div className="members-card">
            <SundaySchoolAttendanceTable
              children={children}
              loading={loading}
              sundays={sundays}
              monthShortLabel={monthsShort[viewMonth]}
              attendance={attendance}
              onToggle={toggleAttendance}
            />
          </div>

          <Toast message={toast} />
        </div>
      </main>
    </div>
  );
}
