import { useMemo } from "react";
import { useAccount } from "wagmi";
import { useQuery } from "@tanstack/react-query";
import { useUserPositions } from "../hooks/useUserPositions";
import { useUserTokens } from "../hooks/useUserTokens";
import { fetchUserPositions } from "../../../services/positions";
import { PositionRow } from "./PositionRow";

export const PositionsTable = () => {
  const { address } = useAccount();

  const { data: backendPositions, isLoading: isBackendLoading } = useQuery({
    queryKey: ["backendPositions", address],
    queryFn: () => fetchUserPositions(address!),
    enabled: !!address,
  });

  const tokenAddresses = useMemo(
    () => backendPositions?.map((p) => p.tokenAddress) || [],
    [backendPositions],
  );

  const { tokens, isLoading: isTokensLoading } = useUserTokens(tokenAddresses);

  const {
    positions,
    isLoading: isPositionsLoading,
    refetch,
  } = useUserPositions(tokens, backendPositions ?? []);

  const isLoading = isBackendLoading || isTokensLoading || isPositionsLoading;

  return (
    <div className="w-full bg-[#151320] border border-slate-800 rounded-2xl p-6 shadow-2xl overflow-hidden">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-white tracking-wide">
            POSITIONS
          </h2>
          <p className="text-xs text-slate-500 mt-1">
            Positions with a health factor above 85% will be automatically
            liquidated.
          </p>
        </div>
        <div className="flex gap-2">{/* Filters could go here */}</div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="text-slate-400 text-xs font-mono uppercase border-b border-slate-800">
              <th className="py-3 px-4 font-normal">Pair</th>
              {/* <th className="py-3 px-4 font-normal">Side</th> */}
              <th className="py-3 px-4 font-normal">Size</th>
              <th className="py-3 px-4 font-normal text-right">
                Liquidation Price
              </th>
              <th className="py-3 px-4 font-normal text-right">Entry Price</th>
              <th className="py-3 px-4 font-normal text-right">Profit</th>
              <th className="py-3 px-4 font-normal text-right">Action</th>
            </tr>
          </thead>
          <tbody className="text-sm font-mono">
            {positions.length > 0 ? (
              positions.map((position) => (
                <PositionRow
                  key={position.token.address}
                  position={position}
                  onSuccess={refetch}
                />
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-slate-500">
                  {isLoading ? "Loading..." : "No active positions"}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
