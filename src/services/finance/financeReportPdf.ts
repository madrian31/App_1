import type { FinanceCategoryRow, FinanceMonthRow, FinanceSundayRow } from "../../hooks/useFinanceReport";
import { formatDisplayDate, toLocalISODate } from "../../utils/date";

// A4 portrait, in millimetres — same layout constants as memberPdfExport.ts.
const PAGE_W = 210;
const PAGE_H = 297;
const MARGIN = 18;
const CONTENT_W = PAGE_W - MARGIN * 2;

const BRAND: [number, number, number] = [59, 91, 253];
const TEXT: [number, number, number] = [31, 31, 31];
const MUTED: [number, number, number] = [107, 114, 128];
const RULE: [number, number, number] = [229, 231, 235];

// jsPDF's built-in fonts can't draw "₱", so the PDF spells it out.
function peso(n: number): string {
  return "PHP " + n.toLocaleString("en-PH", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

export interface FinanceReportPdfData {
  year: number;
  monthLabel: string;
  fundBalance: number;
  openingBalance: number;
  openingDate: string;
  monthTithes: number;
  ytdTithes: number;
  monthExpenses: number;
  yearTithes: number;
  months: FinanceMonthRow[];
  sundays: FinanceSundayRow[];
  expenseCategories: FinanceCategoryRow[];
}

/** Downloads the Finance Report as a one-to-two page PDF. jsPDF is loaded on demand. */
export async function exportFinanceReportPdf(data: FinanceReportPdfData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const doc = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
  const generated = formatDisplayDate(toLocalISODate(new Date()));

  // ── Header band ──
  doc.setFillColor(...BRAND);
  doc.rect(0, 0, PAGE_W, 34, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(16);
  doc.text("LINK Up", MARGIN, 15);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text(`Finance Report — General Fund · ${data.monthLabel}`, MARGIN, 22);

  let y = 48;

  // ── KPI boxes ──
  const kpis: [string, string][] = [
    ["General Fund Balance", peso(data.fundBalance)],
    [`Tithes — ${data.monthLabel}`, peso(data.monthTithes)],
    [`Tithes — YTD ${data.year}`, peso(data.ytdTithes)],
    [`Expenses — ${data.monthLabel}`, peso(data.monthExpenses)],
  ];
  const boxW = (CONTENT_W - 6) / 2;
  kpis.forEach(([label, value], i) => {
    const x = MARGIN + (i % 2) * (boxW + 6);
    const by = y + Math.floor(i / 2) * 24;
    doc.setDrawColor(...RULE);
    doc.setLineWidth(0.3);
    doc.roundedRect(x, by, boxW, 20, 2, 2, "S");
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(label.toUpperCase(), x + 4, by + 7);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...TEXT);
    doc.text(value, x + 4, by + 15);
  });
  y += 52;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...MUTED);
  const openingNote = data.openingDate
    ? `Opening balance ${peso(data.openingBalance)} as of ${formatDisplayDate(data.openingDate)}.`
    : `Opening balance ${peso(data.openingBalance)}.`;
  doc.text(`${openingNote} Balance = opening balance + tithes - expenses.`, MARGIN, y);
  y += 10;

  // ── Tables ──
  function sectionTitle(title: string) {
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.setTextColor(...BRAND);
    doc.text(title.toUpperCase(), MARGIN, y);
    y += 2.5;
    doc.setDrawColor(...RULE);
    doc.line(MARGIN, y, PAGE_W - MARGIN, y);
    y += 6;
  }

  function table(cols: { label: string; width: number; right?: boolean }[], rows: string[][], bold?: string[]) {
    const draw = (cells: string[], header: boolean, strong: boolean) => {
      if (y > PAGE_H - 24) {
        doc.addPage();
        y = MARGIN + 6;
      }
      doc.setFont("helvetica", header || strong ? "bold" : "normal");
      doc.setFontSize(header ? 8 : 9.5);
      doc.setTextColor(...(header ? MUTED : TEXT));
      let x = MARGIN;
      cols.forEach((c, i) => {
        const text = header ? c.label.toUpperCase() : cells[i];
        doc.text(text, c.right ? x + c.width : x, y, c.right ? { align: "right" } : undefined);
        x += c.width;
      });
      y += 2.2;
      doc.setDrawColor(...RULE);
      doc.line(MARGIN, y, PAGE_W - MARGIN, y);
      y += 4.6;
    };
    draw([], true, false);
    rows.forEach((r) => draw(r, false, false));
    if (bold) draw(bold, false, true);
    y += 6;
  }

  sectionTitle(`Monthly Breakdown — ${data.year}`);
  const w = CONTENT_W / 5;
  const yearExpenses = data.months.reduce((s, m) => s + m.expenses, 0);
  table(
    [
      { label: "Month", width: w },
      { label: "Tithes", width: w, right: true },
      { label: "Expenses", width: w, right: true },
      { label: "Net", width: w, right: true },
      { label: "Fund Balance", width: w, right: true },
    ],
    data.months.map((m) => [
      m.label,
      peso(m.tithes),
      peso(m.expenses),
      peso(m.net),
      m.balance === null ? "—" : peso(m.balance),
    ]),
    ["Total", peso(data.yearTithes), peso(yearExpenses), peso(data.yearTithes - yearExpenses), ""]
  );

  sectionTitle(`Tithes per Sunday — ${data.monthLabel}`);
  if (data.sundays.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text("No tithes recorded for this month.", MARGIN, y);
  } else {
    const sw = CONTENT_W / 3;
    table(
      [
        { label: "Date", width: sw },
        { label: "Givers", width: sw, right: true },
        { label: "Total Tithes", width: sw, right: true },
      ],
      data.sundays.map((s) => [formatDisplayDate(s.date), String(s.givers), peso(s.total)]),
      ["Total", "", peso(data.monthTithes)]
    );
  }

  if (y > PAGE_H - 50) {
    doc.addPage();
    y = MARGIN + 6;
  }
  sectionTitle(`Expenses by Category — ${data.monthLabel}`);
  if (data.expenseCategories.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text("No expenses recorded for this month.", MARGIN, y);
  } else {
    const cw = CONTENT_W / 3;
    table(
      [
        { label: "Category", width: cw },
        { label: "Amount", width: cw, right: true },
        { label: "% of Tithes", width: cw, right: true },
      ],
      data.expenseCategories.map((c) => [
        c.category,
        peso(c.total),
        c.pctOfTithes === null ? "—" : `${c.pctOfTithes.toFixed(1)}%`,
      ]),
      ["Total", peso(data.monthExpenses), ""]
    );
  }

  // ── Footer on every page ──
  const pages = doc.getNumberOfPages();
  for (let p = 1; p <= pages; p++) {
    doc.setPage(p);
    doc.setDrawColor(...RULE);
    doc.line(MARGIN, PAGE_H - 16, PAGE_W - MARGIN, PAGE_H - 16);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(...MUTED);
    doc.text(`Generated ${generated}`, MARGIN, PAGE_H - 10);
    doc.text(`Page ${p} of ${pages}`, PAGE_W - MARGIN, PAGE_H - 10, { align: "right" });
  }

  doc.save(`finance-report-${data.year}-${data.monthLabel.split(" ")[0].toLowerCase()}.pdf`);
}
