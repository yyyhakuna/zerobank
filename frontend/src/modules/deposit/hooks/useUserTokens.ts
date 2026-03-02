import { useReadContracts } from "wagmi";
import { Address, erc20Abi } from "viem";
import { Token } from "../../../interface";
import { useMemo } from "react";

export const useUserTokens = (addresses: string[]) => {
  const contracts = addresses.flatMap((address) => [
    {
      address: address as Address,
      abi: erc20Abi,
      functionName: "symbol",
    },
    {
      address: address as Address,
      abi: erc20Abi,
      functionName: "decimals",
    },
  ]);

  const { data, isLoading } = useReadContracts({
    contracts,
    query: {
      enabled: addresses.length > 0,
    },
  });

  const tokens = useMemo(() => {
    if (!data || data.length === 0) return [];
    
    const result: Token[] = [];
    for (let i = 0; i < addresses.length; i++) {
      const symbolResult = data[i * 2];
      const decimalsResult = data[i * 2 + 1];

      if (symbolResult.status === "success" && decimalsResult.status === "success") {
        result.push({
          address: addresses[i],
          symbol: symbolResult.result as string,
          decimals: decimalsResult.result as number,
        });
      }
    }
    return result;
  }, [data, addresses]);

  return { tokens, isLoading };
};
