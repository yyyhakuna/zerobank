import logo from "@src/assets/images/logo.png";
import { useAccount, useBalance } from "wagmi";
import { useAppKit } from "@reown/appkit/react";
import { formatUnits } from "viem";

export const Header = () => {
  const { address, isConnected } = useAccount();
  const { data: balance } = useBalance({
    address,
  });
  const { open } = useAppKit();

  const handleConnect = () => {
    open();
  };

  const formatAddress = (addr: string) => {
    return `${addr.slice(0, 4)}...${addr.slice(-4)}`;
  };

  return (
    <header className="flex items-center justify-between px-6 py-4 bg-[#0a0a1a] border-b border-slate-800">
      <div className="flex items-center gap-8">
        {/* Logo Placeholder - Pixel Art Style */}
        <div className="flex items-center gap-2 font-black text-2xl tracking-tighter">
          <img src={logo} alt="logo" className="w-8 h-8" />
          <span className="text-white drop-shadow-[2px_2px_0px_rgba(79,70,229,1)]">
            ZERO
          </span>
        </div>

        <nav className="hidden md:flex items-center gap-6">
          {["Short", "Vault"].map((item) => (
            <button
              key={item}
              className="text-slate-400 hover:text-white font-medium transition-colors text-sm uppercase tracking-wide"
            >
              {item}
            </button>
          ))}
        </nav>
      </div>

      <div className="flex items-center gap-4">
        {isConnected && balance && (
          <div className="hidden sm:flex items-center gap-2 bg-[#151320] border border-slate-800 rounded-lg px-3 py-1.5 text-sm">
            <span className="text-purple-400 font-mono">
              {Number(formatUnits(balance.value, balance.decimals)).toFixed(4)}{" "}
              {balance.symbol}
            </span>
          </div>
        )}

        <div
          onClick={handleConnect}
          className="flex items-center gap-2 bg-[#151320] border border-slate-800 rounded-lg px-3 py-1.5 text-sm cursor-pointer hover:border-slate-600 transition-colors"
        >
          <div
            className={`w-2 h-2 rounded-full ${isConnected ? "bg-green-500 animate-pulse" : "bg-slate-500"}`}
          ></div>
          <span className="text-slate-300 font-mono">
            {isConnected && address ? formatAddress(address) : "Connect Wallet"}
          </span>
        </div>
      </div>
    </header>
  );
};
