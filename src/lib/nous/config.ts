import type { Address } from "viem";

function env(key: string, fallback: string): string {
  return (process.env[key] || fallback).trim();
}

export function getNousConfig() {
  return {
    rpcUrl: env("NOUS_RPC_URL", "https://rpc.hoodi.taiko.xyz"),
    oracleAddress: env("NOUS_ORACLE_ADDRESS", "0x9a78aD39f2cA73059e7C7963Dd0D49e46f404434") as Address,
    privateKey: env("NOUS_PRIVATE_KEY", ""),
    bondAmount: BigInt(env("NOUS_BOND_AMOUNT", "100000000000000")),
    rewardAmount: BigInt(env("NOUS_REWARD_AMOUNT", "1000000000000000000")),
    rewardToken: env("NOUS_REWARD_TOKEN", "0x557f5b2b222f1f59f94682df01d35dd11f37939a") as Address,
    commitDeadlineSeconds: Number(env("NOUS_COMMIT_DEADLINE_SECONDS", "120")),
    numAgents: Number(env("NOUS_NUM_AGENTS", "3")),
  };
}

export function nousEnabled(): boolean {
  return Boolean(process.env.NOUS_PRIVATE_KEY);
}
