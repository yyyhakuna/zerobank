import { useMemo } from "react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { useDepositStore } from "../store";
import { useConnection, useReadContract } from "wagmi";
import { formatUnits, Address } from "viem";
import ZeroBankABI from "../../../assets/abis/ZeroBank.json";
import { ZEROBANK_LAUNCHPAD_ADDRESS } from "../../../const";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const PositionsTable = () => {
  const { selectedBorrowToken } = useDepositStore();
  const { address } = useConnection();

  const { data: positionData, isLoading } = useReadContract({
    address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
    abi: ZeroBankABI,
    functionName: "userPositionInfo",
    args: [address, selectedBorrowToken?.address],
    query: {
      enabled: !!address && !!selectedBorrowToken?.address,
    },
  });

  const position = useMemo(() => {
    if (!positionData || !selectedBorrowToken) return null;

    const [
      userEthAmount,
      userStakeTokenAmount,
      userBorrowedTokenAmount,
      healthyFactor,
      price,
      liquidatedPrice,
    ] = positionData as [bigint, bigint, bigint, bigint, bigint, bigint];

    // Check if user has any position (stake or borrow)
    if (userStakeTokenAmount === 0n && userBorrowedTokenAmount === 0n) {
      return null;
    }

    const priceFormatted = formatUnits(price, 18); // Price in ETH

    // Calculate PnL or display Healthy Factor
    // Healthy Factor is scaled by 10000 (basis points?) -> 8000 is 80%
    const hfPercentage = Number(healthyFactor) / 100;

    // Determine side based on stake/borrow
    // If borrowed > 0, it's a Borrow position (Short? or just Borrow)
    // If staked > 0, it's a Stake position (Long?)
    // Let's assume Borrow = Short, Stake = Long for now, or just display "Borrow"/"Stake"
    let side = "Unknown";
    let sideColor = "text-slate-400";

    if (userBorrowedTokenAmount > 0n) {
      side = "Borrow";
      sideColor = "text-red-500";
    } else if (userStakeTokenAmount > 0n) {
      side = "Stake";
      sideColor = "text-green-500";
    }

    return {
      pair: `${selectedBorrowToken.symbol}/ETH`,
      side,
      sideColor,
      size: `${formatUnits(userBorrowedTokenAmount > 0n ? userBorrowedTokenAmount : userStakeTokenAmount, selectedBorrowToken.decimals)} ${selectedBorrowToken.symbol}`,
      entry: formatUnits(liquidatedPrice, 18), // Using Liquidated Price as Entry column for now or add a new column?
      mark: priceFormatted,
      pnl: `${hfPercentage.toFixed(2)}%`, // Using Healthy Factor as PnL column
      pnlColor: hfPercentage < 100 ? "text-red-500" : "text-green-500", // Warning if low HF
      raw: {
        userEthAmount,
        userStakeTokenAmount,
        userBorrowedTokenAmount,
        healthyFactor,
        price,
        liquidatedPrice,
      },
    };
  }, [positionData, selectedBorrowToken]);

  return (
    <div className="w-full bg-[#151320] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-white tracking-wide">
          POSITIONS
        </h2>
        <div className="flex gap-2">{/* Filters could go here */}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 text-xs font-mono uppercase border-b border-slate-800">
              <th className="py-3 px-4 font-normal">Pair</th>
              <th className="py-3 px-4 font-normal">Side</th>
              <th className="py-3 px-4 font-normal">Size</th>
              <th className="py-3 px-4 font-normal text-right">Liq. Price</th>
              <th className="py-3 px-4 font-normal text-right">
                Mark Price (ETH)
              </th>
              <th className="py-3 px-4 font-normal text-right">
                Healthy Factor
              </th>
              <th className="py-3 px-4 font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono">
            {position ? (
              <tr className="group hover:bg-[#1E1B2E] transition-colors border-b border-slate-800/50 last:border-0">
                <td className="py-4 px-4 font-bold text-white group-hover:text-purple-300 transition-colors">
                  {position.pair}
                </td>
                <td className={cn("py-4 px-4 font-medium", position.sideColor)}>
                  {position.side}
                </td>
                <td className="py-4 px-4 text-slate-300">{position.size}</td>
                <td className="py-4 px-4 text-right text-slate-300">
                  {position.entry}
                </td>
                <td className="py-4 px-4 text-right text-slate-300">
                  {position.mark}
                </td>
                <td
                  className={cn(
                    "py-4 px-4 text-right font-medium",
                    position.pnlColor,
                  )}
                >
                  {position.pnl}
                </td>
                <td className="py-4 px-4 text-right">
                  <div className="flex items-center justify-end gap-3 text-xs font-sans font-medium">
                    <button className="text-slate-400 hover:text-white transition-colors">
                      Adjust
                    </button>
                    <button className="text-red-400 hover:text-red-300 transition-colors">
                      Close
                    </button>
                  </div>
                </td>
              </tr>
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  {selectedBorrowToken
                    ? isLoading
                      ? "Loading..."
                      : "No active positions for this token"
                    : "Select a token to view positions"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
