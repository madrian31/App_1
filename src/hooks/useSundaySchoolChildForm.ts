import { useEffect, useState } from "react";
import { getChildById, addChild, updateChild } from "../services/sundaySchool/sundaySchoolChildrenService";
import { hasValidName } from "../types/sundaySchoolChild";

export interface ChildFormState {
  firstName: string;
  lastName: string;
  nickname: string;
  birthday: string;
  guardianName: string;
  guardianContact: string;
}

const EMPTY_FORM: ChildFormState = {
  firstName: "",
  lastName: "",
  nickname: "",
  birthday: "",
  guardianName: "",
  guardianContact: "",
};

export default function useSundaySchoolChildForm(rawId: string | undefined, currentUser: string) {
  // "/SundaySchoolKidsMembers/new" matches the same :id route param — treat "new" as no id.
  const id = rawId && rawId !== "new" ? rawId : undefined;
  const isEditing = Boolean(id);

  const [form, setForm] = useState<ChildFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getChildById(id)
      .then((child) => {
        if (!child) {
          setError("Child not found.");
          return;
        }
        setForm({
          firstName: child.firstName || "",
          lastName: child.lastName || "",
          nickname: child.nickname || "",
          birthday: child.birthday || "",
          guardianName: child.guardianName || "",
          guardianContact: child.guardianContact || "",
        });
      })
      .catch((err) => {
        console.error("Failed to load child:", err);
        setError("Failed to load child.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  function update<K extends keyof ChildFormState>(field: K, value: ChildFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate(): string | null {
    if (!hasValidName(form)) {
      return "Enter a first and last name, or at least a nickname.";
    }
    return null;
  }

  async function submit(): Promise<boolean> {
    const validationError = validate();
    if (validationError) {
      setError(validationError);
      return false;
    }
    setSaving(true);
    setError(null);
    try {
      if (isEditing && id) {
        await updateChild(id, form);
      } else {
        await addChild({
          ...form,
          isActive: true,
          dateEnrolled: new Date().toISOString().slice(0, 10),
          addedBy: currentUser,
        });
      }
      return true;
    } catch (err) {
      console.error("Failed to save child:", err);
      setError("Failed to save. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return { form, isEditing, loading, saving, error, update, submit };
}
