import { useMemo } from "react";
import { useConnection, useReadContracts } from "wagmi";
import { Address, formatUnits, Abi } from "viem";
import ZeroBankABI from "../../../assets/abis/ZeroBank.json";
import { ZEROBANK_LAUNCHPAD_ADDRESS } from "../../../const";
import { Token } from "../../../interface";

export interface PositionData {
  token: Token;
  pair: string;
  side: "Borrow" | "Stake" | "Unknown";
  sideColor: string;
  size: string;
  entry: string;
  mark: string;
  pnl: string;
  pnlColor: string;
  raw: {
    userEthAmount: bigint;
    userStakeTokenAmount: bigint;
    userBorrowedTokenAmount: bigint;
    healthyFactor: bigint;
    price: bigint;
    liquidatedPrice: bigint;
  };
}

export const useUserPositions = (tokens: Token[]) => {
  const { address } = useConnection();

  const {
    data: positionsData,
    isLoading,
    refetch,
  } = useReadContracts({
    contracts: tokens.map((token) => ({
      address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
      abi: ZeroBankABI as Abi,
      functionName: "userPositionInfo",
      args: [address, token.address],
    })),
    query: {
      enabled: !!address && tokens.length > 0,
      // Add staleTime to prevent frequent refetches if data hasn't changed
      staleTime: 1000 * 30, // 30 seconds
    },
  });

  const positions = useMemo(() => {
    if (!positionsData) return [];

    return positionsData
      .map((result, index) => {
        if (result.status !== "success") return null;

        const token = tokens[index];
        const [
          userEthAmount,
          userStakeTokenAmount,
          userBorrowedTokenAmount,
          healthyFactor,
          price,
          liquidatedPrice,
        ] = result.result as [bigint, bigint, bigint, bigint, bigint, bigint];

        if (userStakeTokenAmount === 0n && userBorrowedTokenAmount === 0n) {
          return null;
        }

        const priceFormatted = formatUnits(price, 18);
        const hfPercentage = Number(healthyFactor) / 100;

        let side: "Borrow" | "Stake" | "Unknown" = "Unknown";
        let sideColor = "text-slate-400";

        if (userBorrowedTokenAmount > 0n) {
          side = "Borrow";
          sideColor = "text-red-500";
        } else if (userStakeTokenAmount > 0n) {
          side = "Stake";
          sideColor = "text-green-500";
        }

        return {
          token,
          pair: `${token.symbol}/BNB`,
          side,
          sideColor,
          size: `${Number(
            formatUnits(
              userBorrowedTokenAmount > 0n
                ? userBorrowedTokenAmount
                : userStakeTokenAmount,
              token.decimals,
            ),
          ).toFixed(4)} ${token.symbol}`,
          entry: Number(formatUnits(liquidatedPrice, 18)).toFixed(8),
          mark: Number(priceFormatted).toFixed(8),
          pnl: `${hfPercentage.toFixed(2)}%`,
          pnlColor: hfPercentage < 100 ? "text-red-500" : "text-green-500",
          raw: {
            userEthAmount,
            userStakeTokenAmount,
            userBorrowedTokenAmount,
            healthyFactor,
            price,
            liquidatedPrice,
          },
        } as PositionData;
      })
      .filter((p): p is PositionData => p !== null);
  }, [positionsData, tokens]);

  return { positions, isLoading, refetch };
};
