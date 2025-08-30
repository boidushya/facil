export function shortenAddress(addr: string, chars = 4) {
  if (!addr?.startsWith("0x") || addr.length < 2 * chars + 2) return addr
  return `${addr.slice(0, 2 + chars)}…${addr.slice(-chars)}`
}
