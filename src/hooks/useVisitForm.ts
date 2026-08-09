import { useEffect, useState } from "react";
import { getVisitById, addVisit, updateVisit } from "../services/visitation/visitationService";
import type { Member } from "../types/member";

export interface VisitFormState {
  memberId: string;
  memberName: string;
  date: string; // ISO
  department: string;
  leader: string;
  purpose: string;
  participants: string[];
  notes: string;
}

const EMPTY_FORM: VisitFormState = {
  memberId: "",
  memberName: "",
  date: new Date().toISOString().slice(0, 10),
  department: "",
  leader: "",
  purpose: "",
  participants: [],
  notes: "",
};

export default function useVisitForm(rawId: string | undefined, currentUser: string) {
  // "/Visitation/new" matches the same :id route param — treat that literal
  // segment as "no id" so we don't try to fetch a visit called "new".
  const id = rawId && rawId !== "new" ? rawId : undefined;
  const isEditing = Boolean(id);
  const [form, setForm] = useState<VisitFormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(isEditing);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getVisitById(id)
      .then((visit) => {
        if (!visit) {
          setError("Visit not found.");
          return;
        }
        setForm({
          memberId: visit.memberId,
          memberName: visit.memberName,
          date: visit.date,
          department: visit.department,
          leader: visit.leader,
          purpose: visit.purpose,
          participants: visit.participants,
          notes: visit.notes,
        });
      })
      .catch((err) => {
        console.error("Failed to load visit:", err);
        setError("Failed to load visit.");
      })
      .finally(() => setLoading(false));
  }, [id]);

  function update<K extends keyof VisitFormState>(field: K, value: VisitFormState[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function selectMember(member: Member) {
    setForm((prev) => ({
      ...prev,
      memberId: member.id,
      memberName: `${member.firstName}${member.middleInitial ? ` ${member.middleInitial}` : ""} ${member.lastName}`,
    }));
  }

  function addParticipant(name: string) {
    const trimmed = name.trim();
    if (!trimmed) return;
    setForm((prev) =>
      prev.participants.includes(trimmed) ? prev : { ...prev, participants: [...prev.participants, trimmed] }
    );
  }

  function removeParticipant(name: string) {
    setForm((prev) => ({ ...prev, participants: prev.participants.filter((p) => p !== name) }));
  }

  function validate(): string | null {
    if (!form.memberId) return "Please select a member.";
    if (!form.date) return "Please select a date.";
    if (!form.department) return "Please select a department.";
    if (!form.leader.trim()) return "Please enter the leader's name.";
    if (!form.purpose.trim()) return "Please enter the purpose of the visit.";
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
        await updateVisit(id, form);
      } else {
        await addVisit({
          ...form,
          addedBy: currentUser,
          dateAdded: new Date().toISOString().slice(0, 10),
        });
      }
      return true;
    } catch (err) {
      console.error("Failed to save visit:", err);
      setError("Failed to save visit. Please try again.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    form,
    isEditing,
    loading,
    saving,
    error,
    update,
    selectMember,
    addParticipant,
    removeParticipant,
    submit,
  };
}