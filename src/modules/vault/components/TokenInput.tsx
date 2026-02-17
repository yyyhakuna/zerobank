import { Token } from "../../../interface";

interface TokenInputProps {
  label: string;
  amount: string;
  setAmount: (val: string) => void;
  selectedToken: Token | null;
  balance: string;
  maxButton?: boolean;
  tokenSelector: React.ReactNode;
  readOnly?: boolean;
}

export const TokenInput = ({
  label,
  amount,
  setAmount,
  selectedToken,
  balance,
  maxButton = false,
  tokenSelector,
  readOnly = false,
}: TokenInputProps) => {
  const formattedBalance = selectedToken 
    ? parseFloat(balance || "0").toFixed(4)
    : "0.0000";

  return (
    <div className="flex flex-col gap-2 w-full">
      <div className="flex justify-between text-xs text-slate-400 font-mono uppercase tracking-wider">
        <span>{label}</span>
        <span>
          Balance: {formattedBalance} {selectedToken?.symbol}
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
            className="flex-1 w-0 bg-transparent text-white text-lg font-mono p-3 outline-none placeholder:text-slate-600"
            readOnly={readOnly}
          />

          <div className="flex items-center gap-2 pr-2">
            {maxButton && (
              <button
                onClick={() => setAmount(balance)}
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
