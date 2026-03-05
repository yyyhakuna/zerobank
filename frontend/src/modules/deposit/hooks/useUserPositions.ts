import { useMemo } from "react";
import { useConnection, useReadContracts, useReadContract } from "wagmi";
import { Address, formatUnits, Abi } from "viem";
import ZeroBankABI from "../../../assets/abis/ZeroBank.json";
import { ZEROBANK_ADDRESS } from "../../../const";
import { Token } from "../../../interface";
import { BackendPosition } from "../../../services/positions";

// Chainlink BNB/USD price feed on BSC mainnet
const CHAINLINK_BNB_USD = "0x0567F2323251f0Aab15c8dFb1967E4e8A7D42aeE";
const CHAINLINK_ABI = [
  {
    inputs: [],
    name: "latestRoundData",
    outputs: [
      { internalType: "uint80", name: "roundId", type: "uint80" },
      { internalType: "int256", name: "answer", type: "int256" },
      { internalType: "uint256", name: "startedAt", type: "uint256" },
      { internalType: "uint256", name: "updatedAt", type: "uint256" },
      { internalType: "uint80", name: "answeredInRound", type: "uint80" },
    ],
    stateMutability: "view",
    type: "function",
  },
] as const;

const formatUSDPrice = (val: number): string => {
  if (val === 0 || !isFinite(val) || isNaN(val)) return "-";
  if (val >= 1000) return `$${(val / 1000).toFixed(2)}K`;
  if (val >= 1) return `$${val.toFixed(4)}`;
  if (val >= 0.01) return `$${val.toFixed(6)}`;
  return `$${val.toFixed(8)}`;
};

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

export const useUserPositions = (tokens: Token[], backendPositions: BackendPosition[] = []) => {
  const { address } = useConnection();
  console.log("tokens", tokens);

  const { data: bnbPriceData } = useReadContract({
    address: CHAINLINK_BNB_USD as Address,
    abi: CHAINLINK_ABI,
    functionName: "latestRoundData",
    query: { staleTime: 1000 * 60 },
  });
  const bnbPriceInUSD = bnbPriceData
    ? Number(
        formatUnits(
          (bnbPriceData as [bigint, bigint, bigint, bigint, bigint])[1],
          8,
        ),
      )
    : 0;

  console.log("bnbPriceInUSD", bnbPriceInUSD);
  const {
    data: positionsData,
    isLoading,
    refetch,
  } = useReadContracts({
    contracts: tokens.map((token) => ({
      address: ZEROBANK_ADDRESS as Address,
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

  console.log("positionsData", positionsData);

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

        const priceInBNB = Number(formatUnits(price, 18));
        console.log("priceInBNB", priceInBNB.toFixed(18));

        const liquidatedPriceInBNB = Number(formatUnits(liquidatedPrice, 18));

        const usdPerToken =
          bnbPriceInUSD > 0 && priceInBNB > 0
            ? priceInBNB * bnbPriceInUSD
            : 0;
        const liquidatedUSDPrice =
          bnbPriceInUSD > 0 && liquidatedPriceInBNB > 0
            ? liquidatedPriceInBNB * bnbPriceInUSD
            : 0;
        let side: "Borrow" | "Stake" | "Unknown" = "Unknown";
        let sideColor = "text-slate-400";

        if (userBorrowedTokenAmount > 0n) {
          side = "Borrow";
          sideColor = "text-red-500";
        } else if (userStakeTokenAmount > 0n) {
          side = "Stake";
          sideColor = "text-green-500";
        }

        const tokenAmount =
          userBorrowedTokenAmount > 0n
            ? userBorrowedTokenAmount
            : userStakeTokenAmount;
        const tokenAmountNum = Number(formatUnits(tokenAmount, token.decimals));

        const backendPosition = backendPositions.find(
          (p) => p.tokenAddress.toLowerCase() === (token.address ?? "").toLowerCase(),
        );
        const storedEntryPriceUsd = backendPosition?.entryPriceUsd
          ? Number(backendPosition.entryPriceUsd)
          : null;

        let entryPriceUsd: number;
        let pnlUSD: number;
        if (storedEntryPriceUsd !== null && usdPerToken > 0) {
          entryPriceUsd = storedEntryPriceUsd;
          pnlUSD =
            side === "Borrow"
              ? (storedEntryPriceUsd - usdPerToken) * tokenAmountNum
              : (usdPerToken - storedEntryPriceUsd) * tokenAmountNum;
        } else {
          const ethAmountNum = Number(formatUnits(userEthAmount, 18));
          const entryPriceInBNB =
            tokenAmountNum > 0 ? ethAmountNum / tokenAmountNum : 0;
          entryPriceUsd = entryPriceInBNB * bnbPriceInUSD;
          const pnlInBNB =
            side === "Borrow"
              ? (entryPriceInBNB - priceInBNB) * tokenAmountNum
              : (priceInBNB - entryPriceInBNB) * tokenAmountNum;
          pnlUSD = pnlInBNB * bnbPriceInUSD;
        }

        const formatPnL = (val: number): string => {
          if (!isFinite(val) || isNaN(val) || bnbPriceInUSD === 0) return "-";
          const sign = val >= 0 ? "+" : "-";
          const abs = Math.abs(val);
          if (abs >= 1000) return `${sign}$${(abs / 1000).toFixed(2)}K`;
          if (abs >= 1) return `${sign}$${abs.toFixed(4)}`;
          if (abs >= 0.01) return `${sign}$${abs.toFixed(6)}`;
          return `${sign}$${abs.toFixed(8)}`;
        };

        return {
          token,
          pair: `${token.symbol}/BNB`,
          side,
          sideColor,
          size: `${tokenAmountNum.toFixed(4)} ${token.symbol}`,
          entry: formatUSDPrice(liquidatedUSDPrice),
          mark: formatUSDPrice(entryPriceUsd),
          pnl: formatPnL(pnlUSD),
          pnlColor: pnlUSD >= 0 ? "text-green-500" : "text-red-500",
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
  }, [positionsData, tokens, bnbPriceInUSD, backendPositions]);

  return { positions, isLoading, refetch };
};
