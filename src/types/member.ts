export interface Member {
  id: string;
  firstName: string;
  middleName: string;
  lastName: string;
  userId: number;
  isPledger: boolean;
  addedBy: string;
  dateAdded: string; // ISO date string, e.g. "2025-01-12"
  isArchived: boolean;

  // ── Optional profile fields (filled in / edited via the Profile page) ──
  nickname?: string;
  gender?: string;
  dateOfBirth?: string;
  civilStatus?: string;
  motherName?: string;
  fatherName?: string;
  numberOfSiblings?: number;
  siblingNames?: string;
  phoneNumber?: string;
  emailAddress?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactNumber?: string;
  dateRegistered?: string;
  membershipStatus?: string;
  ministry?: string;
  remarks?: string;
}