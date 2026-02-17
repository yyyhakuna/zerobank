import { useMemo, useEffect, useState } from "react";
import { useDepositStore } from "../store";
import {
  useConnection,
  useReadContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";
import { formatUnits, Address, erc20Abi, maxUint256 } from "viem";
import ZeroBankABI from "../../../assets/abis/ZeroBank.json";
import { ZEROBANK_LAUNCHPAD_ADDRESS } from "../../../const";
import { cn } from "@src/lib/cn";
import { toast } from "sonner";

export const PositionsTable = () => {
  const { selectedBorrowToken } = useDepositStore();
  const { address } = useConnection();
  const [isApproving, setIsApproving] = useState(false);

  const {
    writeContract,
    data: hash,
    isPending: isWritePending,
    error: writeError,
  } = useWriteContract();

  const { isLoading: isConfirming, isSuccess: isConfirmed } =
    useWaitForTransactionReceipt({
      hash,
    });

  useEffect(() => {
    if (isConfirming) {
      toast.loading("Transaction pending...", { id: "close-position" });
    }
    if (isConfirmed) {
      toast.success(
        isApproving
          ? "Approved successfully!"
          : "Position closed successfully!",
        { id: "close-position" },
      );
      if (isApproving) {
        setIsApproving(false);
        refetchAllowance();
      } else {
        refetch();
      }
    }
    if (writeError) {
      toast.error(`Transaction failed: ${writeError.message}`, {
        id: "close-position",
      });
      setIsApproving(false);
    }
  }, [isConfirming, isConfirmed, writeError, isApproving]);

  const {
    data: positionData,
    isLoading,
    refetch,
  } = useReadContract({
    address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
    abi: ZeroBankABI,
    functionName: "userPositionInfo",
    args: [address, selectedBorrowToken?.address],
    query: {
      enabled: !!address && !!selectedBorrowToken?.address,
    },
  });

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: selectedBorrowToken?.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as Address, ZEROBANK_LAUNCHPAD_ADDRESS as Address],
    query: {
      enabled: !!address && !!selectedBorrowToken?.address,
    },
  });
  console.log("allowance", allowance);

  // Refetch position data after successful transaction
  useEffect(() => {
    if (isConfirmed && !isApproving) {
      refetch();
    }
  }, [isConfirmed, refetch, isApproving]);

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
      pair: `${selectedBorrowToken.symbol}/BNB`,
      side,
      sideColor,
      size: `${Number(formatUnits(userBorrowedTokenAmount > 0n ? userBorrowedTokenAmount : userStakeTokenAmount, selectedBorrowToken.decimals)).toFixed(4)} ${selectedBorrowToken.symbol}`,
      entry: Number(formatUnits(liquidatedPrice, 18)).toFixed(8), // Using Liquidated Price as Entry column for now or add a new column?
      mark: Number(priceFormatted).toFixed(8),
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
  console.log("tokenAmount", position?.raw.userBorrowedTokenAmount);

  const needsApproval = useMemo(() => {
    if (!allowance) return true;
    if (!position || position.side !== "Borrow") return false;
    // Check if allowance is less than borrowed amount
    return allowance < position.raw.userBorrowedTokenAmount;
  }, [position, allowance]);
  console.log("needsApproval", needsApproval);

  const handleClose = () => {
    if (!position || !selectedBorrowToken) return;

    try {
      if (position.side === "Stake") {
        // Unstake all tokens
        writeContract({
          address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
          abi: ZeroBankABI,
          functionName: "unStakeToken",
          args: [
            selectedBorrowToken.address,
            position.raw.userStakeTokenAmount,
          ],
        });
      } else if (position.side === "Borrow") {
        if (needsApproval) {
          setIsApproving(true);
          writeContract({
            address: selectedBorrowToken.address as Address,
            abi: erc20Abi,
            functionName: "approve",
            args: [ZEROBANK_LAUNCHPAD_ADDRESS as Address, maxUint256],
          });
        } else {
          // Repay all tokens
          writeContract({
            address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
            abi: ZeroBankABI,
            functionName: "repayAllToken",
            args: [selectedBorrowToken.address],
          });
        }
      }
    } catch (error) {
      console.error("Failed to close position:", error);
      toast.error("Failed to initiate transaction");
      setIsApproving(false);
    }
  };

  const isProcessing = isWritePending || isConfirming;

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
              {/* <th className="py-3 px-4 font-normal">Side</th> */}
              <th className="py-3 px-4 font-normal">Size</th>
              <th className="py-3 px-4 font-normal text-right">Liq. Price</th>
              <th className="py-3 px-4 font-normal text-right">
                Mark Price (BNB)
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
                {/* <td className={cn("py-4 px-4 font-medium", position.sideColor)}>
                  {position.side}
                </td> */}
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
                    {/* <button className="text-slate-400 hover:text-white transition-colors">
                      Adjust
                    </button> */}
                    <button
                      className="text-red-400 hover:text-red-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed min-w-[60px]"
                      onClick={handleClose}
                      disabled={isProcessing}
                    >
                      {isProcessing
                        ? isApproving
                          ? "Approving..."
                          : "Processing..."
                        : needsApproval
                          ? "Approve"
                          : "Close"}
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
