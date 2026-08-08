import type { Member } from "../types/member";

// Shared mock data used by useMembers (Members page) and Profile (Profile page)
// while the real backend/data layer is being rebuilt. Replace with a real
// fetch (e.g. membersService.getAll()) once the backend is reconnected.
export const MOCK_MEMBERS: Member[] = [
  { id: "1", firstName: "Maria", middleName: "", lastName: "Santos", userId: 101, isPledger: true, addedBy: "Admin", dateAdded: "2025-01-12", isArchived: false },
  { id: "2", firstName: "Jose", middleName: "M.", lastName: "Reyes", userId: 102, isPledger: false, addedBy: "Admin", dateAdded: "2025-02-03", isArchived: false },
  { id: "3", firstName: "Ana", middleName: "", lastName: "Cruz", userId: 103, isPledger: true, addedBy: "Pastor", dateAdded: "2025-02-20", isArchived: false },
  { id: "4", firstName: "Pedro", middleName: "", lastName: "Garcia", userId: 104, isPledger: false, addedBy: "Admin", dateAdded: "2025-03-05", isArchived: false },
  { id: "5", firstName: "Liza", middleName: "", lastName: "Torres", userId: 105, isPledger: true, addedBy: "Pastor", dateAdded: "2025-03-18", isArchived: false },
  { id: "6", firstName: "Mark", middleName: "", lastName: "Ramos", userId: 106, isPledger: false, addedBy: "Admin", dateAdded: "2025-04-01", isArchived: false },
  { id: "7", firstName: "Grace", middleName: "", lastName: "Lim", userId: 107, isPledger: true, addedBy: "Admin", dateAdded: "2025-04-14", isArchived: false },
  { id: "8", firstName: "Noel", middleName: "", lastName: "Bautista", userId: 108, isPledger: false, addedBy: "Pastor", dateAdded: "2025-05-02", isArchived: false },
  { id: "9", firstName: "Rosa", middleName: "", lastName: "Del Rosario", userId: 109, isPledger: true, addedBy: "Admin", dateAdded: "2025-05-19", isArchived: false },
  { id: "10", firstName: "Carlo", middleName: "", lastName: "Mendoza", userId: 110, isPledger: false, addedBy: "Admin", dateAdded: "2025-06-01", isArchived: false },
  { id: "11", firstName: "Elena", middleName: "", lastName: "Villanueva", userId: 111, isPledger: true, addedBy: "Pastor", dateAdded: "2025-06-15", isArchived: false },
];
