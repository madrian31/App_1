import type { Member } from "../../../types/member";
import { formatDisplayDate, toLocalISODate } from "../../../utils/date";

// A4 portrait, in millimetres.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

const BRAND: [number, number, number] = [59, 91, 253]; // --primary (#3b5bfd) in members.css
const TEXT: [number, number, number] = [31, 31, 31];
const MUTED: [number, number, number] = [107, 114, 128];
const RULE: [number, number, number] = [229, 231, 235];

function computeAge(birthday?: string): string {
  if (!birthday) return "";
  const b = new Date(`${birthday}T00:00:00`);
  if (isNaN(b.getTime())) return "";
  const now = new Date();
  let age = now.getFullYear() - b.getFullYear();
  if (now.getMonth() < b.getMonth() || (now.getMonth() === b.getMonth() && now.getDate() < b.getDate())) age--;
  return age >= 0 ? String(age) : "";
}

function fullName(m: Member): string {
  const mi = m.middleInitial?.trim();
  return [m.firstName, mi ? (mi.endsWith(".") ? mi : `${mi}.`) : "", m.lastName].filter(Boolean).join(" ");
}

function initials(m: Member): string {
  return `${m.firstName?.[0] ?? ""}${m.lastName?.[0] ?? ""}`.toUpperCase();
}

type Field = [label: string, value: string];

function sections(m: Member): { title: string; fields: Field[] }[] {
  return [
    {
      title: "Basic Information",
      fields: [
        ["Last Name", m.lastName],
        ["First Name", m.firstName],
        ["Middle Initial", m.middleInitial],
        ["Gender", m.gender],
        ["Birthday", formatDisplayDate(m.birthday)],
        ["Age", computeAge(m.birthday)],
        ["Date of Baptism", formatDisplayDate(m.dateOfBaptism)],
        ["Wedding Anniversary", formatDisplayDate(m.weddingAnniversary)],
      ],
    },
    {
      title: "Church Information",
      fields: [
        ["Department", m.category ?? ""],
        ["Status", m.status ?? ""],
        ["Ministry", m.ministry ?? ""],
        ["Small Group", m.isSmallGroupLeader ? "Leader" : ""],
        ["US2CG Level", m.us2cgLevel ?? ""],
        ["Facebook Name", m.facebookName ?? ""],
        ["Pledger", m.isPledger ? "Yes" : "No"],
        ["Date Added", formatDisplayDate(m.dateAdded)],
      ],
    },
  ];
}

/**
 * Downloads a PDF with one member profile per page, in the order given.
 * jsPDF is loaded on demand so it isn't part of the main bundle.
 */
export async function exportMembersToPdf(members: Member[], filename?: string): Promise<void> {
  if (members.length === 0) return;
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const generated = formatDisplayDate(toLocalISODate(new Date()));

  members.forEach((m, index) => {
    if (index > 0) doc.addPage();

    // ── Header band ──
    doc.setFillColor(...BRAND);
    doc.rect(0, 0, PAGE_W, 34, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.text("LINK Up", MARGIN, 15);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text("Member Profile", MARGIN, 22);

    // ── Name block ──
    let y = 50;
    const avatarR = 9;
    doc.setFillColor(...BRAND);
    doc.circle(MARGIN + avatarR, y, avatarR, "F");
    doc.setTextColor(255, 255, 255);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.text(initials(m), MARGIN + avatarR, y + 1.5, { align: "center" });

    const nameX = MARGIN + avatarR * 2 + 6;
    doc.setTextColor(...TEXT);
    doc.setFontSize(18);
    doc.text(fullName(m) || "—", nameX, y - 1);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...MUTED);
    const sub = [m.category, m.status].filter(Boolean).join("  ·  ");
    if (sub) doc.text(sub, nameX, y + 6);

    y += avatarR + 12;

    // ── Sections: two-column label/value grid ──
    const colW = CONTENT_W / 2;
    for (const section of sections(m)) {
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...BRAND);
      doc.text(section.title.toUpperCase(), MARGIN, y);
      y += 2.5;
      doc.setDrawColor(...RULE);
      doc.setLineWidth(0.3);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 7;

      for (let i = 0; i < section.fields.length; i += 2) {
        let rowH = 0;
        for (let c = 0; c < 2; c++) {
          const field = section.fields[i + c];
          if (!field) continue;
          const [label, value] = field;
          const x = MARGIN + c * colW;
          doc.setFont("helvetica", "normal");
          doc.setFontSize(8);
          doc.setTextColor(...MUTED);
          doc.text(label.toUpperCase(), x, y);
          doc.setFontSize(11);
          doc.setTextColor(...TEXT);
          const lines = doc.splitTextToSize(value?.trim() || "—", colW - 6) as string[];
          doc.text(lines, x, y + 5.5);
          rowH = Math.max(rowH, 5.5 + lines.length * 5);
        }
        y += rowH + 5;
      }
      y += 6;
    }

    // ── Footer ──
    doc.setDrawColor(...RULE);
    doc.line(MARGIN, PAGE_H - 16, PAGE_W - MARGIN, PAGE_H - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Generated ${generated}`, MARGIN, PAGE_H - 10);
    doc.text(`Page ${index + 1} of ${members.length}`, PAGE_W - MARGIN, PAGE_H - 10, { align: "right" });
  });

  doc.save(filename ?? `members-${toLocalISODate(new Date())}.pdf`);
}
