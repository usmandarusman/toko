export type Theme = "dark" | "light";
export type SortBy = "name" | "stock";
export type StockAction = "add" | "sold";
export type ToastType = "success" | "error" | "info";

export type Partner = {
  id: string;
  storeName: string;
  owner: string;
  phone: string;
  address: string;
  totalStock: number;
  lastMovement: string;
  lastMovementAt: string;
};

export type StockHistory = {
  id: string;
  partnerId: string;
  storeName: string;
  type: StockAction;
  amount: number;
  note: string;
  stockBefore: number;
  stockAfter: number;
  createdAt: string;
};

export type PartnerForm = {
  storeName: string;
  owner: string;
  phone: string;
  address: string;
};

export const EMPTY_FORM: PartnerForm = {
  storeName: "",
  owner: "",
  phone: "",
  address: "",
};
