/** The church's General Fund starting point — the money already on hand before anything
 *  was recorded in the app. Every tithe and expense in the app is added to / taken from it.
 *  Stored at `financeSettings/generalFund`; edited in Settings → General. */
export interface GeneralFundSettings {
  openingBalance: number;
  modifiedBy: string;
  dateModified: string; // ISO — "" until the balance has been saved once
}
