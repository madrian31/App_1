import { useEffect, useState } from "react";
import { addDepartment, getDepartments, sortDepartments, updateDepartment } from "../services/departments/departmentsService";
import type { Department } from "../types/department";
import useAutoSave from "./useAutoSave";

function cleanText(raw: string): string {
  return raw.trim().replace(/\s+/g, " ");
}

/**
 * Drives Settings → Departments: the department list (name, leader, active).
 * Every change saves on its own (no Save button); failed saves can be retried.
 * Budgets are set per activity in Finance → Department Funds.
 */
export default function useDepartmentSettings(currentUser: string) {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null); // a change that wasn't accepted
  const [adding, setAdding] = useState(false);
  const autoSave = useAutoSave();

  useEffect(() => {
    getDepartments()
      .then(setDepartments)
      .catch((err) => {
        console.error("Failed to load departments:", err);
        setError("Failed to load departments.");
      })
      .finally(() => setLoading(false));
  }, []);

  function nameTaken(name: string, exceptId?: string) {
    return departments.some((d) => d.id !== exceptId && d.name.toLowerCase() === name.toLowerCase());
  }

  /** Returns true once added, so the caller can clear its field. */
  async function add(rawName: string): Promise<boolean> {
    const name = cleanText(rawName);
    if (!name) return false;
    if (nameTaken(name)) {
      setNotice(`There is already a department named "${name}".`);
      return false;
    }
    setNotice(null);
    setAdding(true);
    try {
      const created = await addDepartment(name, currentUser);
      setDepartments((list) => sortDepartments([...list, created]));
      autoSave.markSaved();
      return true;
    } catch (err) {
      console.error("Failed to add department:", err);
      setNotice(`"${name}" was not added. Please check your connection and try again.`);
      return false;
    } finally {
      setAdding(false);
    }
  }

  // The field setters below return false when there is nothing to save, so the field shows the saved value again.

  function rename(id: string, rawName: string): boolean {
    const name = cleanText(rawName);
    const current = departments.find((d) => d.id === id);
    if (!current || !name || name === current.name) return false;
    if (nameTaken(name, id)) {
      setNotice(`There is already a department named "${name}".`);
      return false;
    }
    setNotice(null);
    setDepartments((list) => list.map((d) => (d.id === id ? { ...d, name } : d)));
    autoSave.save(`${id}:name`, () => updateDepartment(id, { name }, currentUser));
    return true;
  }

  function setLeader(id: string, rawLeader: string): boolean {
    const leader = cleanText(rawLeader);
    const current = departments.find((d) => d.id === id);
    if (!current || leader === current.leader) return false;
    setDepartments((list) => list.map((d) => (d.id === id ? { ...d, leader } : d)));
    autoSave.save(`${id}:leader`, () => updateDepartment(id, { leader }, currentUser));
    return true;
  }

  function setActive(id: string, isActive: boolean) {
    setDepartments((list) => list.map((d) => (d.id === id ? { ...d, isActive } : d)));
    autoSave.save(`${id}:isActive`, () => updateDepartment(id, { isActive }, currentUser));
  }

  return {
    departments,
    loading,
    error,
    notice,
    dismissNotice: () => setNotice(null),

    adding,
    add,
    rename,
    setLeader,
    setActive,

    saveStatus: autoSave.status,
    retryFailed: autoSave.retryFailed,
  };
}
