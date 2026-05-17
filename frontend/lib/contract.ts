import { createPublicClient, createWalletClient, custom, http, parseEther, formatEther, defineChain } from "viem";

export const arcTestnet = defineChain({
  id: 5042002,
  name: "Arc Testnet",
  nativeCurrency: { name: "USDC", symbol: "USDC", decimals: 18 },
  rpcUrls: { default: { http: ["https://rpc.testnet.arc.network"] } },
  blockExplorers: { default: { name: "Arcscan", url: "https://testnet.arcscan.app" } },
  testnet: true,
});

export const CONTRACT_ADDRESS = (process.env.NEXT_PUBLIC_CONTRACT_ADDRESS as `0x${string}`) || "0x0";
export const ARCSCAN = "https://testnet.arcscan.app";
export const arcscanTx = (h: string) => `${ARCSCAN}/tx/${h}`;
export const arcscanAddr = (a: string) => `${ARCSCAN}/address/${a}`;

const BOUNTY_TUPLE = { type: "tuple" as const, components: [
  { name: "id", type: "uint256" as const }, { name: "client", type: "address" as const },
  { name: "amount", type: "uint256" as const }, { name: "title", type: "string" as const },
  { name: "description", type: "string" as const }, { name: "category", type: "string" as const },
  { name: "deadline", type: "uint256" as const }, { name: "maxSubmissions", type: "uint256" as const },
  { name: "createdAt", type: "uint256" as const }, { name: "closedAt", type: "uint256" as const },
  { name: "status", type: "uint8" as const },
]};




export const ABI = [
  { name: "createBounty", type: "function", stateMutability: "payable", inputs: [
    { name: "title", type: "string" }, { name: "description", type: "string" },
    { name: "category", type: "string" }, { name: "deadline", type: "uint256" },
    { name: "maxSubmissions", type: "uint256" }], outputs: [] },
  { name: "submitWork", type: "function", stateMutability: "nonpayable", inputs: [{ name: "bountyId", type: "uint256" }, { name: "url", type: "string" }], outputs: [] },
  { name: "approveWork", type: "function", stateMutability: "nonpayable", inputs: [{ name: "bountyId", type: "uint256" }, { name: "submissionId", type: "uint256" }], outputs: [] },
  { name: "cancelBounty", type: "function", stateMutability: "nonpayable", inputs: [{ name: "bountyId", type: "uint256" }], outputs: [] },
  { name: "markDisputed", type: "function", stateMutability: "nonpayable", inputs: [{ name: "bountyId", type: "uint256" }], outputs: [] },
  { name: "getBounty", type: "function", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [BOUNTY_TUPLE] },
  { name: "getAllBounties", type: "function", stateMutability: "view", inputs: [], outputs: [{ ...BOUNTY_TUPLE, type: "tuple[]" }] },
  { name: "getBountiesByClient", type: "function", stateMutability: "view", inputs: [{ name: "client", type: "address" }], outputs: [{ ...BOUNTY_TUPLE, type: "tuple[]" }] },
  { name: "getSubmissions", type: "function", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ type: "tuple[]", components: [{ name: "id", type: "uint256" }, { name: "contributor", type: "address" }, { name: "url", type: "string" }, { name: "submittedAt", type: "uint256" }, { name: "approved", type: "bool" }] }] },
  { name: "hasSubmitted", type: "function", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }, { name: "user", type: "address" }], outputs: [{ name: "", type: "bool" }] },
  { name: "winnerOf", type: "function", stateMutability: "view", inputs: [{ name: "id", type: "uint256" }], outputs: [{ name: "", type: "address" }] },
  { name: "totalBounties", type: "function", stateMutability: "view", inputs: [], outputs: [{ name: "", type: "uint256" }] },
] as const;

export enum BountyStatus { Open = 0, Closed = 1, Cancelled = 2, Disputed = 3 }

export interface Bounty {
  id: bigint; client: `0x${string}`; amount: bigint; title: string;
  description: string; category: string; deadline: bigint; maxSubmissions: bigint;
  createdAt: bigint; closedAt: bigint; status: number;
}

export interface Submission {
  id: bigint; contributor: `0x${string}`; url: string; submittedAt: bigint; approved: boolean;
}



export const pub = () => createPublicClient({ chain: arcTestnet, transport: http("https://rpc.testnet.arc.network") });
export const wal = () => typeof window !== "undefined" && window.ethereum
  ? createWalletClient({ chain: arcTestnet, transport: custom(window.ethereum) }) : null;

export const getAllBounties = async (): Promise<Bounty[]> =>
  (await pub().readContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "getAllBounties" })) as unknown as Bounty[];

export const getBounty = async (id: bigint): Promise<Bounty> =>
  (await pub().readContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "getBounty", args: [id] })) as unknown as Bounty;

export const getSubmissions = async (id: bigint): Promise<Submission[]> =>
  (await pub().readContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "getSubmissions", args: [id] })) as unknown as Submission[];

export const getBountiesByClient = async (addr: `0x${string}`): Promise<Bounty[]> =>
  (await pub().readContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "getBountiesByClient", args: [addr] })) as unknown as Bounty[];

export const checkHasSubmitted = async (id: bigint, addr: `0x${string}`): Promise<boolean> =>
  pub().readContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "hasSubmitted", args: [id, addr] }) as unknown as Promise<boolean>;

export const getWinner = async (id: bigint): Promise<`0x${string}`> =>
  pub().readContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "winnerOf", args: [id] }) as unknown as Promise<`0x${string}`>;



export async function txCreateBounty(account: `0x${string}`, title: string, desc: string, cat: string, deadline: bigint, maxSub: bigint, amount: string) {
  return wal()!.writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "createBounty", args: [title, desc, cat, deadline, maxSub], value: parseEther(amount), account });
}
export async function txSubmitWork(account: `0x${string}`, bountyId: bigint, url: string) {
  return wal()!.writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "submitWork", args: [bountyId, url], account });
}
export async function txApproveWork(account: `0x${string}`, bountyId: bigint, subId: bigint) {
  return wal()!.writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "approveWork", args: [bountyId, subId], account });
}
export async function txCancelBounty(account: `0x${string}`, bountyId: bigint) {
  return wal()!.writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "cancelBounty", args: [bountyId], account });
}
export async function txMarkDisputed(account: `0x${string}`, bountyId: bigint) {
  return wal()!.writeContract({ address: CONTRACT_ADDRESS, abi: ABI, functionName: "markDisputed", args: [bountyId], account });
}




export const fmtUSDC = (n: bigint) => parseFloat(formatEther(n)).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });
export const shortAddr = (a: string) => `${a.slice(0, 6)}…${a.slice(-4)}`;
export const fmtDate = (ts: bigint) => !ts || ts === BigInt(0) ? "—" : new Date(Number(ts) * 1000).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
export const fmtDeadline = (ts: bigint): string => {
  if (!ts || ts === BigInt(0)) return "No deadline";
  const diff = Number(ts) * 1000 - Date.now();
  if (diff < 0) return "Expired";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  return d > 0 ? `${d}d ${h}h left` : `${h}h left`;
};
export const statusMeta = (s: number) => ([
  { label: "Open", color: "text-gold", bg: "bg-gold/10 border-gold/20", dot: "bg-gold" },
  { label: "Closed", color: "text-green", bg: "bg-green/10 border-green/20", dot: "bg-green" },
  { label: "Cancelled", color: "text-sub", bg: "bg-sub/10 border-sub/20", dot: "bg-sub" },
  { label: "Disputed", color: "text-red", bg: "bg-red/10 border-red/20", dot: "bg-red" },
][s]) ?? { label: "Unknown", color: "text-sub", bg: "bg-sub/10", dot: "bg-sub" };

export const CATEGORIES = ["Development", "Design", "Content", "Research", "Marketing", "Other"];
