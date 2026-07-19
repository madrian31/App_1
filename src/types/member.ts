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
}
