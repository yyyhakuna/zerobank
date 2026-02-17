import React, { useState } from "react";
import { ArrowDown, ChevronDown } from "lucide-react";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { VALUETOKENOBJECTS } from "../../../const";
import { TokenSearchModal } from "./TokenSearchModal";
import { Token } from "../../../interface";
import { formatUnits } from "viem";
import { useBalance, useConnection } from "wagmi";
import { useDepositStore } from "../store";

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TokenInput = ({
  label,
  amount,
  setAmount,

  maxButton = false,
  tokenSelector,
}: {
  label: string;
  amount: string;
  setAmount: (val: string) => void;

  maxButton?: boolean;
  tokenSelector: React.ReactNode;
}) => {
  const { address } = useConnection();
  const { data: balance } = useBalance({
    address,
  });

  const rawBalance = balance
    ? formatUnits(balance.value, balance.decimals)
    : "0";

  const formattedBalance = parseFloat(rawBalance).toFixed(4);

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between text-xs text-slate-400 font-mono uppercase tracking-wider">
        <span>{label}</span>
        <span>
          Balance: {formattedBalance} {balance?.symbol}
        </span>
      </div>

      <div className="relative group">
        <div className="absolute inset-0 bg-gradient-to-r from-purple-600 to-blue-600 rounded-lg blur opacity-20 group-hover:opacity-40 transition-opacity"></div>
        <div className="relative flex items-center bg-[#0D0B14] border border-slate-800 rounded-lg p-1 focus-within:border-purple-500 transition-colors">
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
            className="w-full bg-transparent text-white text-lg font-mono p-3 outline-none placeholder:text-slate-600"
          />

          <div className="flex items-center gap-2 pr-2">
            {maxButton && (
              <button
                onClick={() => setAmount(rawBalance)}
                className="text-xs font-bold text-purple-400 hover:text-purple-300 bg-purple-500/10 px-2 py-1 rounded border border-purple-500/20 hover:border-purple-500/50 transition-all"
              >
                MAX
              </button>
            )}

            {tokenSelector}
          </div>
        </div>
      </div>
    </div>
  );
};

export const DepositCard = () => {
  const [depositAmount, setDepositAmount] = useState("");
  const [borrowAmount, setBorrowAmount] = useState("");

  const [selectedDepositToken, setSelectedDepositToken] = useState<Token>(
    VALUETOKENOBJECTS[0],
  );

  const { selectedBorrowToken, setSelectedBorrowToken } = useDepositStore();

  const [isDepositDropdownOpen, setIsDepositDropdownOpen] = useState(false);
  const [isBorrowModalOpen, setIsBorrowModalOpen] = useState(false);

  const ltv = 50; // Mock LTV
  const fee = 0; // Mock Fee

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="relative bg-[#151320] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
        {/* Background decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-purple-600/5 rounded-full blur-3xl -z-10"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-600/5 rounded-full blur-3xl -z-10"></div>

        <h2 className="text-xl font-bold text-white mb-6 tracking-wide flex items-center gap-2">
          <span className="text-purple-400">Deposit</span>
        </h2>

        <div className="flex flex-col gap-4 relative">
          <TokenInput
            label="Deposit Asset"
            amount={depositAmount}
            setAmount={setDepositAmount}
            maxButton={true}
            tokenSelector={
              <div className="relative">
                <button
                  onClick={() =>
                    setIsDepositDropdownOpen(!isDepositDropdownOpen)
                  }
                  className="flex items-center gap-2 bg-[#1A1B2E] hover:bg-[#252640] text-white px-3 py-1.5 rounded-md border border-slate-700 transition-colors min-w-[120px] justify-between"
                >
                  <div className="flex items-center gap-2">
                    <img
                      src={selectedDepositToken.imgsrc}
                      alt={selectedDepositToken.symbol}
                      className="w-5 h-5 rounded-full"
                    />
                    <span className="font-bold text-sm">
                      {selectedDepositToken.symbol}
                    </span>
                  </div>
                  <ChevronDown
                    size={14}
                    className={`transition-transform ${isDepositDropdownOpen ? "rotate-180" : ""}`}
                  />
                </button>

                {isDepositDropdownOpen && (
                  <>
                    <div
                      className="fixed inset-0 z-10"
                      onClick={() => setIsDepositDropdownOpen(false)}
                    ></div>
                    <div className="absolute top-full right-0 mt-2 w-full min-w-[120px] bg-[#1A1B2E] border border-slate-700 rounded-md shadow-xl z-20 overflow-hidden">
                      {VALUETOKENOBJECTS.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => {
                            setSelectedDepositToken(token);
                            setIsDepositDropdownOpen(false);
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-[#252640] text-white text-left transition-colors"
                        >
                          <img
                            src={token.imgsrc}
                            alt={token.symbol}
                            className="w-5 h-5 rounded-full"
                          />
                          <span className="font-bold text-sm">
                            {token.symbol}
                          </span>
                        </button>
                      ))}
                    </div>
                  </>
                )}
              </div>
            }
          />

          <div className="relative h-8 flex items-center justify-center z-10">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-slate-800/50"></div>
            </div>
            <div className="relative bg-[#151320] p-2 rounded-full border border-slate-800 text-slate-400 shadow-lg">
              <ArrowDown size={16} />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <h3 className="text-sm font-bold text-white mb-1 tracking-wide">
              Borrow
            </h3>
            <TokenInput
              label="Borrow Asset"
              amount={borrowAmount}
              setAmount={setBorrowAmount}
              tokenSelector={
                <button
                  onClick={() => setIsBorrowModalOpen(true)}
                  className="flex items-center gap-2 bg-[#1A1B2E] hover:bg-[#252640] text-white px-3 py-1.5 rounded-md border border-slate-700 transition-colors min-w-[120px] justify-between"
                >
                  {selectedBorrowToken ? (
                    <div className="flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-purple-600 flex items-center justify-center text-[10px]">
                        {selectedBorrowToken.symbol[0]}
                      </div>
                      <span className="font-bold text-sm">
                        {selectedBorrowToken.symbol}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm text-slate-400">Select</span>
                  )}
                  <ChevronDown size={14} />
                </button>
              }
            />
          </div>
        </div>

        {/* Stats */}
        <div className="mt-8 space-y-3 bg-[#0D0B14]/50 p-4 rounded-xl border border-slate-800/50">
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Loan to Value (LTV)</span>
            <span className="text-white font-mono">{ltv}%</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-slate-400">Borrowed Fee</span>
            <span className="text-green-400 font-mono">{fee}%</span>
          </div>
        </div>

        {/* Action Button */}
        <button className="w-full mt-6 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-purple-900/20 transform transition-all active:scale-[0.98] border border-white/10 uppercase tracking-wider">
          Short Asset
        </button>
      </div>

      <TokenSearchModal
        isOpen={isBorrowModalOpen}
        onClose={() => setIsBorrowModalOpen(false)}
        onSelect={(token) => setSelectedBorrowToken(token)}
      />
    </div>
  );
};
