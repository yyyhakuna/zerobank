import { API_URL } from "../const";

export interface BackendPosition {
  id: string;
  userId: string;
  userAddress: string;
  tokenAddress: string;
  ltv: number;
  collateralAmount: string;
  txHash: string;
  chainId: number;
  createdAt: string;
}

export interface CreatePositionInput {
  userAddress: string;
  tokenAddress: string;
  ltv: number;
  collateralAmountWei?: string;
  txHash?: string;
  chainId?: number;
}

export const fetchUserPositions = async (
  userAddress: string,
): Promise<BackendPosition[]> => {
  const response = await fetch(`${API_URL}/positions/${userAddress}`);
  if (!response.ok) {
    throw new Error("Failed to fetch positions");
  }
  const data = await response.json();
  return data;
};

export const createPosition = async (
  input: CreatePositionInput,
): Promise<BackendPosition> => {
  const response = await fetch(`${API_URL}/positions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(input),
  });
  if (!response.ok) {
    throw new Error("Failed to create position");
  }
  return response.json();
};
