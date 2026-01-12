# ProofQuest: The Kingdom of Euclid

ProofQuest is an interactive educational game that blends high school geometry proof practice with kingdom management and grand strategy mechanics. Players take on the role of a Royal Heir returning to the ruins of Isocele, using logical proofs to restore the kingdom and defend it against the encroaching "Logical Decay."

---

## 🏛️ Core Gameplay Pillars

### 1. Geometric Proofs (The "Work")
The heart of the game is the **Proof Table**. Players must prove geometric theorems (SSS, SAS, ASA, AAS, HL) to restore specific city districts.
- **Drag-and-Drop Logic**: Move Statements and Reasons from the Answer Bank into the Proof Table.
- **Interactive Diagrams**: Click on lines and angles to "mark" the diagram, helping visualize congruent parts.
- **Sage's Guidance**: Access a tiered hint system and a scroll of ancient theorems.

### 2. Kingdom Management (The "Growth")
Each proven theorem restores a part of the village, bringing people back to Isocele.
- **Population System**: Track current vs. target population. Growth is influenced by overall kingdom health.
- **Sovereign Points (SP)**: Earned by completing proofs and used to purchase city upgrades and power-ups.
- **Infrastructure Upgrades**: Each restored node can be further upgraded to provide passive benefits.

### 3. Grand Strategy (The "Risk")
The kingdom exists in a living world with dynamic events.
- **Event Board**: Tracks **Active** and **Incoming** events. Players see "rumors" of threats (Marauders, Invasions) and prosperity (Trade Fairs, Harvests).
- **Time & Repairs**: Completing a quest advances the kingdom clock (Days/Weeks/Months). City repairs take time, forcing strategic prioritization.
- **Defense Penetration**: Threats have strength levels (1-5). If your Kingdom Defense (influenced by health metrics and power-ups) is too low, specific events can penetrate and cause massive population loss.

---

## 🛠️ Technical Architecture

### Core Files
- [index.html](file:///c:/Users/Chloe/Desktop/Projects/Shared/CleverLittleBee/active_development/ProofQuest/index.html): The skeletal structure, HUD overlays, and modal containers.
- [game.js](file:///c:/Users/Chloe/Desktop/Projects/Shared/CleverLittleBee/active_development/ProofQuest/game.js): The central engine handling state, logic, rendering, and animations.
- [style.css](file:///c:/Users/Chloe/Desktop/Projects/Shared/CleverLittleBee/active_development/ProofQuest/style.css): Premium aesthetics, layout, and micro-animations.

### State Management (`gameState`)
The `gameState` object is the single source of truth for:
- `currentLevel`: Progress through the restoration nodes.
- `villagePopulation`: Current inhabitants (visualized via golden orbs).
- `defenseScore`: Calculated percentage based on health metrics and power-ups.
- `activeEvents` / `incomingEvents`: Objects tracking dynamic world state.
- `focusChoices`: Persistent record of narrative decisions.

### Key Functional Systems
- **Orb Engine**: 1:1 population-to-orb system. Orbs "bounce" when population is full.
- **Event Engine**: Randomly schedules events based on an `EVENT_LIBRARY` and processes impacts during time advancement.
- **Visor System**: Narrative CYOA (Choose Your Own Adventure) moments that branch the kingdom's development story.

---

## 🎭 Design Principles
- **Aesthetic Excellence**: "Medieval-Cyberpunk" UI with gold accents, deep glassmorphism, and smooth transitions.
- **Narrative Immersion**: Choice effects are hidden from the UI (no "Health +5" tooltips) to ensure decisions feel weightier and narrative-driven.
- **Responsive Proofing**: Every user marking on a diagram and every drop in the proof table provides immediate visual feedback.

---

## 🗺️ Development Roadmap
- [x] **Phase 1**: Core Proof Engine & Village Map
- [x] **Phase 2**: Kingdom HUD & Population Orbs
- [x] **Phase 3**: Threats, Repairs, & Event Board
- [ ] **Phase 4**: Expansion Regions (Egypt & Greece)
- [ ] **Phase 5**: Narrative Puzzles & Boss Proofs

---

## 🛡️ Special Mechanics: The Mighty Hero
The **Mighty Hero** is a premium power-up purchasable for 500 SP. 
- **Benefit**: Provides a flat +5% bonus to Kingdom Defense.
- **Implementation**: Managed via `gameState.hasMightyHero` and checked during `processEventImpacts`.

---
> **Developer Note**: Always update `gameState` through helper functions to ensure the UI and save-data remain synchronized.

## 🤖 MCP Development Workflow

This project is integrated with the **MCP Global** system for enhanced development and quality assurance.

### Commands
- `python mcp-global-rules/mcp.py autocontext`: Load project-specific context and memory.
- `python mcp-global-rules/mcp.py review [file]`: Run automated code review.
- `python mcp-global-rules/mcp.py security [file]`: Perform a security audit.
- `python mcp-global-rules/mcp.py remember/recall`: Managed persistent project knowledge.

### Enforcement
- **Strict Hooks**: Automated quality and security checks run on every commit.
- **Isolation**: All memory and indexing are strictly confined to the `ProofQuest` directory to prevent cross-project pollution.
