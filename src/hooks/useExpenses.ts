import { useEffect, useMemo, useState } from "react";
import { addExpense, deleteExpense, getExpenses, updateExpense } from "../services/expenses/expensesService";
import { getLookupList, seedLookupListIfEmpty } from "../services/settings/lookupListsService";
import { EXPENSE_CATEGORY_SEED, type Expense, type NewExpense } from "../types/expense";
import { formatDisplayDate, toLocalISODate } from "../utils/date";

export const EXPENSE_MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export const ALL_CATEGORIES = "";

export interface ExpenseForm {
  category: string;
  description: string;
  amount: string;
  date: string; // ISO date
}

function emptyForm(category = ""): ExpenseForm {
  return { category, description: "", amount: "", date: toLocalISODate(new Date()) };
}

function monthStartISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month, 1));
}
function monthEndISO(year: number, month: number): string {
  return toLocalISODate(new Date(year, month + 1, 0));
}

export interface CategoryTotal {
  category: string;
  total: number;
}

/**
 * Drives the Expenses page: month/year + category filter, entry list,
 * add/edit form state, delete confirmation, and per-category totals.
 */
export default function useExpenses(currentUser: string) {
  const now = new Date();

  const [curMonth, setCurMonth] = useState(now.getMonth());
  const [curYear, setCurYear] = useState(now.getFullYear());
  const [categoryFilter, setCategoryFilter] = useState(ALL_CATEGORIES);
  const [search, setSearch] = useState("");

  const [categories, setCategories] = useState<string[]>([]);
  const [entries, setEntries] = useState<Expense[]>([]);
  const [reloadKey, setReloadKey] = useState(0);
  const [loadedKey, setLoadedKey] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<ExpenseForm>(emptyForm);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

  const fetchKey = `${curYear}-${curMonth}-${reloadKey}`;
  const loading = loadedKey !== fetchKey;

  useEffect(() => {
    seedLookupListIfEmpty("expenseCategory", EXPENSE_CATEGORY_SEED)
      .then(() => getLookupList("expenseCategory"))
      .then(setCategories)
      .catch((err) => console.error("Failed to load expense categories:", err));
  }, []);

  useEffect(() => {
    let cancelled = false; // ignore a stale response after switching month/year
    getExpenses(monthStartISO(curYear, curMonth), monthEndISO(curYear, curMonth))
      .then((list) => {
        if (cancelled) return;
        setEntries(list);
        setError(null);
      })
      .catch((err) => {
        if (cancelled) return;
        console.error("Failed to load expenses:", err);
        setEntries([]);
        setError("Failed to load expenses.");
      })
      .finally(() => {
        if (!cancelled) setLoadedKey(`${curYear}-${curMonth}-${reloadKey}`);
      });
    return () => {
      cancelled = true;
    };
  }, [curMonth, curYear, reloadKey]);

  const refetch = () => setReloadKey((k) => k + 1);

  function openAddForm() {
    // Pre-pick the filtered category — adding "Electricity" while viewing Electricity is the common case.
    setForm(emptyForm(categoryFilter || categories[0] || ""));
    setEditingId(null);
    setError(null);
    setShowForm(true);
  }

  function openEditForm(entry: Expense) {
    setForm({
      category: entry.category,
      description: entry.description ?? "",
      amount: String(entry.amount),
      date: entry.date,
    });
    setEditingId(entry.id);
    setError(null);
    setShowForm(true);
  }

  function closeForm() {
    setForm(emptyForm());
    setEditingId(null);
    setShowForm(false);
  }

  function updateForm<K extends keyof ExpenseForm>(key: K, value: ExpenseForm[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const canSave = (parseFloat(form.amount) || 0) > 0 && Boolean(form.date) && Boolean(form.category);

  async function saveEntry() {
    if (!canSave) return;
    setSaving(true);
    setError(null);
    try {
      const payload: NewExpense = {
        category: form.category,
        description: form.description.trim(),
        amount: parseFloat(form.amount) || 0,
        date: form.date,
        addedBy: currentUser,
      };
      if (editingId) await updateExpense(editingId, payload);
      else await addExpense(payload);

      // Jump to the saved entry's month so it doesn't seem to "disappear".
      const saved = new Date(`${payload.date}T00:00:00`);
      const sameMonth = saved.getMonth() === curMonth && saved.getFullYear() === curYear;
      closeForm();
      if (sameMonth) {
        refetch();
      } else {
        setCurMonth(saved.getMonth());
        setCurYear(saved.getFullYear());
      }
    } catch (err) {
      console.error("Failed to save expense:", err);
      setError("Failed to save expense.");
    } finally {
      setSaving(false);
    }
  }

  async function removeEntry(id: string) {
    try {
      await deleteExpense(id);
      setDeleteConfirmId(null);
      refetch();
    } catch (err) {
      console.error("Failed to delete expense:", err);
      setError("Failed to delete expense.");
    }
  }

  const filteredEntries = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entries.filter(
      (e) =>
        (!categoryFilter || e.category === categoryFilter) &&
        (!q || (e.description ?? "").toLowerCase().includes(q) || e.category.toLowerCase().includes(q))
    );
  }, [entries, categoryFilter, search]);

  const totals = useMemo(() => {
    const byCategory = new Map<string, number>();
    entries.forEach((e) => byCategory.set(e.category, (byCategory.get(e.category) ?? 0) + (e.amount || 0)));
    const categoryTotals: CategoryTotal[] = [...byCategory.entries()]
      .map(([category, total]) => ({ category, total }))
      .sort((a, b) => b.total - a.total);
    return {
      total: entries.reduce((s, e) => s + (e.amount || 0), 0),
      filteredTotal: filteredEntries.reduce((s, e) => s + (e.amount || 0), 0),
      categoryTotals,
    };
  }, [entries, filteredEntries]);

  function exportCSV() {
    let csv = "Due Date,Category,Description,Amount,Added By\n";
    filteredEntries.forEach((e) => {
      const q = (s: string) => `"${(s || "").replace(/"/g, '""')}"`;
      csv += `${q(formatDisplayDate(e.date))},${q(e.category)},${q(e.description)},${e.amount},${q(e.addedBy)}\n`;
    });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `expenses_${curMonth + 1}_${curYear}.csv`;
    a.click();
  }

  return {
    curMonth,
    setCurMonth,
    curYear,
    setCurYear,
    years,
    categoryFilter,
    setCategoryFilter,
    search,
    setSearch,
    categories,

    entries: filteredEntries,
    entryCount: entries.length,
    loading,
    error,

    showForm,
    form,
    editingId,
    saving,
    canSave,
    deleteConfirmId,
    setDeleteConfirmId,

    openAddForm,
    openEditForm,
    closeForm,
    updateForm,
    saveEntry,
    removeEntry,
    exportCSV,

    ...totals,
  };
}
