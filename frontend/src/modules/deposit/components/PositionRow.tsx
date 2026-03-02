import { useState, useMemo, useEffect } from "react";
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useReadContract,
  useConnection,
} from "wagmi";
import { Address, erc20Abi, maxUint256 } from "viem";
import { toast } from "sonner";
import { cn } from "@src/lib/cn";
import { ZEROBANK_LAUNCHPAD_ADDRESS } from "../../../const";
import ZeroBankABI from "../../../assets/abis/ZeroBank.json";
import { PositionData } from "../hooks/useUserPositions";

interface PositionRowProps {
  position: PositionData;
  onSuccess: () => void;
}

export const PositionRow = ({ position, onSuccess }: PositionRowProps) => {
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

  const { data: allowance, refetch: refetchAllowance } = useReadContract({
    address: position.token.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as Address, ZEROBANK_LAUNCHPAD_ADDRESS as Address],
    query: {
      enabled: !!address && !!position.token.address,
    },
  });

  const needsApproval = useMemo(() => {
    if (allowance === undefined) return true;
    if (position.side !== "Borrow") return false;
    return allowance < position.raw.userBorrowedTokenAmount;
  }, [position, allowance]);

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
        onSuccess();
      }
    }
    if (writeError) {
      toast.error(`Transaction failed: ${writeError.message}`, {
        id: "close-position",
      });
      setIsApproving(false);
    }
  }, [
    isConfirming,
    isConfirmed,
    writeError,
    isApproving,
    onSuccess,
    refetchAllowance,
  ]);

  const handleClose = () => {
    try {
      if (position.side === "Stake") {
        writeContract({
          address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
          abi: ZeroBankABI,
          functionName: "unStakeToken",
          args: [position.token.address, position.raw.userStakeTokenAmount],
        });
      } else if (position.side === "Borrow") {
        if (needsApproval) {
          setIsApproving(true);
          writeContract({
            address: position.token.address as Address,
            abi: erc20Abi,
            functionName: "approve",
            args: [ZEROBANK_LAUNCHPAD_ADDRESS as Address, maxUint256],
          });
        } else {
          writeContract({
            address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
            abi: ZeroBankABI,
            functionName: "repayAllToken",
            args: [position.token.address],
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
    <tr className="group hover:bg-[#1E1B2E] transition-colors border-b border-slate-800/50 last:border-0">
      <td className="py-4 px-4 font-bold text-white group-hover:text-purple-300 transition-colors">
        {position.pair}
      </td>
      <td className="py-4 px-4 text-slate-300">{position.size}</td>
      <td className="py-4 px-4 text-right text-slate-300">{position.entry}</td>
      <td className="py-4 px-4 text-right text-slate-300">{position.mark}</td>
      <td className={cn("py-4 px-4 text-right font-medium", position.pnlColor)}>
        {position.pnl}
      </td>
      <td className="py-4 px-4 text-right">
        <div className="flex items-center justify-end gap-3 text-xs font-sans font-medium">
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
  );
};
