import { addDoc, collection, doc, getDocs, updateDoc } from "firebase/firestore";
import { db } from "../../firebase/firebase";
import type { Department, DepartmentPatch } from "../../types/department";

const departmentsCol = collection(db, "departments");

export function sortDepartments(list: Department[]): Department[] {
  return [...list].sort((a, b) => a.name.localeCompare(b.name));
}

/** Every department, active and inactive, A–Z. The list lives only here — added in Settings → Departments. */
export async function getDepartments(): Promise<Department[]> {
  const snap = await getDocs(departmentsCol);
  return sortDepartments(
    snap.docs.map((d) => {
      const data = d.data() as Partial<Department>;
      return {
        id: d.id,
        name: data.name ?? "",
        leader: data.leader ?? "",
        isActive: data.isActive ?? true,
        modifiedBy: data.modifiedBy ?? "",
        dateAdded: data.dateAdded ?? "",
        dateModified: data.dateModified ?? "",
      };
    })
  );
}

export async function addDepartment(name: string, currentUser: string): Promise<Department> {
  const nowISO = new Date().toISOString();
  const data = { name, leader: "", isActive: true, modifiedBy: currentUser, dateAdded: nowISO, dateModified: nowISO };
  const ref = await addDoc(departmentsCol, data);
  return { id: ref.id, ...data };
}

export async function updateDepartment(id: string, patch: DepartmentPatch, currentUser: string): Promise<void> {
  await updateDoc(doc(departmentsCol, id), { ...patch, modifiedBy: currentUser, dateModified: new Date().toISOString() });
}
