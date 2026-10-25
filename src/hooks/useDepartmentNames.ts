import { useEffect, useState } from "react";
import { getDepartments } from "../services/departments/departmentsService";

/** Department names from Settings → Departments, for pages that store the name itself (Visitation).
 *  `active` is for picking a department on new records; `all` (inactive too) is for filtering old ones. */
export default function useDepartmentNames() {
  const [names, setNames] = useState<{ active: string[]; all: string[] }>({ active: [], all: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getDepartments()
      .then((list) => {
        if (cancelled) return;
        setNames({ active: list.filter((d) => d.isActive).map((d) => d.name), all: list.map((d) => d.name) });
      })
      .catch((err) => {
        console.error("Failed to load departments:", err);
        if (!cancelled) setError(true);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return { ...names, loading, error };
}
