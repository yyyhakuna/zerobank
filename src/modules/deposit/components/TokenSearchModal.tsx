import React, { useState, useEffect } from "react";
import { X, Search, Loader2 } from "lucide-react";
import { useReadContracts } from "wagmi";
import { formatUnits, isAddress, erc20Abi, Address } from "viem";
import { Token, TokenSearchModalProps } from "../../../interface";
import { ZEROBANK_LAUNCHPAD_ADDRESS } from "../../../const";
import ZeroBankABI from "../../../assets/abis/ZeroBank.json";

interface TokenWithPool extends Token {
  poolInfo?: {
    ethVault: bigint;
    tokenVault: bigint;
    borrowedTokenAmount: bigint;
    borrowedRate: bigint;
  };
}

export const TokenSearchModal: React.FC<TokenSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<TokenWithPool[]>([]);

  // Validate address format
  const isValidAddress = isAddress(searchQuery);

  const { data: contractData, isLoading: isContractLoading } = useReadContracts(
    {
      contracts: [
        {
          address: ZEROBANK_LAUNCHPAD_ADDRESS,
          abi: ZeroBankABI,
          functionName: "tokenPoolInfo",
          args: [searchQuery as Address],
        },
        {
          address: searchQuery as Address,
          abi: erc20Abi,
          functionName: "symbol",
        },
        {
          address: searchQuery as Address,
          abi: erc20Abi,
          functionName: "name",
        },
        {
          address: searchQuery as Address,
          abi: erc20Abi,
          functionName: "decimals",
        },
      ],
      query: {
        enabled: isOpen && isValidAddress,
      },
    },
  );

  useEffect(() => {
    if (!isOpen) {
      setSearchQuery("");
      setSearchResults([]);
      return;
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isValidAddress) {
      setSearchResults([]);
      return;
    }

    if (contractData) {
      const [poolInfoResult, symbolResult, nameResult, decimalsResult] =
        contractData;

      if (
        poolInfoResult.status === "success" &&
        symbolResult.status === "success" &&
        decimalsResult.status === "success"
      ) {
        const [ethVault, tokenVault, borrowedTokenAmount, borrowedRate] =
          poolInfoResult.result as [bigint, bigint, bigint, bigint];

        const newToken: TokenWithPool = {
          name:
            nameResult.status === "success"
              ? (nameResult.result as string)
              : "Unknown Token",
          symbol: symbolResult.result as string,
          decimals: decimalsResult.result as number,
          address: searchQuery,
          poolInfo: {
            ethVault,
            tokenVault,
            borrowedTokenAmount,
            borrowedRate,
          },
        };
        setSearchResults([newToken]);
      } else {
        setSearchResults([]);
      }
    }
  }, [contractData, isValidAddress, searchQuery]);

  if (!isOpen) return null;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#151320] border border-slate-800 rounded-2xl overflow-hidden shadow-2xl animate-in fade-in zoom-in-95 duration-200">
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <h3 className="text-white font-bold">Select Token</h3>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 space-y-4">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              size={18}
            />
            <input
              type="text"
              value={searchQuery}
              onChange={handleSearch}
              placeholder="Search by address"
              className="w-full bg-[#0D0B14] border border-slate-800 rounded-lg py-3 pl-10 pr-4 text-white placeholder:text-slate-600 focus:outline-none focus:border-purple-500 transition-colors"
            />
          </div>

          <div className="min-h-[200px] max-h-[300px] overflow-y-auto">
            {isContractLoading && isValidAddress ? (
              <div className="flex items-center justify-center py-8 text-slate-500">
                <Loader2 className="animate-spin mr-2" /> Searching...
              </div>
            ) : searchResults.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                {isValidAddress
                  ? "No token found"
                  : "Enter a valid address to search"}
              </div>
            ) : (
              <div className="space-y-2">
                {searchResults.map((token, index) => (
                  <button
                    key={index}
                    onClick={() => {
                      onSelect(token);
                      onClose();
                    }}
                    className="w-full p-3 rounded-lg hover:bg-white/5 transition-colors group text-left border border-transparent hover:border-slate-700"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-xs font-bold text-white">
                          {token.symbol[0]}
                        </div>
                        <div>
                          <div className="text-white font-medium">
                            {token.symbol}
                          </div>
                          <div className="text-xs text-slate-400 group-hover:text-slate-300">
                            {token.name}
                          </div>
                        </div>
                      </div>
                      {token.address && (
                        <div className="text-xs text-slate-500 font-mono">
                          {token.address.slice(0, 6)}...
                          {token.address.slice(-4)}
                        </div>
                      )}
                    </div>

                    {token.poolInfo && (
                      <div className="grid grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-800/50 text-xs">
                        <div>
                          <span className="text-slate-500 block">
                            ETH Vault
                          </span>
                          <span className="text-slate-300 font-mono">
                            {formatUnits(token.poolInfo.ethVault, 18)} ETH
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">
                            Token Vault
                          </span>
                          <span className="text-slate-300 font-mono">
                            {formatUnits(
                              token.poolInfo.tokenVault,
                              token.decimals,
                            )}{" "}
                            {token.symbol}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Borrowed</span>
                          <span className="text-slate-300 font-mono">
                            {formatUnits(
                              token.poolInfo.borrowedTokenAmount,
                              token.decimals,
                            )}{" "}
                            {token.symbol}
                          </span>
                        </div>
                        <div>
                          <span className="text-slate-500 block">Rate</span>
                          <span className="text-slate-300 font-mono">
                            {(
                              Number(token.poolInfo.borrowedRate) / 100
                            ).toFixed(2)}
                            %
                          </span>
                        </div>
                      </div>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
