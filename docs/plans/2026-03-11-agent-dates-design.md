# Agent Dates Design

**Date:** 2026-03-11

## Summary

Agent Dates is a humor-first social app where users create fictional agents, pair them with other agents, and generate short, shareable date episodes for entertainment. The product is optimized for laughs and social sharing rather than realistic compatibility or deep roleplay.

The core V1 loop is:

1. Create an agent profile.
2. Generate a portrait for that agent.
3. Choose a date manually or accept a recommendation.
4. Generate a short date episode.
5. Share the episode as a post.

## Goals

- Make agent creation fast, funny, and expressive.
- Produce date stories that are consistently entertaining enough to share.
- Support both manual pairing and recommendation-driven pairing.
- Establish a story structure that can later drive image generation and short-form video generation.
- Seed the product with enough content to feel alive on day one.

## Non-Goals For V1

- Full video generation.
- Rich interactive chat between agents.
- Realistic dating simulation.
- Private relationship simulators based on real people.
- Deep creator tooling for scene-by-scene editing.

## Product Positioning

This should feel like a social toy for laughs. Users browse a gallery of odd, charming, or absurd fictional agents and generate entertaining date stories between them. The primary share unit is the generated episode, not just the profile.

## Core User Experience

### 1. Create Agent

Users create an agent with:

- A name.
- A freeform text description that covers appearance and personality.
- A small set of structured tags.
- An optional weird hook that gives the character a memorable comedic trait.

The system converts that input into a normalized internal profile, then generates a portrait automatically in a consistent cute-illustrated style.

### 2. Browse Or Match

Users can:

- Browse public agents.
- Select another agent manually for a date.
- Ask the system to recommend a match.

The app should launch with a seeded house roster plus public user-created agents so recommendations and browsing feel good immediately.

### 3. Generate Episode

Once two agents are paired, the story system generates a short date episode with:

- A title.
- A tone classification.
- A setting.
- Four to six story beats.
- An ending.
- A short share summary.

The visible output can be polished prose, but the internal representation should be structured so later image and video features can map onto the same episode beats.

### 4. Share Result

Episodes are saved as posts and can appear in:

- The main feed.
- Each agent's profile.
- Share cards or exported snippets later.

## Recommended Tone Model

The default tone should be mixed rather than fixed. Stories should be able to land anywhere across:

- Sweet chemistry.
- Awkward comedy.
- Surreal chaos.
- Disastrous mismatch.
- Unexpected tenderness.

This range improves replay value and makes the output more socially interesting than always aiming for romance.

## Core Objects

### Agent

Required fields:

- `id`
- `name`
- `description`
- `vibe_tags`
- `personality_tags`
- `weird_hook`
- `portrait_url`
- `portrait_prompt`
- `source_type` such as house or user
- `visibility`

Optional later fields:

- `avatar_variants`
- `previous_episode_count`
- `likes`

### Match

Required fields:

- `agent_a_id`
- `agent_b_id`
- `selection_mode` such as manual or recommended
- `chemistry_score`
- `contrast_score`
- `storyability_score`
- `recommendation_reason`

### Episode

Required fields:

- `id`
- `match_id`
- `title`
- `tone`
- `setting`
- `beats`
- `ending`
- `share_summary`
- `status`

`beats` should be a structured sequence rather than a single body blob so later media generation can target specific scenes.

## Recommendation Strategy

Recommendation should optimize for entertainment, not realism. The system should consider:

- Contrast between personalities.
- Potential chemistry.
- Comedic tension.
- Novelty.
- Clarity of story premise.

The ranking model should intentionally allow both compatible and chaotic pairings. Funny mismatch is a feature, not a failure.

## Generation Pipeline

### Agent Pipeline

1. User submits a profile prompt plus structured fields.
2. The system extracts normalized profile attributes.
3. The system derives a portrait prompt.
4. The system generates a cute-illustrated portrait.
5. The finished agent card becomes browseable.

Portrait generation should be asynchronous. A failed portrait should not invalidate the agent record. The user should still be able to proceed and optionally reroll the image.

### Episode Pipeline

1. User selects or accepts a match.
2. The system computes match signals and recommendation metadata.
3. The story generator produces a structured episode.
4. The app renders that episode into user-facing prose and share metadata.
5. The result is stored as a post for feed and profile views.

## Screens In V1

### Home Feed

- Recent generated episodes.
- Highlighted funny or popular matchups.
- Entry points into agent browsing and creation.

### Create Agent

- Name input.
- Freeform description.
- Structured tags.
- Weird hook.
- Preview or loading state for generated portrait.

### Agent Profile

- Portrait.
- Description.
- Tags.
- Previous generated episodes.
- Match action.

### Match Screen

- Manual selection flow.
- Recommended candidates.
- Lightweight reasons for recommendation.

### Episode Result

- Episode title.
- Tone badge.
- Story beats rendered as readable prose.
- Share action.
- Regenerate option later if needed.

## Error Handling

The system should degrade gracefully:

- If portrait generation fails, create the agent anyway and show a retry state.
- If recommendation ranking fails, allow manual match selection.
- If episode generation fails, preserve the match and offer retry.
- If user input is weak or ambiguous, normalize aggressively and fall back to safe defaults.

## Safety And Moderation

V1 should focus on fictional, obviously synthetic characters. Guardrails should include:

- Block or heavily restrict real-person dating simulation.
- Filter hateful, abusive, or sexualized content.
- Favor stylized portraits over realistic ones.
- Avoid making generated characters look like identifiable real individuals.

This reduces moderation complexity and keeps the product aligned with entertainment rather than impersonation.

## Quality Strategy

The main risk is weak output quality. To mitigate that:

- Seed a curated house roster.
- Normalize user input into a controlled schema before generation.
- Constrain story output to a compact episode format.
- Store enough internal structure to tune quality later.
- Track quality signals such as rerolls, shares, and engagement in later iterations.

## Future Expansion

If V1 stories are good, the same structure can drive later features:

- Multi-image scene generation from episode beats.
- Motion-comic style summaries.
- Sub-60-second video generation.
- More advanced recommendation systems.
- Remixing, voting, and social ranking.

## Open Product Decisions For Later

- Whether users can regenerate stories freely or under quotas.
- Whether public agents can be forked or remixed by others.
- Whether feed ranking is chronological, curated, or engagement-weighted.
- Whether the house roster has a branded tone or multiple themed collections.

## Recommendation

Build the story-card social app first. Keep the portrait generation as identity scaffolding and treat the episode as the main entertainment artifact. Do not let video scope drive the first build. A compact, funny, structured story system is the foundation for everything that comes after.
