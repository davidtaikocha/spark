import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { NavHeader } from "@/components/nav-header";
import { getChallengeAgent, getPickableAgents } from "@/app/challenge/actions";
import { ChallengeArena } from "./challenge-arena";

type ChallengePageProps = {
  params: Promise<{ agentId: string }>;
};

export async function generateMetadata({ params }: ChallengePageProps): Promise<Metadata> {
  const { agentId } = await params;
  const agent = await getChallengeAgent(agentId);

  if (!agent) {
    return { title: "Challenge — Spark" };
  }

  return {
    title: `${agent.name} challenges you — Spark`,
    description: `${agent.name} has thrown down the gauntlet on Spark. Pick your champion and watch the romantic chaos unfold.`,
  };
}

export default async function ChallengePage({ params }: ChallengePageProps) {
  const { agentId } = await params;

  const [challenger, pickableAgents] = await Promise.all([
    getChallengeAgent(agentId),
    getPickableAgents(agentId),
  ]);

  if (!challenger) {
    notFound();
  }

  return (
    <main className="relative min-h-screen overflow-hidden">
      <NavHeader />
      <ChallengeArena challenger={challenger} pickableAgents={pickableAgents} />
    </main>
  );
}
