"use client";

import useSWR from "swr";
import { http, createPublicClient, formatEther } from "viem";
import { bscTestnet, sepolia } from "viem/chains";

const sepoliaClient = createPublicClient({
  chain: sepolia,
  transport: http("https://ethereum-sepolia-rpc.publicnode.com", {
    timeout: 10_000,
  }),
});

const bscTClient = createPublicClient({
  chain: bscTestnet,
  transport: http("https://bsc-testnet-rpc.publicnode.com", {
    timeout: 10_000,
  }),
});

async function fetchBalances(key: [string, `0x${string}`]) {
  const [, address] = key;

  if (!address || typeof address !== "string" || !address.startsWith("0x") || address.length !== 42) {
    throw new Error(`Invalid address format: ${address}`);
  }

  const fetchSepoliaBalance = async () => {
    try {
      const balance = await sepoliaClient.getBalance({ address });
      return `${formatEther(balance)} ETH`;
    } catch (error) {
      console.error("Sepolia balance fetch error:", error);
      return "Error fetching";
    }
  };

  const fetchBscBalance = async () => {
    try {
      const balance = await bscTClient.getBalance({ address });
      return `${formatEther(balance)} BNB`;
    } catch (error) {
      console.error("BSC balance fetch error:", error);
      return "Error fetching";
    }
  };

  const [sepoliaBalance, bscBalance] = await Promise.all([fetchSepoliaBalance(), fetchBscBalance()]);

  const result = {
    sepolia: sepoliaBalance,
    bscTestnet: bscBalance,
  };

  return result;
}

export function useBalances(address: string) {
  const isHex = address && /^0x[a-fA-F0-9]{40}$/.test(address);

  return useSWR(isHex ? ["balances", address as `0x${string}`] : null, fetchBalances);
}
