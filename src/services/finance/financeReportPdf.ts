import type {
  FinanceCategoryRow,
  FinanceDepartmentRow,
  FinanceMonthRow,
  FinanceServiceRow,
} from "../../hooks/useFinanceReport";
import { formatDisplayDate, toLocalISODate } from "../../utils/date";
import { getFinanceStatus } from "../../components/finance/financeStatus";

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
  periodLabel: string; // "October 2026", "Aug – Oct 2026"…
  chartTitle: string; // what the month rows cover — the year for a single-month period
  fundBalance: number;
  periodTithes: number;
  periodOfferings: number;
  periodIncome: number; // tithes + offerings
  periodExpenses: number;
  periodDeptGiven: number; // budget given to departments in the period
  periodDeptReturned: number; // unused budget departments returned in the period
  hasDepartmentFunds: boolean; // any department budget given ever — adds the department column and section
  ytdIncome: number;
  ytdYear: number;
  startBalance: number;
  endBalance: number;
  months: FinanceMonthRow[];
  services: FinanceServiceRow[];
  expenseCategories: FinanceCategoryRow[];
  departmentRows: FinanceDepartmentRow[];
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
  doc.text(`Finance Report — General Fund · ${data.periodLabel}`, MARGIN, 22);

  let y = 48;

  // ── KPI boxes ──
  const kpis: [string, string][] = [
    ["General Fund Balance (today)", peso(data.fundBalance)],
    [`Tithes & Offerings — ${data.periodLabel}`, peso(data.periodIncome)],
    [`Tithes & Offerings — YTD ${data.ytdYear}`, peso(data.ytdIncome)],
    [`Expenses — ${data.periodLabel}`, peso(data.periodExpenses)],
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
  const formulaLines = doc.splitTextToSize(
    data.hasDepartmentFunds
      ? "General Fund Balance = starting balance + all tithes + all offerings - all expenses - all budget given to departments + all unused budget they returned."
      : "General Fund Balance = starting balance + all tithes + all offerings - all expenses.",
    CONTENT_W
  ) as string[];
  doc.text(formulaLines, MARGIN, y);
  y += 10 + (formulaLines.length - 1) * 3.5;

  // ── Financial status for the period ──
  // Same headline and wording as the on-screen Financial Status card.
  const inPeriod = data.periodLabel.includes("–") ? `(${data.periodLabel})` : `in ${data.periodLabel}`;
  const withDepartments = data.periodDeptGiven > 0 || data.periodDeptReturned > 0;
  const s = getFinanceStatus(
    data.periodIncome,
    data.periodExpenses + data.periodDeptGiven - data.periodDeptReturned,
    data.endBalance,
    inPeriod,
    peso,
    withDepartments ? "expenses and department funds" : "expenses"
  );
  doc.setFontSize(8.5);
  const figureText = s.figure ? ` ${s.figure.label}: ${s.figure.value}.` : "";
  const statusLines = doc.splitTextToSize(
    `${s.headline.toUpperCase()}: ${s.detail}${figureText}`,
    CONTENT_W - 8
  ) as string[];
  // The department line only appears in periods where departments were given or returned budget.
  const deptParts = [
    data.periodDeptGiven > 0 ? `-  Given to departments ${peso(data.periodDeptGiven)}` : "",
    data.periodDeptReturned > 0 ? `+  Returned by departments ${peso(data.periodDeptReturned)}` : "",
  ].filter(Boolean);
  const extra = deptParts.length > 0 ? 5.5 : 0;
  const boxH = 18 + extra + statusLines.length * 4;
  doc.setDrawColor(...RULE);
  doc.roundedRect(MARGIN, y - 5, CONTENT_W, boxH, 2, 2, "S");
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9.5);
  doc.setTextColor(...TEXT);
  doc.text(
    `Previous Balance ${peso(data.startBalance)}  +  Tithes ${peso(data.periodTithes)}  +  Offerings ${peso(
      data.periodOfferings
    )}  -  Expenses ${peso(data.periodExpenses)}`,
    MARGIN + 4,
    y + 1.5
  );
  if (deptParts.length > 0) doc.text(deptParts.join("  "), MARGIN + 4, y + 7);
  doc.setFont("helvetica", "bold");
  doc.text(`=  Remaining Balance ${peso(data.endBalance)}`, MARGIN + 4, y + 7 + extra);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...MUTED);
  doc.text(statusLines, MARGIN + 4, y + 13 + extra);
  y += boxH + 6;

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

  function table(
    cols: { label: string; width: number; right?: boolean }[],
    rows: string[][],
    bold?: string[],
    fontSize = 9.5 // smaller for tables with many amount columns, so the amounts don't touch
  ) {
    const draw = (cells: string[], header: boolean, strong: boolean) => {
      if (y > PAGE_H - 24) {
        doc.addPage();
        y = MARGIN + 6;
      }
      doc.setFont("helvetica", header || strong ? "bold" : "normal");
      doc.setFontSize(header ? Math.min(8, fontSize) : fontSize);
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

  sectionTitle(`Monthly Breakdown — ${data.chartTitle}`);
  // A Dept. Funds column (budget given less budget returned) once departments have been given budget.
  const showDept = data.hasDepartmentFunds;
  const monthW = 24;
  const w = (CONTENT_W - monthW) / (showDept ? 6 : 5);
  const sum = (key: "tithes" | "offerings" | "expenses" | "departmentFunds") =>
    data.months.reduce((s, m) => s + m[key], 0);
  const rowsTithes = sum("tithes");
  const rowsOfferings = sum("offerings");
  const rowsExpenses = sum("expenses");
  const rowsDept = sum("departmentFunds");
  const onlyIf = <T,>(cond: boolean, item: T): T[] => (cond ? [item] : []);
  table(
    [
      { label: "Month", width: monthW },
      { label: "Tithes", width: w, right: true },
      { label: "Offerings", width: w, right: true },
      { label: "Expenses", width: w, right: true },
      ...onlyIf(showDept, { label: "Dept. Funds", width: w, right: true }),
      { label: "Net", width: w, right: true },
      { label: "Fund Balance", width: w, right: true },
    ],
    data.months.map((m) => [
      m.label,
      peso(m.tithes),
      peso(m.offerings),
      peso(m.expenses),
      ...onlyIf(showDept, peso(m.departmentFunds)),
      peso(m.net),
      m.balance === null ? "—" : peso(m.balance),
    ]),
    [
      "Total",
      peso(rowsTithes),
      peso(rowsOfferings),
      peso(rowsExpenses),
      ...onlyIf(showDept, peso(rowsDept)),
      peso(rowsTithes + rowsOfferings - rowsExpenses - rowsDept),
      "",
    ],
    showDept ? 8.5 : 9.5
  );

  sectionTitle(`Collections per Service — ${data.periodLabel}`);
  if (data.services.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text("No tithes or offerings recorded for this period.", MARGIN, y);
  } else {
    const sw = CONTENT_W / 4;
    const dash = (n: number) => (n > 0 ? peso(n) : "—");
    table(
      [
        { label: "Date", width: sw },
        { label: "Tithes", width: sw, right: true },
        { label: "Offering", width: sw, right: true },
        { label: "Total", width: sw, right: true },
      ],
      data.services.map((s) => [formatDisplayDate(s.date), dash(s.tithes), dash(s.offerings), peso(s.total)]),
      ["Total", peso(data.periodTithes), peso(data.periodOfferings), peso(data.periodIncome)]
    );
  }

  if (y > PAGE_H - 50) {
    doc.addPage();
    y = MARGIN + 6;
  }
  sectionTitle(`Expenses by Category — ${data.periodLabel}`);
  if (data.expenseCategories.length === 0) {
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9.5);
    doc.setTextColor(...MUTED);
    doc.text("No expenses recorded for this period.", MARGIN, y);
    y += 12;
  } else {
    const cw = CONTENT_W / 3;
    table(
      [
        { label: "Category", width: cw },
        { label: "Amount", width: cw, right: true },
        { label: "% of Income", width: cw, right: true },
      ],
      data.expenseCategories.map((c) => [
        c.category,
        peso(c.total),
        c.pctOfIncome === null ? "—" : `${c.pctOfIncome.toFixed(1)}%`,
      ]),
      ["Total", peso(data.periodExpenses), ""]
    );
  }

  if (data.hasDepartmentFunds) {
    if (y > PAGE_H - 50) {
      doc.addPage();
      y = MARGIN + 6;
    }
    sectionTitle(`Budget Given to Departments — ${data.periodLabel}`);
    if (data.departmentRows.length === 0) {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(9.5);
      doc.setTextColor(...MUTED);
      doc.text("No budget given to or returned by departments for this period.", MARGIN, y);
    } else {
      const dw = CONTENT_W / 4;
      const given = data.departmentRows.reduce((s, r) => s + r.given, 0);
      const returned = data.departmentRows.reduce((s, r) => s + r.returned, 0);
      table(
        [
          { label: "Department", width: dw },
          { label: "Given", width: dw, right: true },
          { label: "Returned", width: dw, right: true },
          { label: "From the Fund", width: dw, right: true },
        ],
        data.departmentRows.map((r) => [r.name, peso(r.given), r.returned > 0 ? peso(r.returned) : "—", peso(r.net)]),
        ["Total", peso(given), peso(returned), peso(given - returned)]
      );
    }
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

  doc.save(`finance-report-${data.periodLabel.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.pdf`);
}
