export interface Token {
  name?: string;
  symbol: string;
  decimals: number;
  address?: string;
  imgsrc?: string;
  poolInfo?: {
    ethVault: bigint;
    tokenVault: bigint;
    borrowedTokenAmount: bigint;
    borrowedRate: bigint;
  };
}

export interface TokenSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
  showPoolInfo?: boolean;
  hideBasicInfo?: boolean;
}
