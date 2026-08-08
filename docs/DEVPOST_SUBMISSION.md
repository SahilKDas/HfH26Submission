# Devpost submission copy

## Project name

Unspool

## Tagline

When words are hard, start with one signal.

## Inspiration

The moment someone most needs support is often the moment they have the least language and executive function available. Yet most mental-health apps open with a blank page, a chatbot prompt, or a long menu. “How are you feeling?” can become another task to fail.

We built Unspool around a different premise: start below language. A tight chest, racing thoughts, numbness, restlessness, or too much sensory input can be enough information to choose one safe next step.

## What it does

Unspool is a low-language mental-health tool for acute overwhelm—not a journal and not a therapist bot.

The user taps body signals, sets intensity and available time, and chooses what would help most. Access needs such as “skip breathwork,” “keep my eyes open,” “silent,” and “seated” become hard ranking constraints. Unspool then returns one time-bounded, evidence-informed practice, explains exactly why it was selected, and supplies a ready-to-send sentence for reaching a trusted person.

Afterward, one “helped / did not help” tap teaches a private local model. No story, diagnosis, or identity is stored.

If the user says they may not be safe, recommendation stops. Unspool steps aside for real-time human crisis support.

## How we built it

The interface is React and Vite with a custom accessible design system, responsive layout, reduced-motion support, high-contrast support, visible focus states, semantic dialogs, and keyboard-operable controls.

The AI/ML system is a five-stage, in-browser pipeline:

1. A fail-closed safety gate.
2. Hybrid retrieval using structured matches plus compact feature-hashed embeddings.
3. Contextual ranking with intensity, time, and access constraints.
4. A UCB-style local bandit that learns from one-bit outcomes.
5. A plain-language explanation layer exposing match factors and uncertainty.

Render Workflows powers our distributed safety-audit pipeline. A root Workflow generates bounded synthetic cohorts, fans out 48 accessibility-parity evaluations with retries, and composes a versioned model-card result. The web service triggers it through Render’s official SDK. No real check-in enters the Workflow.

## Challenges we ran into

The hardest design problem was resisting feature inflation. In distress, more capability can mean less usability. We repeatedly removed copy, choices, and interpretation. The result provides one recommendation, not a feed.

The hardest technical problem was making personalization compatible with strict privacy. We avoided transcripts and user profiles entirely. The local bandit needs only a practice ID and one outcome bit, and the cloud audit needs only synthetic inputs.

We also designed around mixed evidence. A technique that helps one person can activate another. That is why breath, eye state, voice, position, intensity, and opt-out cautions are part of the ranking system—not footnotes.

## Accomplishments we are proud of

- A distinct body-first interaction that remains usable when language is scarce.
- A real, explainable ML pipeline instead of a single opaque API call.
- Crisis escalation that bypasses AI rather than asking AI to manage danger.
- Raw check-ins that never leave transient in-browser state.
- A distributed Render Workflow that audits the model with synthetic cohorts.
- A polished design that treats calm, accessibility, and agency as functional requirements.
- Automated tests for danger bypass, explanation coverage, breath sensitivity, local learning, empty input, and accessibility parity.

## What we learned

Responsible AI is most convincing when the architecture has less data to protect. Explainability also changes product behavior: once every recommendation had to show its reasons, weak heuristics became obvious and easier to fix.

Most importantly, we learned that a mental-health product can feel intelligent without trying to sound human. Unspool’s intelligence is in choosing less.

## What is next

Before clinical use, we would run participatory research with people who experience panic, shutdown, dissociation, sensory overload, and limited speech; obtain clinician review of every practice; validate accessibility with screen-reader and switch users; preregister an outcomes study; translate the practice library with cultural review; and publish the full model-card audit history.

## Built with

React, Vite, JavaScript, TypeScript, Node.js, Render Web Services, Render Workflows, Render TypeScript SDK, localStorage, custom hybrid retrieval, contextual bandit ranking, and OpenAI image generation for the original hero artwork.

## Tracks

Tools for Mental Health; Best Use of AI/ML; Responsible AI; Best Design; Best Use of Render; Best Innovation and Creativity.

