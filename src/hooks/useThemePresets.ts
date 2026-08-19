import { useEffect, useState } from "react";
import {
  getThemePresets,
  addThemePreset,
  updateThemePreset,
  removeThemePreset,
} from "../services/settings/themePresetsService";
import type { ThemePreset } from "../types/themePreset";

export default function useThemePresets() {
  const [presets, setPresets] = useState<ThemePreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function refetch() {
    setLoading(true);
    setError(null);
    try {
      setPresets(await getThemePresets());
    } catch (err) {
      console.error("Failed to load theme presets:", err);
      setError("Failed to load theme presets.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refetch();
  }, []);

  async function add(title: string, verse: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    setSaving(true);
    try {
      const id = await addThemePreset(trimmedTitle, verse.trim());
      setPresets((cur) => [...cur, { id, title: trimmedTitle, verse: verse.trim() }]);
    } catch (err) {
      console.error("Failed to add theme preset:", err);
      setError("Failed to add theme preset.");
    } finally {
      setSaving(false);
    }
  }

  async function edit(id: string, title: string, verse: string) {
    const trimmedTitle = title.trim();
    if (!trimmedTitle) return;
    const prev = presets;
    setPresets((cur) => cur.map((p) => (p.id === id ? { ...p, title: trimmedTitle, verse: verse.trim() } : p)));
    try {
      await updateThemePreset(id, trimmedTitle, verse.trim());
    } catch (err) {
      console.error("Failed to update theme preset:", err);
      setPresets(prev);
      setError("Failed to update theme preset.");
    }
  }

  async function remove(id: string) {
    const prev = presets;
    setPresets((cur) => cur.filter((p) => p.id !== id));
    try {
      await removeThemePreset(id);
    } catch (err) {
      console.error("Failed to remove theme preset:", err);
      setPresets(prev);
      setError("Failed to remove theme preset.");
    }
  }

  return { presets, loading, saving, error, add, edit, remove, refetch };
}