import {
  createPublicClient,
  createWalletClient,
  defineChain,
  http,
  type Address,
  type Hex,
} from "viem";
import { privateKeyToAccount } from "viem/accounts";

import { erc20Abi, nousOracleAbi } from "./abi";
import { getNousConfig } from "./config";

const log = (...args: unknown[]) => console.log("[nous:client]", ...args);

const taikoHoodi = defineChain({
  id: 167_920,
  name: "Taiko Hoodi",
  nativeCurrency: { name: "Ether", symbol: "ETH", decimals: 18 },
  rpcUrls: {
    default: { http: ["https://rpc.hoodi.taiko.xyz"] },
  },
});

function getClients() {
  const config = getNousConfig();
  let pk = config.privateKey.trim();
  if (!pk.startsWith("0x")) {
    pk = `0x${pk}`;
  }
  log("wallet address derived from key starting with:", pk.slice(0, 6) + "...");
  const account = privateKeyToAccount(pk as Hex);

  const publicClient = createPublicClient({
    chain: taikoHoodi,
    transport: http(config.rpcUrl),
  });

  const walletClient = createWalletClient({
    account,
    chain: taikoHoodi,
    transport: http(config.rpcUrl),
  });

  return { publicClient, walletClient, account, config };
}

export async function submitOracleRequest(
  query: string,
  specifications: string,
): Promise<bigint> {
  const { publicClient, walletClient, config } = getClients();

  const deadline = BigInt(
    Math.floor(Date.now() / 1000) + config.commitDeadlineSeconds,
  );

  // Approve oracle to spend reward tokens
  log("approving", config.rewardAmount.toString(), "tokens for oracle at", config.oracleAddress);
  const approveHash = await walletClient.writeContract({
    address: config.rewardToken,
    abi: erc20Abi,
    functionName: "approve",
    args: [config.oracleAddress, config.rewardAmount],
  });
  log("approve tx:", approveHash);
  await publicClient.waitForTransactionReceipt({ hash: approveHash });
  log("approve confirmed");

  log("sending createRequest tx, deadline:", deadline.toString());
  const hash = await walletClient.writeContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "createRequest",
    args: [
      query,
      BigInt(config.numAgents),
      config.rewardAmount,
      config.bondAmount,
      deadline,
      config.rewardToken,
      "0x0000000000000000000000000000000000000000" as Address,
      specifications,
      { capabilities: ["text"], domains: [] },
    ],
  });

  log("createRequest tx:", hash);
  const receipt = await publicClient.waitForTransactionReceipt({ hash });
  log("createRequest receipt status:", receipt.status);

  if (receipt.status !== "success") {
    throw new Error("Oracle request transaction reverted");
  }

  // Parse requestId by reading nextRequestId - 1
  const nextId = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "nextRequestId",
  });

  const requestId = nextId - BigInt(1);
  log("oracle requestId:", requestId.toString());
  return requestId;
}

export async function getOraclePhase(requestId: bigint): Promise<number> {
  const { publicClient, config } = getClients();

  const phase = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "phases",
    args: [requestId],
  });

  return Number(phase);
}

export async function getOracleResolution(
  requestId: bigint,
): Promise<{ finalAnswer: Hex; finalized: boolean }> {
  const { publicClient, config } = getClients();

  const [finalAnswer, finalized] = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "getResolution",
    args: [requestId],
  });

  return { finalAnswer, finalized };
}

export async function getOracleCommitCount(
  requestId: bigint,
): Promise<number> {
  const { publicClient, config } = getClients();

  const [agents] = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "getCommits",
    args: [requestId],
  });

  return agents.length;
}

export async function getOracleRevealCount(
  requestId: bigint,
): Promise<number> {
  const { publicClient, config } = getClients();

  const [agents] = await publicClient.readContract({
    address: config.oracleAddress,
    abi: nousOracleAbi,
    functionName: "getReveals",
    args: [requestId],
  });

  return agents.length;
}

export const PHASE = {
  NONE: 0,
  COMMITTING: 1,
  REVEALING: 2,
  JUDGING: 3,
  FINALIZED: 4,
  DISTRIBUTED: 5,
  FAILED: 6,
} as const;
