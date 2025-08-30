"use client"

import useSWR from "swr"
import { createPublicClient, formatEther, http } from "viem"
import { sepolia, bscTestnet } from "viem/chains"

const sepoliaClient = createPublicClient({
  chain: {
    ...sepolia,
    rpcUrls: {
      ...sepolia.rpcUrls,
      default: { http: ["https://ethereum-sepolia.publicnode.com"] },
      public: { http: ["https://ethereum-sepolia.publicnode.com"] },
    },
  },
  transport: http("https://ethereum-sepolia.publicnode.com"),
})

const bscTClient = createPublicClient({
  chain: {
    ...bscTestnet,
    rpcUrls: {
      ...bscTestnet.rpcUrls,
      default: { http: ["https://bsc-testnet.publicnode.com"] },
      public: { http: ["https://bsc-testnet.publicnode.com"] },
    },
  },
  transport: http("https://bsc-testnet.publicnode.com"),
})

async function fetchBalances(_: string, address: `0x${string}`) {
  const [ethBal, bnbBal] = await Promise.all([
    sepoliaClient.getBalance({ address }),
    bscTClient.getBalance({ address }),
  ])
  return {
    sepolia: `${formatEther(ethBal)} ETH`,
    bscTestnet: `${formatEther(bnbBal)} BNB`,
  }
}

export function useBalances(address: string) {
  const isHex = /^0x[a-fA-F0-9]{40}$/.test(address)
  return useSWR(isHex ? ["balances", address as `0x${string}`] : null, fetchBalances, {
    revalidateOnFocus: false,
  })
}
