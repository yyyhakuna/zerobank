import { useState, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { formatUnits, parseUnits, Address, erc20Abi } from "viem";
import {
  useAccount,
  useReadContract,
  useReadContracts,
  useWriteContract,
  useWaitForTransactionReceipt,
} from "wagmi";

import { Token } from "../../interface";
import { ZEROBANK_LAUNCHPAD_ADDRESS } from "../../const";
import ZeroBankABI from "../../assets/abis/ZeroBank.json";
import { TokenSearchModal } from "../deposit/components/TokenSearchModal";
import { TokenInput } from "./components/TokenInput";
import { Unstake } from "./components/unStack";

const VaultPage = () => {
  const { address } = useAccount();
  const [activeTab, setActiveTab] = useState<"stake" | "unstake">("stake");
  const [amount, setAmount] = useState("");
  const [selectedToken, setSelectedToken] = useState<Token | null>(null);
  const [isTokenModalOpen, setIsTokenModalOpen] = useState(false);
  const queryClient = useQueryClient();

  // Token Balance Read
  const { data: balanceData } = useReadContract({
    address: selectedToken?.address as Address,
    abi: erc20Abi,
    functionName: "balanceOf",
    args: [address as Address],
    query: {
      enabled: !!address && !!selectedToken?.address,
    },
  });

  const rawBalance = balanceData
    ? formatUnits(balanceData as bigint, selectedToken?.decimals || 0)
    : "0";

  // Contract Reads
  const { data: stakingData, isLoading: isPositionLoading } = useReadContracts({
    contracts: [
      {
        address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
        abi: ZeroBankABI,
        functionName: "userStakeTokenShare",
        args: [address as Address, selectedToken?.address as Address],
      },
      {
        address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
        abi: ZeroBankABI,
        functionName: "stakingReserve",
        args: [selectedToken?.address as Address],
      },
      {
        address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
        abi: ZeroBankABI,
        functionName: "stakeTokenShareTotalSupply",
        args: [selectedToken?.address as Address],
      },
    ],
    query: {
      enabled: !!address && !!selectedToken?.address,
    },
  });

  const { data: allowance } = useReadContract({
    address: selectedToken?.address as Address,
    abi: erc20Abi,
    functionName: "allowance",
    args: [address as Address, ZEROBANK_LAUNCHPAD_ADDRESS as Address],
    query: {
      enabled: !!address && !!selectedToken?.address,
    },
  });

  // Contract Writes
  const {
    writeContract: writeApprove,
    data: approveHash,
    isPending: isApprovePending,
  } = useWriteContract();

  const {
    writeContract: writeStake,
    data: stakeHash,
    isPending: isStakePending,
  } = useWriteContract();

  // Transaction Status
  const { isLoading: isApproveConfirming, isSuccess: isApproveConfirmed } =
    useWaitForTransactionReceipt({ hash: approveHash });

  const { isLoading: isStakeConfirming, isSuccess: isStakeConfirmed } =
    useWaitForTransactionReceipt({ hash: stakeHash });

  useEffect(() => {
    if (isApproveConfirmed) {
      toast.success("Approve Successful!");
      queryClient.invalidateQueries();
    }
  }, [isApproveConfirmed, queryClient]);

  useEffect(() => {
    if (isStakeConfirmed) {
      toast.success("Stake Successful!");
      setAmount("");
      queryClient.invalidateQueries();
    }
  }, [isStakeConfirmed, queryClient]);

  const handleAction = () => {
    if (!selectedToken?.address || !amount) return;

    const amountBigInt = parseUnits(amount, selectedToken?.decimals);

    if (!allowance || allowance < amountBigInt) {
      writeApprove({
        address: selectedToken?.address as Address,
        abi: erc20Abi,
        functionName: "approve",
        args: [ZEROBANK_LAUNCHPAD_ADDRESS as Address, amountBigInt],
      });
    } else {
      writeStake({
        address: ZEROBANK_LAUNCHPAD_ADDRESS as Address,
        abi: ZeroBankABI,
        functionName: "stakeToken",
        args: [selectedToken?.address as Address, amountBigInt],
      });
    }
  };

  const isApproved =
    allowance &&
    amount &&
    parseUnits(amount, selectedToken?.decimals || 0) <= allowance;
  const isLoading =
    isApprovePending ||
    isApproveConfirming ||
    isStakePending ||
    isStakeConfirming;

  // Parse Position Data
  const userShare = (stakingData?.[0]?.result as bigint) || BigInt(0);
  const totalReserve = (stakingData?.[1]?.result as bigint) || BigInt(0);
  const totalSupply = (stakingData?.[2]?.result as bigint) || BigInt(0);

  const stakedAmountRaw =
    totalSupply === BigInt(0)
      ? BigInt(0)
      : (userShare * totalReserve) / totalSupply;

  const stakedAmount = formatUnits(
    stakedAmountRaw,
    selectedToken?.decimals || 0,
  );

  return (
    <main className="container mx-auto px-4 py-8 lg:py-12 flex flex-col items-center gap-8">
      {/* Tabs */}
      <div className="flex p-1 bg-[#151320] border border-slate-800 rounded-xl">
        <button
          onClick={() => setActiveTab("stake")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "stake"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Stake
        </button>
        <button
          onClick={() => setActiveTab("unstake")}
          className={`px-6 py-2 rounded-lg text-sm font-medium transition-all ${
            activeTab === "unstake"
              ? "bg-purple-600 text-white shadow-lg shadow-purple-900/20"
              : "text-slate-400 hover:text-white"
          }`}
        >
          Unstake
        </button>
      </div>

      {/* Content */}
      {activeTab === "stake" ? (
        <div className="w-full max-w-md relative bg-[#151320] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -z-10"></div>
          <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>

          <h2 className="text-xl font-bold text-white mb-6 tracking-wide flex items-center gap-2">
            <span className="text-purple-400">Stake</span>
          </h2>

          <div className="flex flex-col gap-6">
            <TokenInput
              label="Stake Amount"
              amount={amount}
              setAmount={setAmount}
              selectedToken={selectedToken}
              balance={rawBalance}
              maxButton={true}
              tokenSelector={
                <button
                  onClick={() => setIsTokenModalOpen(true)}
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
              onClick={handleAction}
              disabled={isLoading || !amount || !selectedToken?.address}
              className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-bold rounded-xl hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-purple-900/20 flex items-center justify-center gap-2"
            >
              {isLoading && <Loader2 className="animate-spin" size={20} />}
              {!amount ? "Enter Amount" : isApproved ? "Stake" : "Approve"}
            </button>
          </div>
        </div>
      ) : (
        <Unstake
          selectedToken={selectedToken}
          onSelectToken={() => setIsTokenModalOpen(true)}
          stakedBalance={stakedAmount}
          totalSupply={totalSupply}
          totalReserve={totalReserve}
          userShare={userShare}
        />
      )}

      {/* Position Info */}
      <div className="w-full max-w-md bg-[#0D0B14] border border-slate-800 rounded-xl p-6">
        <h3 className="text-slate-400 text-sm font-mono uppercase mb-4">
          Your Position
        </h3>

        <div className="flex justify-between items-center py-3 border-b border-slate-800/50">
          <span className="text-slate-300">Staked Balance</span>
          <span className="text-white font-mono text-lg">
            {isPositionLoading ? (
              <div className="h-6 w-24 bg-slate-800 rounded animate-pulse" />
            ) : (
              `${parseFloat(stakedAmount).toFixed(4)} ${selectedToken?.symbol ?? ""}`
            )}
          </span>
        </div>

        {/* Additional info can be added here */}
      </div>

      <TokenSearchModal
        isOpen={isTokenModalOpen}
        onClose={() => setIsTokenModalOpen(false)}
        onSelect={(token) => {
          setSelectedToken(token);
          setAmount("");
        }}
      />
    </main>
  );
};

export default VaultPage;
