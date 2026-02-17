export interface Token {
  name?: string;
  symbol: string;
  decimals: number;
  address?: string;
  imgsrc?: string;
}

export interface TokenSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (token: Token) => void;
}
