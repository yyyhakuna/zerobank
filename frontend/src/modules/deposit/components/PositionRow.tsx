import { useEffect } from "react";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";
import { Address } from "viem";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@src/lib/cn";
import { ZEROBANK_ADDRESS } from "../../../const";
import ZeroBankABI from "../../../assets/abis/ZeroBank.json";
import { PositionData } from "../hooks/useUserPositions";

interface PositionRowProps {
  position: PositionData;
  onSuccess: () => void;
}

export const PositionRow = ({ position, onSuccess }: PositionRowProps) => {
  const queryClient = useQueryClient();
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
      toast.success("Position closed successfully!", { id: "close-position" });
      queryClient.invalidateQueries();
      onSuccess();
    }
    if (writeError) {
      toast.error(`Transaction failed: ${writeError.message}`, {
        id: "close-position",
      });
    }
  }, [isConfirming, isConfirmed, writeError, onSuccess, queryClient]);

  const handleClose = () => {
    try {
      if (position.side === "Stake") {
        writeContract({
          address: ZEROBANK_ADDRESS as Address,
          abi: ZeroBankABI,
          functionName: "unStakeToken",
          args: [position.token.address, position.raw.userStakeTokenAmount],
        });
      } else if (position.side === "Borrow") {
        writeContract({
          address: ZEROBANK_ADDRESS as Address,
          abi: ZeroBankABI,
          functionName: "closeTokenPosition",
          args: [position.token.address],
        });
      }
    } catch (error) {
      console.error("Failed to close position:", error);
      toast.error("Failed to initiate transaction");
    }
  };

  const isProcessing = isWritePending || isConfirming;

  return (
    <tr className="group hover:bg-[#1E1B2E] transition-colors border-b border-slate-800/50 last:border-0">
      <td className="py-4 px-4 font-bold text-white group-hover:text-purple-300 transition-colors">
        {position.pair}
      </td>
      <td className="py-4 px-4 text-slate-300">{position.size}</td>
      <td className="py-4 px-4 text-right text-slate-300">{position.liquidationPrice}</td>
      <td className="py-4 px-4 text-right text-slate-300">{position.entryPrice}</td>
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
            {isProcessing ? "Processing..." : "Close"}
          </button>
        </div>
      </td>
    </tr>
  );
};
