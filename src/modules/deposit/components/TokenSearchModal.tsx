import React, { useState } from "react";
import { X, Search } from "lucide-react";
import { Token, TokenSearchModalProps } from "../../../interface";

export const TokenSearchModal: React.FC<TokenSearchModalProps> = ({
  isOpen,
  onClose,
  onSelect,
}) => {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<Token[]>([]);

  if (!isOpen) return null;

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value;
    setSearchQuery(query);

    // Mock search logic
    if (query.length > 0) {
      setSearchResults([
        {
          name: "Meme Token",
          symbol: "MEME",
          decimals: 18,
          address: query,
        },
      ]);
    } else {
      setSearchResults([]);
    }
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
            {searchResults.length === 0 ? (
              <div className="text-center text-slate-500 py-8">
                Enter an address to search
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
                    className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-white/5 transition-colors group text-left"
                  >
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
                        {token.address.slice(0, 6)}...{token.address.slice(-4)}
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
