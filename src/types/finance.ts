/** The church's General Fund starting point — the money already on hand before
 *  tithes were recorded in the app. Stored at `financeSettings/generalFund`. */
export interface GeneralFundSettings {
  openingBalance: number;
  openingDate: string; // ISO date — tithes dated on/after this count toward the balance; "" = count all
  modifiedBy: string;
  dateModified: string; // ISO
}
