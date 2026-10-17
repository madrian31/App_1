import { Sidebar } from "../../components/sidebar/Sidebar";

interface ComingSoonProps {
  title: string;
}

// Placeholder for menu items whose page hasn't been built yet, so the
// sidebar link lands somewhere instead of a blank screen.
export default function ComingSoon({ title }: ComingSoonProps) {
  return (
    <div style={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar />
      <main style={{ flex: 1, padding: "2rem", background: "#ededed" }}>
        <h1>{title}</h1>
        <p>This page is coming soon.</p>
      </main>
    </div>
  );
}
