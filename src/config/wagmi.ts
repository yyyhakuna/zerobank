import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { AppKitNetwork, bsc } from "@reown/appkit/networks";

// 1. Get projectId from https://cloud.reown.com
export const projectId = "3067ff61ceca278da227a0327259f32d"; // TODO: Replace with your actual Project ID

if (!projectId) {
  throw new Error("Project ID is not defined");
}

// 2. Set the networks
export const networks = [bsc] as [AppKitNetwork, ...AppKitNetwork[]];

// 3. Create Wagmi Adapter
export const wagmiAdapter = new WagmiAdapter({
  projectId,
  networks,
});

// 4. Create modal
createAppKit({
  adapters: [wagmiAdapter],
  networks,
  projectId,
  metadata: {
    name: "ZeroBank",
    description: "ZeroBank App",
    url: "https://zerobank.app", // Update with your actual URL
    icons: ["https://avatars.githubusercontent.com/u/37784886"],
  },
});
