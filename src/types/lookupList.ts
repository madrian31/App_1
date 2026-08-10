export type LookupListKey = "status" | "category" | "us2cgLevel" | "ministry";

export interface LookupListConfig {
  key: LookupListKey;
  label: string;
  /** Field on Member this list feeds — for reference/documentation only. */
  memberField: string;
}

/** Add a new entry here (and a matching seed array in useLookupLists) to manage another list,
 *  e.g. Visitation Department or Purpose, without touching the rest of the page. */
export const LOOKUP_LISTS: LookupListConfig[] = [
  { key: "status", label: "Status", memberField: "status" },
  { key: "category", label: "Category", memberField: "category" },
  { key: "us2cgLevel", label: "US2CG Level", memberField: "us2cgLevel" },
  { key: "ministry", label: "Ministry", memberField: "ministry" },
];
