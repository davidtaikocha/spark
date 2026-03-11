-- CreateTable
CREATE TABLE "Agent" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "vibeTags" JSONB NOT NULL,
    "personalityTags" JSONB NOT NULL,
    "weirdHook" TEXT,
    "portraitUrl" TEXT,
    "portraitPrompt" TEXT,
    "portraitStatus" TEXT NOT NULL DEFAULT 'pending',
    "sourceType" TEXT NOT NULL,
    "visibility" TEXT NOT NULL DEFAULT 'public',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Agent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Match" (
    "id" TEXT NOT NULL,
    "agentAId" TEXT NOT NULL,
    "agentBId" TEXT NOT NULL,
    "selectionMode" TEXT NOT NULL,
    "chemistryScore" INTEGER,
    "contrastScore" INTEGER,
    "storyabilityScore" INTEGER,
    "recommendationReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Match_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Episode" (
    "id" TEXT NOT NULL,
    "matchId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "tone" TEXT NOT NULL,
    "setting" TEXT NOT NULL,
    "beats" JSONB NOT NULL,
    "ending" TEXT NOT NULL,
    "shareSummary" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "comicUrl" TEXT,
    "comicStatus" TEXT NOT NULL DEFAULT 'pending',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Episode_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_agentAId_fkey" FOREIGN KEY ("agentAId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Match" ADD CONSTRAINT "Match_agentBId_fkey" FOREIGN KEY ("agentBId") REFERENCES "Agent"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Episode" ADD CONSTRAINT "Episode_matchId_fkey" FOREIGN KEY ("matchId") REFERENCES "Match"("id") ON DELETE CASCADE ON UPDATE CASCADE;
