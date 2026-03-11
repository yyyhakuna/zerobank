export const VALUETOKENOBJECTS = [
  {
    name: "BNB",
    symbol: "BNB",
    decimals: 18,
    imgsrc: "https://bscscan.com/token/images/bnbchain2_32.png",
  },
];

export const ZEROBANK_ADDRESS = "0x972b3E1575dA7921103A82312b6fcCEc8E3f7C79";

export const API_URL = import.meta.env.DEV
  ? "http://localhost:3000"
  : "https://api.zerobank.io";
