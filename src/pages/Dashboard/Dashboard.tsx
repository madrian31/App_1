import { Sidebar } from "../../components/sidebar/Sidebar";

export default function Dashboard() {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <h1>Dashboard</h1>
        <p>Welcome to your dashboard!</p>
      </main>
    </div>
  );
}