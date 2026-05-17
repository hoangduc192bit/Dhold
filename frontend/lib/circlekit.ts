import { erc20Abi, createPublicClient, createWalletClient, custom, formatUnits, http, isAddress, parseUnits } from "viem";
import { arcTestnet, arcscanTx } from "./contract";

export const ARC_USDC = "0x3600000000000000000000000000000000000000" as `0x${string}`;
export const ARC_EURC = "0x89B50855Aa3bE2F677cD6303Cec089B5F319D72a" as `0x${string}`;
export const TOKENS = [
  { symbol: "USDC", address: ARC_USDC, decimals: 6 },
  { symbol: "EURC", address: ARC_EURC, decimals: 6 },
] as const;

export const BRIDGE_CHAINS = [
  "Arc_Testnet",
  "Ethereum_Sepolia",
  "Base_Sepolia",
  "Arbitrum_Sepolia",
  "Optimism_Sepolia",
  "Polygon_Amoy",
  "Avalanche_Fuji",
] as const;

export type TokenSymbol = typeof TOKENS[number]["symbol"];

type AnyRecord = Record<string, any>;


let proxyInstalled = false;
function installCircleProxyIfConfigured() {
  const proxy = process.env.NEXT_PUBLIC_CIRCLE_PROXY_URL;
  if (proxyInstalled || typeof window === "undefined" || !proxy) return;
  const originalFetch = window.fetch.bind(window);
  window.fetch = ((input: RequestInfo | URL, init?: RequestInit) => {
    const url = typeof input === "string" ? input : input instanceof URL ? input.toString() : input.url;
    if (url.startsWith("https://api.circle.com/") || url.startsWith("https://api-sandbox.circle.com/")) {
      const domain = url.startsWith("https://api-sandbox.circle.com/") ? "https://api-sandbox.circle.com" : "https://api.circle.com";
      const nextUrl = proxy.replace(/\/$/, "") + url.replace(domain, "");
      return originalFetch(nextUrl, init);
    }
    return originalFetch(input as RequestInfo, init);
  }) as typeof window.fetch;
  proxyInstalled = true;
}

function getKitKey() {
  const key = process.env.NEXT_PUBLIC_CIRCLE_KIT_KEY;
  if (!key) throw new Error("Missing NEXT_PUBLIC_CIRCLE_KIT_KEY. Add it to frontend/.env.local");
  return key;
}

export function stringifyResult(result: unknown) {
  return JSON.stringify(result, (_, value) => typeof value === "bigint" ? value.toString() : value, 2);
}

export function findTxHash(result: unknown): string | null {
  const seen = new Set<unknown>();
  const walk = (v: unknown): string | null => {
    if (!v || typeof v !== "object") return typeof v === "string" && v.startsWith("0x") && v.length >= 66 ? v : null;
    if (seen.has(v)) return null;
    seen.add(v);
    for (const [key, val] of Object.entries(v as AnyRecord)) {
      if (/hash|tx|transaction/i.test(key) && typeof val === "string" && val.startsWith("0x")) return val;
      const nested = walk(val);
      if (nested) return nested;
    }
    return null;
  };
  return walk(result);
}

export async function getBrowserAdapter() {
  if (typeof window === "undefined" || !window.ethereum) throw new Error("No browser wallet found");
  const mod = await import("@circle-fin/adapter-viem-v2");
  const provider = window.ethereum as any;
  return mod.createViemAdapterFromProvider({
    provider,
    capabilities: { addressContext: "user-controlled" },
  } as any);
}

export async function getAppKit() {
  installCircleProxyIfConfigured();
  const mod = await import("@circle-fin/app-kit");
  return new mod.AppKit();
}

export async function readTokenBalance(account: `0x${string}`, token: TokenSymbol = "USDC") {
  const t = TOKENS.find(x => x.symbol === token)!;
  const client = createPublicClient({ chain: arcTestnet, transport: http(arcTestnet.rpcUrls.default.http[0]) });
  const raw = await client.readContract({ address: t.address, abi: erc20Abi, functionName: "balanceOf", args: [account] });
  return formatUnits(raw, t.decimals);
}

export async function appKitSend(params: { to: string; amount: string; token?: TokenSymbol }) {
  if (!isAddress(params.to)) throw new Error("Invalid recipient address");
  const adapter = await getBrowserAdapter();
  const kit = await getAppKit();
  const sendParams = {
    from: { adapter, chain: "Arc_Testnet" },
    to: params.to,
    amount: params.amount,
    token: params.token || "USDC",
  } as any;
  if (typeof (kit as AnyRecord).estimateSend === "function") await (kit as AnyRecord).estimateSend(sendParams);
  return (kit as AnyRecord).send(sendParams);
}

export async function appKitSwap(params: { tokenIn: TokenSymbol; tokenOut: TokenSymbol; amountIn: string; slippageBps?: number }) {
  if (params.tokenIn === params.tokenOut) throw new Error("Choose two different tokens");
  const adapter = await getBrowserAdapter();
  const kit = await getAppKit();
  const swapParams = {
    from: { adapter, chain: "Arc_Testnet" },
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    config: { kitKey: getKitKey(), slippageBps: params.slippageBps ?? 300, allowanceStrategy: "permit" },
  } as any;
  return (kit as AnyRecord).swap(swapParams);
}

export async function appKitEstimateSwap(params: { tokenIn: TokenSymbol; tokenOut: TokenSymbol; amountIn: string; slippageBps?: number }) {
  const adapter = await getBrowserAdapter();
  const kit = await getAppKit();
  return (kit as AnyRecord).estimateSwap({
    from: { adapter, chain: "Arc_Testnet" },
    tokenIn: params.tokenIn,
    tokenOut: params.tokenOut,
    amountIn: params.amountIn,
    config: { kitKey: getKitKey(), slippageBps: params.slippageBps ?? 300, allowanceStrategy: "permit" },
  } as any);
}

export async function appKitBridge(params: { fromChain: string; toChain: string; amount: string; useForwarder?: boolean }) {
  if (params.fromChain === params.toChain) throw new Error("Choose two different chains");
  const adapter = await getBrowserAdapter();
  const kit = await getAppKit();
  const bridgeParams = {
    from: { adapter, chain: params.fromChain },
    to: { adapter, chain: params.toChain },
    amount: params.amount,
    token: "USDC",
    config: { useForwarder: params.useForwarder ?? true },
  } as any;
  return (kit as AnyRecord).bridge(bridgeParams);
}

export async function fallbackErc20Send(params: { account: `0x${string}`; to: `0x${string}`; amount: string; token?: TokenSymbol }) {
  const t = TOKENS.find(x => x.symbol === (params.token || "USDC"))!;
  const wc = createWalletClient({ chain: arcTestnet, transport: custom(window.ethereum!) });
  return wc.writeContract({
    address: t.address,
    abi: erc20Abi,
    functionName: "transfer",
    args: [params.to, parseUnits(params.amount, t.decimals)],
    account: params.account,
  });
}

export function resultExplorer(result: unknown) {
  const h = findTxHash(result);
  return h ? arcscanTx(h) : null;
}
