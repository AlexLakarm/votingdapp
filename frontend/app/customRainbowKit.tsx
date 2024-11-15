'use client'
import { getDefaultWallets, RainbowKitProvider, darkTheme } from '@rainbow-me/rainbowkit';
import '@rainbow-me/rainbowkit/styles.css';
import { createConfig, WagmiConfig } from 'wagmi';
import { http } from 'viem';
import { Chain } from 'viem';

const holeskyChain: Chain = {
  id: 17000,
  name: 'Holesky',
  nativeCurrency: {
    decimals: 18,
    name: 'Ethereum',
    symbol: 'ETH',
  },
  rpcUrls: {
    default: { http: ['https://ethereum-holesky-rpc.publicnode.com'] },
  },
  blockExplorers: {
    default: { name: 'Etherscan', url: 'https://holesky.etherscan.io' },
  },
  testnet: true,
};

const { wallets } = getDefaultWallets({
  appName: 'Voting DApp',
  projectId: 'YOUR_PROJECT_ID',
});

const config = createConfig({
  chains: [holeskyChain],
  transports: {
    [holeskyChain.id]: http(),
  },
});

export default function CustomRainbowKitProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <WagmiConfig config={config}>
      <RainbowKitProvider theme={darkTheme()}>
        {children}
      </RainbowKitProvider>
    </WagmiConfig>
  );
}