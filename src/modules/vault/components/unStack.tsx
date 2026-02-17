import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { parseUnits, Address } from "viem";
import { useWriteContract, useWaitForTransactionReceipt } from "wagmi";

import { Token } from "../../../interface";
import { ZEROBANK_LAUNCHPAD_ADDRESS } from "@src/const";
import ZeroBankABI from "@src/assets/abis/ZeroBank.json";
import { TokenInput } from "./TokenInput";

interface UnstakeProps {
  selectedToken: Token | null;
  onSelectToken: () => void;
  stakedBalance: string;
  totalSupply: bigint;
  totalReserve: bigint;
  userShare: bigint;
}

export const Unstake = ({
  selectedToken,
  onSelectToken,
  stakedBalance,
  totalSupply,
  totalReserve,
  userShare,
}: UnstakeProps) => {
  const [amount, setAmount] = useState("");
  const queryClient = useQueryClient();

  const {
    writeContract: writeUnstake,
    data: unstakeHash,
    isPending: isUnstakePending,
  } = useWriteContract();

  const { isLoading: isUnstakeConfirming, isSuccess: isUnstakeConfirmed } =
    useWaitForTransactionReceipt({ hash: unstakeHash });

  useEffect(() => {
    if (isUnstakeConfirmed) {
      toast.success("Unstake Successful!");
      setAmount("");
      queryClient.invalidateQueries();
    }
  }, [isUnstakeConfirmed, queryClient]);

  const handleUnstake = () => {
    if (!selectedToken?.address || !amount) return;

    // Calculate share amount
    const amountBigInt = parseUnits(amount, selectedToken.decimals);

    // Safety check
    if (totalReserve === BigInt(0)) return;

    let shareAmount: bigint;

    // If unstaking everything (or very close), just use the full user share
    // Comparing strings to handle "MAX" button usage which sets amount to balance string
    if (amount === stakedBalance) {
      shareAmount = userShare;
    } else {
      // Share = Amount * TotalSupply / TotalReserve
      shareAmount = (amountBigInt * totalSupply) / totalReserve;
    }

    writeUnstake({
      address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
      abi: ZeroBankABI,
      functionName: "unStakeToken",
      args: [selectedToken.address as Address, shareAmount],
    });
  };

  const isLoading = isUnstakePending || isUnstakeConfirming;

  return (
    <div className="w-full max-w-md relative bg-[#151320] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>

      <h2 className="text-xl font-bold text-white mb-6 tracking-wide flex items-center gap-2">
        <span className="text-purple-400">Unstake</span>
      </h2>

      <div className="flex flex-col gap-6">
        <TokenInput
          label="Unstake Amount"
          amount={amount}
          setAmount={setAmount}
          selectedToken={selectedToken}
          balance={stakedBalance}
          maxButton={true}
          tokenSelector={
            <button
              onClick={onSelectToken}
              className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white px-3 py-1.5 rounded-lg transition-colors border border-slate-700 whitespace-nowrap"
            >
              {selectedToken?.imgsrc && (
                <img
                  src={selectedToken.imgsrc}
                  alt={selectedToken.symbol}
                  className="w-5 h-5 rounded-full"
                />
              )}
              <span className="font-medium truncate w-20">
                {selectedToken?.symbol || "Select"}
              </span>
              <ChevronDown size={14} className="text-slate-400" />
            </button>
          }
        />

        <button
          onClick={handleUnstake}
          disabled={isLoading || !amount || !selectedToken?.address}
          className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
        >
          {isLoading && <Loader2 className="animate-spin" size={20} />}
          {!amount ? "Enter Amount" : "Unstake"}
        </button>
      </div>
    </div>
  );
};
