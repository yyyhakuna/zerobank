import { create } from "zustand";
import { Token } from "../../interface";

interface DepositStore {
  selectedBorrowToken: Token | null;
  setSelectedBorrowToken: (token: Token | null) => void;
}

export const useDepositStore = create<DepositStore>((set) => ({
  selectedBorrowToken: null,
  setSelectedBorrowToken: (token) => set({ selectedBorrowToken: token }),
}));
