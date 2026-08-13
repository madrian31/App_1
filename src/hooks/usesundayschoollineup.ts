import { useEffect, useState } from "react";
import { getAllMembers } from "../services/members/memberService/membersService";
import { getLineUpForDate, saveLineUp } from "../services/sundaySchool/sundaySchoolLineUpService";
import type { Member } from "../types/member";
import type { AssistantTeacherRef } from "../types/sundaySchoolLineUp";

/** Nearest upcoming Sunday (today if today is already Sunday). */
function nextSunday(): string {
  const d = new Date();
  const day = d.getDay();
  if (day !== 0) d.setDate(d.getDate() + (7 - day));
  return d.toISOString().slice(0, 10);
}

export default function useSundaySchoolLineUp(currentUser: string) {
  const [date, setDate] = useState(nextSunday());

  const [teachers, setTeachers] = useState<Member[]>([]);
  const [assistants, setAssistants] = useState<Member[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(true);

  const [teacherId, setTeacherId] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [assistantTeachers, setAssistantTeachers] = useState<AssistantTeacherRef[]>([]);
  const [topic, setTopic] = useState("");
  const [notes, setNotes] = useState("");

  const [loadingEntry, setLoadingEntry] = useState(false);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  useEffect(() => {
    setLoadingMembers(true);
    getAllMembers()
      .then((all) => {
        const active = all.filter((m) => !m.isArchived);
        setTeachers(active.filter((m) => m.isSundaySchoolTeacher));
        setAssistants(active.filter((m) => m.isSundaySchoolAssistantTeacher));
      })
      .catch((err) => console.error("Failed to load teachers:", err))
      .finally(() => setLoadingMembers(false));
  }, []);

  useEffect(() => {
    setLoadingEntry(true);
    getLineUpForDate(date)
      .then((entry) => {
        if (entry) {
          setTeacherId(entry.teacherId);
          setTeacherName(entry.teacherName);
          setAssistantTeachers(entry.assistantTeachers);
          setTopic(entry.topic);
          setNotes(entry.notes || "");
        } else {
          setTeacherId("");
          setTeacherName("");
          setAssistantTeachers([]);
          setTopic("");
          setNotes("");
        }
      })
      .catch((err) => console.error("Failed to load lineup:", err))
      .finally(() => setLoadingEntry(false));
  }, [date]);

  function selectTeacher(id: string, name: string) {
    setTeacherId(id);
    setTeacherName(name);
  }

  function addAssistant(ref: AssistantTeacherRef) {
    setAssistantTeachers((prev) => (prev.some((a) => a.memberId === ref.memberId) ? prev : [...prev, ref]));
  }

  function removeAssistant(memberId: string) {
    setAssistantTeachers((prev) => prev.filter((a) => a.memberId !== memberId));
  }

  function goPrevSunday() {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() - 7);
    setDate(d.toISOString().slice(0, 10));
  }

  function goNextSunday() {
    const d = new Date(`${date}T00:00:00`);
    d.setDate(d.getDate() + 7);
    setDate(d.toISOString().slice(0, 10));
  }

  async function submit(): Promise<boolean> {
    if (!teacherId) {
      setToast("Please select a Teacher.");
      return false;
    }
    if (!topic.trim()) {
      setToast("Please enter a topic.");
      return false;
    }
    setSaving(true);
    try {
      await saveLineUp(date, teacherId, teacherName, assistantTeachers, topic, notes, currentUser);
      setToast("Line-up saved.");
      return true;
    } catch (err) {
      console.error("Failed to save lineup:", err);
      setToast("Failed to save line-up.");
      return false;
    } finally {
      setSaving(false);
    }
  }

  return {
    date,
    setDate,
    goPrevSunday,
    goNextSunday,
    teachers,
    assistants,
    loadingMembers,
    teacherId,
    teacherName,
    selectTeacher,
    assistantTeachers,
    addAssistant,
    removeAssistant,
    topic,
    setTopic,
    notes,
    setNotes,
    loadingEntry,
    saving,
    toast,
    submit,
  };
}