/**
 * The Chronicles of Euclid - Game Logic
 */

const gameAssets = {
  images: {
    title: "Images/CastleTitle.jpg",
    ruinedVillage: "Images/BeforeVillage.png",
    restoredVillage: "Images/AfterVillage.png",
    characters: {
      male: "Images/MaleCharacter.png",
      female: "Images/FemaleCharacter.png",
      grandVizier: "Images/GrandVisor.png",
      architect: "Images/AdvisorArchitect.png",
      merchant: "Images/AdvisorMerchant.png",
      sentinel: "Images/AdvisorSentinel.png",
      sage: "Images/SageCharacter.png",
      architectFemale: "Images/ArchitectCharacter.png"
    },
    centralCastle: {
      "Isocele": {
        before: "Images/CastleBeforeIsocele.png",
        after: "Images/CastleAfterIsocele.png"
      },
      "The Rhombic Sands": {
        before: "Images/PyramidBeforeRhombic.png",
        after: "Images/PyramidAfterRhombic.png"
      },
      "The Gaelic Grids": {
        before: "Images/CastleBeforeIsocele.png", // Reuse from Isocele
        after: "Images/CastleAfterIsocele.png"
      }
    },
    mapBackground: {
      before: "Images/MapBG_Before.png",
      after: "Images/MapBG_After.png"
    },
    levels: [
      { id: 1, structure: "Moat Bridge", before: "Images/BeforeBridge.png", after: "Images/AfterBridge.png" },
      { id: 2, structure: "Market Stalls", before: "Images/BeforeMarket.png", after: "Images/AfterMarket.png" },
      { id: 3, structure: "Sentry Wall", before: "Images/BeforeWall.png", after: "Images/AfterWall.png" },
      { id: 4, structure: "Blacksmith Tongs", before: "Images/BeforeForge.png", after: "Images/AfterForge.png" },
      { id: 5, structure: "Fishing Docks", before: "Images/BeforeDocks.png", after: "Images/AfterDocks.png" },
      { id: 6, structure: "Stable Rafters", before: "Images/BeforeStables.png", after: "Images/AfterStables.png" },
      { id: 7, structure: "Palace Vault", before: "Images/BeforeVault.png", after: "Images/AfterVault.png" },
      { id: 8, structure: "Grand Portcullis", before: "Images/BeforePortcullis.png", after: "Images/AfterPortcullis.png" },
      { id: 9, structure: "Bell Tower", before: "Images/BeforeCathedrial.png", after: "Images/AfterCathedrial.png" },
      { id: 10, structure: "Royal Vineyard", before: "Images/BeforeVineyard.png", after: "Images/AfterVineyard.png" }
    ],
    music: {
      intro: "Music/renaissance-epic-orchestral-cinematic-219596.mp3",
      hub: "Music/medieval-music-castle-of-dreams-212203.mp3",
      quest: "Music/plain-old-folk-drumming-on-a-remo-206892.mp3",
      victory: "Music/renaissance-refrain-212279.mp3",
      correct: "Music/renaissance-reverie-214451.mp3",
      interact: "Music/along-to-the-fortress-353549.mp3",
      sands: "Music/the-sand-surfers-of-dune-450481.mp3",
      grids: "Music/celtic-winds-439101.mp3"
    },
    scenarios: {
      // Isocele (Medieval)
      invasion: "Images/ScenarioInvasion.png",
      famine: "Images/ScenarioFamine.png",
      storm: "Images/ScenarioStorm.png",
      plague: "Images/ScenarioPlague.png",
      harvest: "Images/ScenarioHarvest.png",
      trade: "Images/ScenarioTrade.png",
      festival: "Images/ScenarioFestival.png",
      // Rhombic Sands (Egyptian themed)
      sandstorm: "Images/ScenarioSandstorm.png",
      locusts: "Images/ScenarioLocusts.png",
      // Gaelic Grids (Celtic themed)
      celtic_raid: "Images/ScenarioCelticRaid.png",
      druid_curse: "Images/ScenarioDruidCurse.png"
    },

    regions: {
      "Isocele": "Images/MapBG_After.png",
      "The Rhombic Sands": "Images/MapBG_RhombicSands.png",
      "The Gaelic Grids": "Images/MapBG_GaelicGrids.png"
    },
    epicVictory: "Images/EpicVictory.png"
  },
};


// --- Audio Management ---
window.AudioManager = {
  tracks: {}, // Cache of Audio objects
  currentTrackKey: null,
  isMuted: localStorage.getItem("proofQuestMuted") === "true",

  getTrack(key) {
    if (this.tracks[key]) return this.tracks[key];
    const src = gameAssets.images.music[key];
    if (!src) return null;
    const audio = new Audio(src);
    this.tracks[key] = audio;
    return audio;
  },

  playMusic(key, loop = true) {
    const track = this.getTrack(key);
    if (!track) return;

    // 1. Validation: Only one music track plays at a time
    // Pause all other tracks that might be playing
    Object.keys(this.tracks).forEach(k => {
      if (k !== key && !this.tracks[k].paused) {
        this.tracks[k].pause();
      }
    });

    // 2. Validation: If the same track is already playing, do not restart
    if (this.currentTrackKey === key && !track.paused) {
      return;
    }

    this.currentTrackKey = key;
    track.loop = loop;
    track.muted = this.isMuted;

    // If the track was finished, reset to beginning
    if (track.ended) {
      track.currentTime = 0;
    }

    // Note: track.play() resumes from where it left off if it was just paused
    track.play().catch(e => console.log("Audio play blocked until interaction."));
    this.updateToggleIcon();
  },

  toggleMute() {
    this.isMuted = !this.isMuted;
    localStorage.setItem("proofQuestMuted", this.isMuted);

    // Apply mute state to all cached tracks
    Object.values(this.tracks).forEach(track => {
      track.muted = this.isMuted;
    });

    this.updateToggleIcon();
  },

  updateToggleIcon() {
    const btn = document.getElementById("nav-btn-audio");
    if (!btn) return;
    const icon = btn.querySelector("i");
    if (this.isMuted) {
      icon.className = "bi bi-volume-mute-fill";
      btn.title = "Unmute Music";
    } else {
      icon.className = "bi bi-volume-up-fill";
      btn.title = "Mute Music";
    }
  },

  playSFX(key) {
    if (this.isMuted) return;
    // In ProofQuest, assets under Music/ are treated as musical tracks
    // and thus follow the "one track at a time" validation rule.
    this.playMusic(key, false);
  }
};

const levels = [
  {
    id: 1,
    region: "Isocele",
    name: "Moat Bridge",
    theorem: "SSS",
    repairTime: "3 Days",
    narrative: {
      intro: "Your Highness, the Moat Bridge has crumbled! Without it, we are isolated. Lady Aurelia and Commander Kaelen are debating how to proceed.",
      choices: [
        {
          speaker: "Lady Aurelia",
          text: "We should focus on the structural integrity. A bridge of stone and reason will last for centuries.",
          options: [
            { text: "Prioritize Stone", impact: { food: 5, plague: 5 } },
            { text: "Prioritize Speed", impact: { population: 20 } }
          ]
        }
      ],
      victory: "Magnificent! The stones bind together as one. The path is open once more."
    },
    proofData: {
      given: ["AD ≅ CD", "AB ≅ CB", "BD shared"],
      prove: "△ABD ≅ △CBD",
      steps: [
        { statement: "AD ≅ CD", reason: "Given" },
        { statement: "AB ≅ CB", reason: "Given" },
        { statement: "BD ≅ BD", reason: "Reflexive Property" },
        { statement: "△ABD ≅ △CBD", reason: "SSS Congruence" }
      ],
      bank: {
        statements: ["△ABD ≅ △CBD", "BD ≅ BD", "AD ≅ CD", "AB ≅ CB"],
        reasons: ["Given", "Reflexive Property", "SSS Congruence", "SAS Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 230, label: "A" },
        { id: "B", x: 160, y: 30, label: "B" },
        { id: "C", x: 280, y: 230, label: "C" },
        { id: "D", x: 160, y: 230, label: "D" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "CB", from: "C", to: "B" },
        { id: "AD", from: "A", to: "D" },
        { id: "CD", from: "C", to: "D" },
        { id: "BD", from: "B", to: "D" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 1 }, { line: "CB", count: 1 }, { line: "AD", count: 2 }, { line: "CD", count: 2 }],
        arcs: []
      }
    }
  },
  {
    id: 2,
    region: "Isocele",
    name: "Market Stalls",
    theorem: "SAS",
    repairTime: "5 Days",
    narrative: {
      intro: "The market is a ghost town, Your Highness. Valerius has a proposal to stimulate the economy.",
      choices: [
        {
          speaker: "Valerius",
          text: "If we lower the tariffs now, we can attract traders from the Oasis. It's a risk to our immediate treasury, but the people will be fed.",
          options: [
            { text: "Lower Tariffs", impact: { food: 15, sovereign: -50 } },
            { text: "Keep High Tariffs", impact: { sovereign: 50, food: -5 } }
          ]
        }
      ],
      victory: "The market thrives again! The stalls are sturdy and balanced."
    },
    proofData: {
      given: ["AB ≅ AD", "∠1 ≅ ∠2", "AC shared"],
      prove: "△ABC ≅ △ADC",
      steps: [
        { statement: "AB ≅ AD", reason: "Given" },
        { statement: "∠1 ≅ ∠2", reason: "Given" },
        { statement: "AC ≅ AC", reason: "Reflexive Property" },
        { statement: "△ABC ≅ △ADC", reason: "SAS Congruence" }
      ],
      bank: {
        statements: ["△ABC ≅ △ADC", "AC ≅ AC", "∠1 ≅ ∠2", "AB ≅ AD"],
        reasons: ["Given", "Reflexive Property", "SAS Congruence", "ASA Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 160, y: 50, label: "A" },
        { id: "B", x: 60, y: 150, label: "B" },
        { id: "C", x: 160, y: 230, label: "C" },
        { id: "D", x: 260, y: 150, label: "D" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "AD", from: "A", to: "D" },
        { id: "BC", from: "B", to: "C" },
        { id: "DC", from: "D", to: "C" },
        { id: "AC", from: "A", to: "C" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 1 }, { line: "AD", count: 1 }],
        arcs: [{ vertex: "A", rays: ["B", "C"], count: 1 }, { vertex: "A", rays: ["D", "C"], count: 1 }]
      }
    }
  },
  {
    id: 3,
    region: "Isocele",
    name: "Sentry Wall",
    theorem: "Reflexive Property",
    repairTime: "1 Week",
    narrative: {
      intro: "Commander Kaelen warns that the Northern Watch is blinded without the Sentry Wall. We must decide on a patrol strategy.",
      choices: [
        {
          speaker: "Commander Kaelen",
          text: "We can either double the patrols along the jagged cliffs or focus our archers on the main road. Which do you command?",
          options: [
            { text: "Double Patrols", impact: { defense: 20, food: -5 } },
            { text: "Focus Road", impact: { population: 20, defense: 5 } }
          ]
        }
      ],
      victory: "The wall stands firm. The Reflexive Property has made it unbreakable."
    },
    proofData: {
      given: ["AB ≅ CB", "BD bisects AC"],
      prove: "△ABD ≅ △CBD",
      steps: [
        { statement: "AB ≅ CB", reason: "Given" },
        { statement: "BD bisects AC", reason: "Given" },
        { statement: "AD ≅ CD", reason: "Definition of Segment Bisector" },
        { statement: "BD ≅ BD", reason: "Reflexive Property" },
        { statement: "△ABD ≅ △CBD", reason: "SSS Congruence" }
      ],
      bank: {
        statements: ["BD ≅ BD", "AD ≅ CD", "△ABD ≅ △CBD", "AB ≅ CB", "BD bisects AC"],
        reasons: ["Given", "Reflexive Property", "Definition of Segment Bisector", "SSS Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 80, y: 50, label: "A" },
        { id: "D", x: 160, y: 50, label: "D" },
        { id: "C", x: 240, y: 50, label: "C" },
        { id: "B", x: 160, y: 220, label: "B" }
      ],
      lines: [
        { id: "AD", from: "A", to: "D" },
        { id: "DC", from: "D", to: "C" },
        { id: "AB", from: "A", to: "B" },
        { id: "CB", from: "C", to: "B" },
        { id: "DB", from: "D", to: "B" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 2 }, { line: "CB", count: 2 }, { line: "AD", count: 1 }, { line: "DC", count: 1 }],
        arcs: []
      }
    }
  },
  {
    id: 4,
    region: "Isocele",
    name: "Blacksmith Tongs",
    theorem: "Vertical Angles",
    repairTime: "8 Days",
    narrative: {
      intro: "Master Valerius and the Blacksmith are arguing over the quality of the iron. We need a decision on the forge's fuel.",
      choices: [
        {
          speaker: "Valerius",
          text: "If we import the expensive Blue Coal, the tools will be unbreakable, but it will cost us dearly. Otherwise, we use local peat.",
          options: [
            { text: "Import Blue Coal", impact: { food: 5, defense: 5, sovereign: -40 } },
            { text: "Use Local Peat", impact: { sovereign: 40, population: 5 } }
          ]
        }
      ],
      victory: "The tongs are true once more. The forge is ready for your crown."
    },
    proofData: {
      given: ["Lines AE and BD intersect at C", "AC ≅ CE", "BC ≅ CD"],
      prove: "△ABC ≅ △EDC",
      steps: [
        { statement: "AC ≅ CE", reason: "Given" },
        { statement: "BC ≅ CD", reason: "Given" },
        { statement: "∠ACB ≅ ∠ECD", reason: "Vertical Angles Theorem" },
        { statement: "△ABC ≅ △EDC", reason: "SAS Congruence" }
      ],
      bank: {
        statements: ["△ABC ≅ △EDC", "∠ACB ≅ ∠ECD", "AC ≅ CE", "BC ≅ CD"],
        reasons: ["Given", "Vertical Angles Theorem", "SAS Congruence", "SSS Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 60, y: 60, label: "A" },
        { id: "B", x: 260, y: 60, label: "B" },
        { id: "C", x: 160, y: 140, label: "C" },
        { id: "D", x: 60, y: 220, label: "D" },
        { id: "E", x: 260, y: 220, label: "E" }
      ],
      lines: [
        { id: "AE", from: "A", to: "E" },
        { id: "BD", from: "B", to: "D" },
        { id: "AB", from: "A", to: "B" },
        { id: "DE", from: "D", to: "E" }
      ],
      givenMarks: {
        ticks: [{ line: "AC", count: 1 }, { line: "CE", count: 1 }, { line: "BC", count: 2 }, { line: "CD", count: 2 }],
        arcs: []
      }
    }
  },
  {
    id: 5,
    region: "Isocele",
    name: "Fishing Docks",
    theorem: "ASA",
    repairTime: "2 Weeks",
    narrative: {
      intro: "The Docks are failing. Master Valerius wants to prioritize trade, while the Vizier suggests local safety.",
      choices: [
        {
          speaker: "Valerius",
          text: "Expand the foreign berth! We need the silver from the East more than we need more fish for the locals.",
          options: [
            { text: "Expand Berths", impact: { sovereign: 60, population: 15, food: -10 } },
            { text: "Focus Fisheries", impact: { food: 25, defense: 5 } }
          ]
        }
      ],
      victory: "The docks are anchored. The kingdom will not go hungry tonight."
    },
    proofData: {
      given: ["∠A ≅ ∠D", "AC ≅ DF", "∠C ≅ ∠F"],
      prove: "△ABC ≅ △DEF",
      steps: [
        { statement: "∠A ≅ ∠D", reason: "Given" },
        { statement: "AC ≅ DF", reason: "Given" },
        { statement: "∠C ≅ ∠F", reason: "Given" },
        { statement: "△ABC ≅ △DEF", reason: "ASA Congruence" }
      ],
      bank: {
        statements: ["△ABC ≅ △DEF", "∠A ≅ ∠D", "AC ≅ DF", "∠C ≅ ∠F"],
        reasons: ["Given", "ASA Congruence", "AAS Congruence", "SAS Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 100, label: "A" },
        { id: "B", x: 100, y: 40, label: "B" },
        { id: "C", x: 140, y: 100, label: "C" },
        { id: "D", x: 180, y: 100, label: "D" },
        { id: "E", x: 240, y: 40, label: "E" },
        { id: "F", x: 280, y: 100, label: "F" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "AC", from: "A", to: "C" },
        { id: "DE", from: "D", to: "E" },
        { id: "EF", from: "E", to: "F" },
        { id: "DF", from: "D", to: "F" }
      ],
      givenMarks: {
        ticks: [{ line: "AC", count: 1 }, { line: "DF", count: 1 }],
        arcs: [{ vertex: "A", rays: ["B", "C"], count: 1 }, { vertex: "D", rays: ["E", "F"], count: 1 }, { vertex: "C", rays: ["A", "B"], count: 2 }, { vertex: "F", rays: ["D", "E"], count: 2 }]
      }
    }
  },
  {
    id: 6,
    region: "Isocele",
    name: "Stable Rafters",
    theorem: "AAS",
    repairTime: "12 Days",
    narrative: {
      intro: "The Rafters of the Stables are precarious. Advisor Aurelia and Commander Kaelen have different visions for the cavalry.",
      choices: [
        {
          speaker: "Commander Kaelen",
          text: "We need war-ready stalls! If we reinforce with timber from the Elder Forest, our horses will be armored by the spirits.",
          options: [
            { text: "War Rafters", impact: { defense: 30, population: -10 } },
            { text: "Civic Stables", impact: { population: 20, food: 10 } }
          ]
        }
      ],
      victory: "The roof is secure. The horses are safe from the Logical Decay."
    },
    proofData: {
      given: ["∠A ≅ ∠D", "∠B ≅ ∠E", "BC ≅ EF"],
      prove: "△ABC ≅ △DEF",
      steps: [
        { statement: "∠A ≅ ∠D", reason: "Given" },
        { statement: "∠B ≅ ∠E", reason: "Given" },
        { statement: "BC ≅ EF", reason: "Given" },
        { statement: "△ABC ≅ △DEF", reason: "AAS Congruence" }
      ],
      bank: {
        statements: ["△ABC ≅ △DEF", "∠B ≅ ∠E", "BC ≅ EF", "∠A ≅ ∠D"],
        reasons: ["Given", "AAS Congruence", "ASA Congruence", "SSS Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 60, label: "A" },
        { id: "B", x: 120, y: 60, label: "B" },
        { id: "C", x: 40, y: 140, label: "C" },
        { id: "D", x: 180, y: 60, label: "D" },
        { id: "E", x: 260, y: 60, label: "E" },
        { id: "F", x: 180, y: 140, label: "F" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "AC", from: "A", to: "C" },
        { id: "DE", from: "D", to: "E" },
        { id: "EF", from: "E", to: "F" },
        { id: "DF", from: "D", to: "F" }
      ],
      givenMarks: {
        ticks: [{ line: "BC", count: 1 }, { line: "EF", count: 1 }],
        arcs: [{ vertex: "A", rays: ["B", "C"], count: 1 }, { vertex: "D", rays: ["E", "F"], count: 1 }, { vertex: "B", rays: ["A", "C"], count: 2 }, { vertex: "E", rays: ["D", "F"], count: 2 }]
      }
    }
  },
  {
    id: 7,
    region: "Isocele",
    name: "Palace Vault",
    theorem: "CPCTC",
    repairTime: "3 Weeks",
    narrative: {
      intro: "Advisor Aurelia and Valerius are outside the Vault. They disagree on how to handle the treasure found within.",
      choices: [
        {
          speaker: "Valerius",
          text: "If we use this gold to pay off the foreign debt, Euclid's sovereignty will be unchallenged. But Aurelia wants to spend it on marble. What say you?",
          options: [
            { text: "Pay Foreign Debt", impact: { sovereign: 150, population: 10 } },
            { text: "Grand Renovation", impact: { food: 10, defense: 10, population: 30 } }
          ]
        }
      ],
      victory: "The vault is open! CPCTC: Corresponding Parts of Congruent Triangles are Congruent."
    },
    proofData: {
      given: ["AB ≅ AD", "BC ≅ DC"],
      prove: "∠B ≅ ∠D",
      steps: [
        { statement: "AB ≅ AD", reason: "Given" },
        { statement: "BC ≅ DC", reason: "Given" },
        { statement: "AC ≅ AC", reason: "Reflexive Property" },
        { statement: "△ABC ≅ △ADC", reason: "SSS Congruence" },
        { statement: "∠B ≅ ∠D", reason: "CPCTC" }
      ],
      bank: {
        statements: ["∠B ≅ ∠D", "△ABC ≅ △ADC", "AC ≅ AC", "AB ≅ AD", "BC ≅ DC"],
        reasons: ["Given", "Reflexive Property", "SSS Congruence", "CPCTC"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 160, y: 40, label: "A" },
        { id: "B", x: 80, y: 130, label: "B" },
        { id: "C", x: 160, y: 220, label: "C" },
        { id: "D", x: 240, y: 130, label: "D" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "CD", from: "C", to: "D" },
        { id: "DA", from: "D", to: "A" },
        { id: "AC", from: "A", to: "C" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 1 }, { line: "DA", count: 1 }, { line: "BC", count: 2 }, { line: "CD", count: 2 }],
        arcs: []
      }
    }
  },
  {
    id: 8,
    region: "Isocele",
    name: "Grand Portcullis",
    theorem: "HL Theorem",
    repairTime: "1 Month",
    narrative: {
      intro: "The Portcullis is stuck. Commander Kaelen wants to use it for training, but Valerius sees a tourist opportunity.",
      choices: [
        {
          speaker: "Commander Kaelen",
          text: "We should reinforce the mechanism for heavy use by the guards. A strong gate is a clear signal to our enemies.",
          options: [
            { text: "Reinforce Mechanism", impact: { defense: 25, food: -5 } },
            { text: "Open for Pilgrims", impact: { sovereign: 80, population: 40 } }
          ]
        }
      ],
      victory: "The gate rises. The Law of HL has proven its worth."
    },
    proofData: {
      given: ["∠B and ∠D are right ∠s", "AC ≅ EC", "AB ≅ ED"],
      prove: "△ABC ≅ △EDC",
      steps: [
        { statement: "∠B and ∠D are right ∠s", reason: "Given" },
        { statement: "AC ≅ EC", reason: "Given" },
        { statement: "AB ≅ ED", reason: "Given" },
        { statement: "△ABC ≅ △EDC", reason: "HL Theorem" }
      ],
      bank: {
        statements: ["△ABC ≅ △EDC", "AC ≅ EC", "AB ≅ ED", "∠B and ∠D are right ∠s"],
        reasons: ["Given", "HL Theorem", "SSS Congruence", "SAS Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 60, y: 40, label: "A" },
        { id: "B", x: 60, y: 140, label: "B" },
        { id: "C", x: 160, y: 140, label: "C" },
        { id: "D", x: 260, y: 140, label: "D" },
        { id: "E", x: 260, y: 40, label: "E" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "AC", from: "A", to: "C" },
        { id: "ED", from: "E", to: "D" },
        { id: "DC", from: "D", to: "C" },
        { id: "EC", from: "E", to: "C" }
      ],
      givenMarks: {
        ticks: [{ line: "AC", count: 1 }, { line: "EC", count: 1 }, { line: "AB", count: 2 }, { line: "ED", count: 2 }],
        arcs: [] // Right angles rendered manually or via special mark
      }
    }
  },
  {
    id: 9,
    region: "Isocele",
    name: "Bell Tower",
    theorem: "Base Angles",
    repairTime: "5 Weeks",
    narrative: {
      intro: "The Bell Tower's resonance can heal or warn. Lady Aurelia and the Vizier await your word.",
      choices: [
        {
          speaker: "Lady Aurelia",
          text: "The geometry of the bell can be adjusted to vibrate at a frequency that purifies the air. Or we can use its volume to warn of incoming threats.",
          options: [
            { text: "Purify Mist", impact: { plague: 25, food: 10 } },
            { text: "Sound the Alarm", impact: { defense: 30, population: 10 } }
          ]
        }
      ],
      victory: "The bell tolls! Its sound banishes the shadows of doubt."
    },
    proofData: {
      given: ["AB ≅ AC", "AD bisects ∠BAC"],
      prove: "∠B ≅ ∠C",
      steps: [
        { statement: "AB ≅ AC", reason: "Given" },
        { statement: "AD bisects ∠BAC", reason: "Given" },
        { statement: "∠BAD ≅ ∠CAD", reason: "Definition of Angle Bisector" },
        { statement: "AD ≅ AD", reason: "Reflexive Property" },
        { statement: "△ABD ≅ △ACD", reason: "SAS Congruence" },
        { statement: "∠B ≅ ∠C", reason: "CPCTC" }
      ],
      bank: {
        statements: ["∠B ≅ ∠C", "△ABD ≅ △ACD", "AD ≅ AD", "∠BAD ≅ ∠CAD", "AB ≅ AC", "AD bisects ∠BAC"],
        reasons: ["Given", "Definition of Angle Bisector", "Reflexive Property", "SAS Congruence", "CPCTC"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 160, y: 40, label: "A" },
        { id: "B", x: 80, y: 220, label: "B" },
        { id: "C", x: 240, y: 220, label: "C" },
        { id: "D", x: 160, y: 220, label: "D" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "AC", from: "A", to: "C" },
        { id: "BC", from: "B", to: "C" },
        { id: "AD", from: "A", to: "D" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 1 }, { line: "AC", count: 1 }],
        arcs: [{ vertex: "A", rays: ["B", "D"], count: 1 }, { vertex: "A", rays: ["C", "D"], count: 1 }]
      }
    }
  },
  {
    id: 10,
    region: "Isocele",
    name: "Royal Vineyard",
    theorem: "Converse Parallel",
    repairTime: "2 Months",
    narrative: {
      intro: "The Chaos Rot is thickest here. Commander Kaelen and Valerius disagree on the vineyard's future.",
      choices: [
        {
          speaker: "Valerius",
          text: "We should bottle the remaining 'Logic-Wine' as a premium vintage to fund the final restoration. Kaelen wants to use it as a medicinal tonic for the infirm.",
          options: [
            { text: "Logic-Wine Vintage", impact: { sovereign: 200, population: 20 } },
            { text: "Medicinal Tonic", impact: { plague: 30, population: 50 } }
          ]
        }
      ],
      victory: "The vines are pruned and the trellis is straight. You have bound the kingdom together!"
    },
    proofData: {
      given: ["∠1 ≅ ∠2", "Transversal t"],
      prove: "Line l ∥ Line m",
      steps: [
        { statement: "∠1 ≅ ∠2", reason: "Given" },
        { statement: "∠1 and ∠2 are alt. interior ∠s", reason: "Given" },
        { statement: "Line l ∥ Line m", reason: "Converse Alt. Int. ∠s Theorem" }
      ],
      bank: {
        statements: ["Line l ∥ Line m", "∠1 and ∠2 are alt. interior ∠s", "∠1 ≅ ∠2"],
        reasons: ["Given", "Converse Alt. Int. ∠s Theorem", "Alt. Int. ∠s Theorem"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 80, label: "" },
        { id: "B", x: 280, y: 80, label: "l" },
        { id: "C", x: 40, y: 180, label: "" },
        { id: "D", x: 280, y: 180, label: "m" },
        { id: "E", x: 120, y: 30, label: "t" },
        { id: "F", x: 200, y: 230, label: "" },
        { id: "P", x: 140, y: 80, label: "" },
        { id: "Q", x: 180, y: 180, label: "" }
      ],
      lines: [
        { id: "l", from: "A", to: "B" },
        { id: "m", from: "C", to: "D" },
        { id: "t", from: "E", to: "F" }
      ],
      givenMarks: {
        ticks: [],
        arcs: [
          { vertex: "P", rays: ["A", "F"], count: 1, label: "1", radius: 18 },
          { vertex: "Q", rays: ["D", "E"], count: 1, label: "2", radius: 18 }
        ]
      }

    }
  },
  {
    id: 11,
    region: "The Rhombic Sands",
    name: "Rhind Papyrus Scriptum",
    theorem: "Rectangular Area",
    repairTime: "3 Days",
    before: "Images/BeforeRhindPapyrus.png",
    after: "Images/AfterRhindPapyrus.png",
    narrative: {
      intro: "We have reached the sun-drenched sands of Egypt. The scribes are in an uproar; the ancient Rhind Papyrus has been damaged. We must prove the area of the scripts to restore them.",
      choices: [
        {
          speaker: "High Scribe",
          text: "The ink must be made from the finest lotus or the common reed. Which shall we use for the restoration?",
          options: [
            { text: "Finest Lotus", impact: { sovereign: -20, food: 5 } },
            { text: "Common Reed", impact: { population: 10 } }
          ]
        }
      ],
      victory: "The Papyrus is restored! The wisdom of the ancients flows once more."
    },
    proofData: {
      given: ["Rectangle ABCD", "AB ≅ CD", "BC ≅ DA"],
      prove: "△ABC ≅ △CDA",
      steps: [
        { statement: "AB ≅ CD", reason: "Given" },
        { statement: "BC ≅ DA", reason: "Given" },
        { statement: "AC ≅ AC", reason: "Reflexive Property" },
        { statement: "△ABC ≅ △CDA", reason: "SSS Congruence" }
      ],
      bank: {
        statements: ["△ABC ≅ △CDA", "AC ≅ AC", "AB ≅ CD", "BC ≅ DA"],
        reasons: ["Given", "Reflexive Property", "SSS Congruence", "SAS Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 60, y: 60, label: "A" },
        { id: "B", x: 260, y: 60, label: "B" },
        { id: "C", x: 260, y: 180, label: "C" },
        { id: "D", x: 60, y: 180, label: "D" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "CD", from: "C", to: "D" },
        { id: "DA", from: "D", to: "A" },
        { id: "AC", from: "A", to: "C" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 1 }, { line: "CD", count: 1 }, { line: "BC", count: 2 }, { line: "DA", count: 2 }],
        arcs: []
      }
    }
  },
  {
    id: 12,
    region: "The Rhombic Sands",
    name: "Pyramid Capstone",
    theorem: "Isosceles Triangle",
    repairTime: "1 Week",
    before: "Images/BeforePyramidCapstone.png",
    after: "Images/AfterPyramidCapstone.png",

    narrative: {
      intro: "The Great Pyramid is missing its golden capstone. The angles must be perfect to catch the first light of Ra.",
      choices: [
        {
          speaker: "Architect Imhotep",
          text: "Shall we use solid gold, which is heavy and draws thieves, or gilded limestone?",
          options: [
            { text: "Solid Gold", impact: { defense: -10, sovereign: 50 } },
            { text: "Gilded Limestone", impact: { defense: 10, population: 5 } }
          ]
        }
      ],
      victory: " Ra's light shines upon the pyramid! The capstone is secure."
    },
    proofData: {
      given: ["△ABC is isosceles", "AB ≅ AC", "AD is altitude to BC"],
      prove: "△ABD ≅ △ACD",
      steps: [
        { statement: "AB ≅ AC", reason: "Given" },
        { statement: "AD ⊥ BC", reason: "Definition of Altitude" },
        { statement: "∠ADB, ∠ADC are right ∠s", reason: "Definition of Perpendicular" },
        { statement: "AD ≅ AD", reason: "Reflexive Property" },
        { statement: "△ABD ≅ △ACD", reason: "HL Theorem" }
      ],

      bank: {
        statements: ["△ABD ≅ △ACD", "∠ADB, ∠ADC are right ∠s", "AD ≅ AD", "AB ≅ AC", "AD ⊥ BC"],
        reasons: ["Given", "Reflexive Property", "HL Theorem", "Definition of Altitude", "Definition of Perpendicular"]
      }

    },
    diagram: {
      points: [
        { id: "A", x: 160, y: 40, label: "A" },
        { id: "B", x: 60, y: 220, label: "B" },
        { id: "C", x: 260, y: 220, label: "C" },
        { id: "D", x: 160, y: 220, label: "D" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "AC", from: "A", to: "C" },
        { id: "BC", from: "B", to: "C" },
        { id: "AD", from: "A", to: "D" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 1 }, { line: "AC", count: 1 }],
        arcs: []
      }
    }
  },
  {
    id: 13,
    region: "The Rhombic Sands",
    name: "Pharaoh's Court",
    theorem: "Parallel Transversal",
    repairTime: "10 Days",
    before: "Images/BeforePharaohsCourt.png",
    after: "Images/AfterPharaohsCourt.png",
    narrative: {
      intro: "The Pharaoh's court is in disarray. The columns must be aligned perfectly parallel to ensure the roof doesn't collapse under the weight of history.",
      choices: [
        {
          speaker: "Grand Vizier Hemiunu",
          text: "Should we use cedar from Lebanon or local palm wood? Cedar is stronger but palm is plentiful.",
          options: [
            { text: "Lebanese Cedar", impact: { sovereign: -40, defense: 20 } },
            { text: "Local Palm", impact: { food: 15, population: 10 } }
          ]
        }
      ],
      victory: "The columns are true. The Pharaoh's court stands grand and parallel."
    },
    proofData: {
      given: ["Line l ∥ Line m", "Transversal t", "∠1 and ∠2 are corresp. ∠s"],
      prove: "∠1 ≅ ∠2",
      steps: [
        { statement: "Line l ∥ Line m", reason: "Given" },
        { statement: "∠1 and ∠2 are corresp. ∠s", reason: "Given" },
        { statement: "∠1 ≅ ∠2", reason: "Corresponding Angles Postulate" }
      ],
      bank: {
        statements: ["∠1 ≅ ∠2", "Line l ∥ Line m", "∠1 and ∠2 are corresp. ∠s"],
        reasons: ["Given", "Corresponding Angles Postulate", "Alt. Interior Angles Theorem"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 80, label: "" },
        { id: "B", x: 280, y: 80, label: "l" },
        { id: "C", x: 40, y: 180, label: "" },
        { id: "D", x: 280, y: 180, label: "m" },
        { id: "E", x: 120, y: 30, label: "" },
        { id: "F", x: 200, y: 230, label: "t" },
        { id: "P", x: 140, y: 80, label: "" },
        { id: "Q", x: 180, y: 180, label: "" }
      ],
      lines: [
        { id: "l", from: "A", to: "B" },
        { id: "m", from: "C", to: "D" },
        { id: "t", from: "E", to: "F" }
      ],
      givenMarks: {
        ticks: [],
        arcs: [{ vertex: "P", rays: ["A", "E"], count: 1, label: "1" }, { vertex: "Q", rays: ["C", "E"], count: 1, label: "2" }]
      }
    }
  },
  {
    id: 14,
    region: "The Rhombic Sands",
    name: "Sphinx's Riddle",
    theorem: "ASA",
    repairTime: "2 Weeks",
    before: "Images/BeforeSphinxRiddle.png",
    after: "Images/AfterSphinxRiddle.png",
    narrative: {
      intro: "The Sphinx blocks the path to the Nile. To pass, you must prove the congruence of the triangles formed by its paws and the sands.",
      choices: [
        {
          speaker: "Sphinx",
          text: "Will you offer a sacrifice of grain or solve the riddle with logic?",
          options: [
            { text: "Offer Grain", impact: { food: -30, population: 20 } },
            { text: "Solve Riddle", impact: { sovereign: 100, totalXP: 50 } }
          ]
        }
      ],
      victory: "The Sphinx is satisfied. The path to the Nile is open."
    },
    proofData: {
      given: ["∠A ≅ ∠E", "AC ≅ EC", "Line segments AE and BD intersect at C"],
      prove: "△ABC ≅ △EDC",
      steps: [
        { statement: "∠A ≅ ∠E", reason: "Given" },
        { statement: "AC ≅ EC", reason: "Given" },
        { statement: "∠ACB ≅ ∠ECD", reason: "Vertical Angles Theorem" },
        { statement: "△ABC ≅ △EDC", reason: "ASA Congruence" }
      ],
      bank: {
        statements: ["△ABC ≅ △EDC", "∠A ≅ ∠E", "AC ≅ EC", "∠ACB ≅ ∠ECD"],
        reasons: ["Given", "ASA Congruence", "Vertical Angles Theorem", "Reflexive Property"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 40, label: "A" },
        { id: "B", x: 40, y: 140, label: "B" },
        { id: "C", x: 140, y: 90, label: "C" },
        { id: "D", x: 240, y: 40, label: "D" },
        { id: "E", x: 240, y: 140, label: "E" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "AC", from: "A", to: "C" },
        { id: "CD", from: "C", to: "D" },
        { id: "DE", from: "D", to: "E" },
        { id: "CE", from: "C", to: "E" }
      ],
      givenMarks: {
        ticks: [{ line: "AC", count: 1 }, { line: "CE", count: 1 }],
        arcs: [{ vertex: "A", rays: ["B", "C"], count: 1 }, { vertex: "E", rays: ["D", "C"], count: 1 }]
      }
    }
  },
  {
    id: 15,
    region: "The Rhombic Sands",
    name: "Valley of Kings",
    theorem: "Similar Triangles",
    repairTime: "1 Month",
    before: "Images/BeforeValleyKings.png",
    after: "Images/AfterValleyKings.png",
    narrative: {
      intro: "The tombs are hidden. By using the shadows of the obelisks, we can find the entrance. We must prove the triangles are similar.",
      choices: [
        {
          speaker: "Priest of Amun",
          text: "Should we perform a ritual of protection or focus on the precision of the measurements?",
          options: [
            { text: "Ritual", impact: { defense: 30, sovereign: -30 } },
            { text: "Precision", impact: { population: 25, totalXP: 100 } }
          ]
        }
      ],
      victory: "The shadows show the way. The entrance is revealed."
    },
    proofData: {
      given: ["∠A ≅ ∠D", "∠B ≅ ∠E"],
      prove: "△ABC ~ △DEF",
      steps: [
        { statement: "∠A ≅ ∠D", reason: "Given" },
        { statement: "∠B ≅ ∠E", reason: "Given" },
        { statement: "△ABC ~ △DEF", reason: "AA Similarity" }
      ],
      bank: {
        statements: ["△ABC ~ △DEF", "∠A ≅ ∠D", "∠B ≅ ∠E"],
        reasons: ["Given", "AA Similarity", "SAS Similarity"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 100, label: "A" },
        { id: "B", x: 100, y: 40, label: "B" },
        { id: "C", x: 140, y: 100, label: "C" },
        { id: "D", x: 160, y: 120, label: "D" },
        { id: "E", x: 250, y: 30, label: "E" },
        { id: "F", x: 310, y: 120, label: "F" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "AC", from: "A", to: "C" },
        { id: "DE", from: "D", to: "E" },
        { id: "EF", from: "E", to: "F" },
        { id: "DF", from: "D", to: "F" }
      ],
      givenMarks: {
        ticks: [],
        arcs: [{ vertex: "A", rays: ["B", "C"], count: 1 }, { vertex: "D", rays: ["E", "F"], count: 1 }, { vertex: "B", rays: ["A", "C"], count: 2 }, { vertex: "E", rays: ["D", "F"], count: 2 }]
      }
    }
  },
  {
    id: 16,
    region: "The Gaelic Grids",
    name: "Academy of Tara",
    theorem: "SAS",
    repairTime: "1 Week",
    before: "Images/BeforeAcademyTara.png",
    after: "Images/AfterAcademyTara.png",
    narrative: {
      intro: "The Great Hall's dimensions must be verified. The Arch-Druids believe the sacred ratio is the key to Ireland's stability.",
      choices: [
        {
          speaker: "The Arch-Druid",
          text: "Should we align the foundations with the rising sun or the setting moon? The choice will affect the hall's spiritual resonance.",
          options: [
            { text: "Rising Sun (Growth)", impact: { population: 30, sovereign: -20 } },
            { text: "Setting Moon (Wisdom)", impact: { totalXP: 100, food: 10 } }
          ]
        }
      ],
      victory: "The sacred ratio is confirmed! Knowledge will flourish here once more."
    },
    proofData: {
      given: ["AB ≅ DE", "∠B ≅ ∠E", "BC ≅ EF"],
      prove: "△ABC ≅ △DEF",
      steps: [
        { statement: "AB ≅ DE", reason: "Given" },
        { statement: "∠B ≅ ∠E", reason: "Given" },
        { statement: "BC ≅ EF", reason: "Given" },
        { statement: "△ABC ≅ △DEF", reason: "SAS Congruence" }
      ],
      bank: {
        statements: ["△ABC ≅ △DEF", "BC ≅ EF", "∠B ≅ ∠E", "AB ≅ DE"],
        reasons: ["Given", "SAS Congruence", "SSS Congruence", "ASA Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 40, label: "A" },
        { id: "B", x: 40, y: 140, label: "B" },
        { id: "C", x: 140, y: 140, label: "C" },
        { id: "D", x: 200, y: 40, label: "D" },
        { id: "E", x: 200, y: 140, label: "E" },
        { id: "F", x: 300, y: 140, label: "F" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "AC", from: "A", to: "C" },
        { id: "DE", from: "D", to: "E" },
        { id: "EF", from: "E", to: "F" },
        { id: "DF", from: "D", to: "F" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 1 }, { line: "DE", count: 1 }, { line: "BC", count: 2 }, { line: "EF", count: 2 }],
        arcs: [{ vertex: "B", rays: ["A", "C"], count: 1 }, { vertex: "E", rays: ["D", "F"], count: 1 }]
      }
    }
  },
  {
    id: 17,
    region: "The Gaelic Grids",
    name: "Glastonbury Gate",
    theorem: "ASA",
    repairTime: "10 Days",
    before: "Images/BeforeGlastonburyGate.png",
    after: "Images/AfterGlastonburyGate.png",
    narrative: {
      intro: "The mystical gates are jammed. Two Druids disagree on the incantation needed to release the lock.",
      choices: [
        {
          speaker: "Druid Oisin",
          text: "We should use the melody of the wind to vibrate the lock open. It's gentle and won't harm the ancient stone.",
          options: [
            { text: "Wind Melody", impact: { food: 5, population: 15 } },
            { text: "Earth Tremor", impact: { defense: 20, sovereign: -30 } }
          ]
        }
      ],
      victory: "The gate swings open! The flow of logic is restored to the valley."
    },
    proofData: {
      given: ["∠A ≅ ∠D", "AB ≅ DE", "∠B ≅ ∠E"],
      prove: "△ABC ≅ △DEF",
      steps: [
        { statement: "∠A ≅ ∠D", reason: "Given" },
        { statement: "AB ≅ DE", reason: "Given" },
        { statement: "∠B ≅ ∠E", reason: "Given" },
        { statement: "△ABC ≅ △DEF", reason: "ASA Congruence" }
      ],
      bank: {
        statements: ["△ABC ≅ △DEF", "∠B ≅ ∠E", "AB ≅ DE", "∠A ≅ ∠D"],
        reasons: ["Given", "ASA Congruence", "SAS Congruence", "SSS Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 140, label: "A" },
        { id: "B", x: 140, y: 140, label: "B" },
        { id: "C", x: 90, y: 40, label: "C" },
        { id: "D", x: 200, y: 140, label: "D" },
        { id: "E", x: 300, y: 140, label: "E" },
        { id: "F", x: 250, y: 40, label: "F" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "AC", from: "A", to: "C" },
        { id: "DE", from: "D", to: "E" },
        { id: "EF", from: "E", to: "F" },
        { id: "DF", from: "D", to: "F" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 1 }, { line: "DE", count: 1 }],
        arcs: [{ vertex: "A", rays: ["B", "C"], count: 1 }, { vertex: "D", rays: ["E", "F"], count: 1 }, { vertex: "B", rays: ["A", "C"], count: 2 }, { vertex: "E", rays: ["D", "F"], count: 2 }]
      }
    }
  },
  {
    id: 18,
    region: "The Gaelic Grids",
    name: "Druid's Glen",
    theorem: "Parallel Transversal",
    repairTime: "3 Weeks",
    before: "Images/BeforeDruidsGlen.png",
    after: "Images/AfterDruidsGlen.png",
    narrative: {
      intro: "The path through the Glen is split by the mists of Danu. The ancient stones must be aligned to reflect the moon's light across the parallel pathways.",
      choices: [
        {
          speaker: "The Seer of Danu",
          text: "Will you ask about the future of the kingdom or the ancient wisdom of the Tuatha Dé Danann?",
          options: [
            { text: "Future of Kingdom", impact: { population: 30, food: 10 } },
            { text: "Ancient Wisdom", impact: { totalXP: 100, sovereign: 50 } }
          ]
        }
      ],
      victory: "The mist clears. The stones are in perfect alignment."
    },
    proofData: {
      given: ["Line l ∥ Line m", "Transversal t", "∠1 and ∠7 are alt. exterior ∠s"],
      prove: "∠1 ≅ ∠7",
      steps: [
        { statement: "Line l ∥ Line m", reason: "Given" },
        { statement: "∠1 and ∠7 are alt. exterior ∠s", reason: "Given" },
        { statement: "∠1 ≅ ∠7", reason: "Alternate Exterior Angles Theorem" }
      ],
      bank: {
        statements: ["∠1 ≅ ∠7", "Line l ∥ Line m", "∠1 and ∠7 are alt. exterior ∠s"],
        reasons: ["Given", "Alternate Exterior Angles Theorem", "Vertical Angles Theorem"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 40, y: 80, label: "" },
        { id: "B", x: 280, y: 80, label: "l" },
        { id: "C", x: 40, y: 180, label: "" },
        { id: "D", x: 280, y: 180, label: "m" },
        { id: "E", x: 120, y: 30, label: "" },
        { id: "F", x: 200, y: 230, label: "t" },
        { id: "P", x: 140, y: 80, label: "" },
        { id: "Q", x: 180, y: 180, label: "" }
      ],
      lines: [
        { id: "l", from: "A", to: "B" },
        { id: "m", from: "C", to: "D" },
        { id: "t", from: "E", to: "F" }
      ],
      givenMarks: {
        ticks: [],
        arcs: [{ vertex: "P", rays: ["B", "E"], count: 1, label: "1" }, { vertex: "Q", rays: ["C", "F"], count: 1, label: "7" }]
      }
    }
  },
  {
    id: 19,
    region: "The Gaelic Grids",
    name: "Tailteann Games",
    theorem: "SSS",
    repairTime: "1 Month",
    before: "Images/BeforeTailteannGames.png",
    after: "Images/AfterTailteannGames.png",
    narrative: {
      intro: "The hurdle blocks of the games must be perfectly identical. Prove their congruence to ensure a fair competition in the sight of Lugh. Using a shared base is the traditional way.",
      choices: [
        {
          speaker: "Lugh the Long-Arm",
          text: "Should the games be in honor of the Dagda or Brigid? The choice affects the warriors' spirit.",
          options: [
            { text: "The Dagda (Strength)", impact: { defense: 40, food: -10 } },
            { text: "Brigid (Healing)", impact: { population: 40, sovereign: 20 } }
          ]
        }
      ],
      victory: "The games are true. The champion is crowned!"
    },
    proofData: {
      given: ["AB ≅ AD", "BC ≅ DC", "AC is a shared side"],
      prove: "△ABC ≅ △ADC",
      steps: [
        { statement: "AB ≅ AD", reason: "Given" },
        { statement: "BC ≅ DC", reason: "Given" },
        { statement: "AC ≅ AC", reason: "Reflexive Property" },
        { statement: "△ABC ≅ △ADC", reason: "SSS Congruence" }
      ],
      bank: {
        statements: ["△ABC ≅ △ADC", "AC ≅ AC", "BC ≅ DC", "AB ≅ AD"],
        reasons: ["Given", "Reflexive Property", "SSS Congruence", "SAS Congruence"]
      }
    },
    diagram: {
      points: [
        { id: "A", x: 160, y: 50, label: "A" },
        { id: "B", x: 60, y: 140, label: "B" },
        { id: "C", x: 160, y: 230, label: "C" },
        { id: "D", x: 260, y: 140, label: "D" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "CD", from: "C", to: "D" },
        { id: "DA", from: "D", to: "A" },
        { id: "AC", from: "A", to: "C" }
      ],
      givenMarks: {
        ticks: [{ line: "AB", count: 1 }, { line: "AD", count: 1 }, { line: "BC", count: 2 }, { line: "CD", count: 2 }],
        arcs: []
      }
    }
  },
  {
    id: 20,
    region: "The Gaelic Grids",
    name: "Fastnet Beacon",
    theorem: "Similar Right Triangles",
    repairTime: "2 Months",
    before: "Images/BeforeFastnetBeacon.png",
    after: "Images/AfterFastnetBeacon.png",
    narrative: {
      intro: "The lighthouse must be tall enough to guide ships from across the Mediterranean. Prove the similarity of the base and the tower to complete your legacy.",
      choices: [
        {
          speaker: "Chares of Lindos",
          text: "Should the light be fueled by oil or the magic of the Sage?",
          options: [
            { text: "Oil (Trade)", impact: { sovereign: 300, food: 40 } },
            { text: "Magic (Logic)", impact: { totalXP: 500, defense: 50 } }
          ]
        }
      ],
      victory: "The light is lit! Greece is secured, and the Logical Decay retreats. You are truly a Master of Euclid!"
    },
    proofData: {
      given: ["∠B, ∠E right ∠s", "∠A ≅ ∠D"],
      prove: "△ABC ~ △DEF",
      steps: [
        { statement: "∠B, ∠E right ∠s", reason: "Given" },
        { statement: "∠B ≅ ∠E", reason: "All right ∠s are ≅" },
        { statement: "∠A ≅ ∠D", reason: "Given" },
        { statement: "△ABC ~ △DEF", reason: "AA Similarity" }
      ],
      bank: {
        statements: ["△ABC ~ △DEF", "∠B ≅ ∠E", "∠A ≅ ∠D", "∠B, ∠E right ∠s"],
        reasons: ["Given", "All right ∠s are ≅", "AA Similarity", "SAS Similarity"]
      }
    },

    diagram: {
      points: [
        { id: "A", x: 40, y: 140, label: "A" },
        { id: "B", x: 100, y: 140, label: "B" },
        { id: "C", x: 100, y: 40, label: "C" },
        { id: "D", x: 150, y: 180, label: "D" },
        { id: "E", x: 240, y: 180, label: "E" },
        { id: "F", x: 240, y: 30, label: "F" }
      ],
      lines: [
        { id: "AB", from: "A", to: "B" },
        { id: "BC", from: "B", to: "C" },
        { id: "AC", from: "A", to: "C" },
        { id: "DE", from: "D", to: "E" },
        { id: "EF", from: "E", to: "F" },
        { id: "DF", from: "D", to: "F" }
      ],
      givenMarks: {
        ticks: [],
        arcs: [{ vertex: "A", rays: ["B", "C"], count: 1 }, { vertex: "D", rays: ["E", "F"], count: 1 }]
      }
    }
  }
];

let gameState = {
  currentLevel: 0,
  currentRegion: "Isocele",
  unlockedRegions: ["Isocele"],
  totalXP: 0,
  sovereignPoints: 0,
  character: null, // "male" or "female"
  unlockedLevels: [1],
  graduated: false,
  introSeen: false,
  userMarkings: { ticks: {}, arcs: {} },
  villagePopulation: 15,
  targetPopulation: 15,
  maxPopulation: 150,
  healthMetrics: {
    plague: 50,
    defense: 50,
    food: 50
  },
  upgrades: {},
  focusChoices: {}, // e.g., { 'Sentry Wall': 'Strength', 'Market Stalls': 'Prosperity' }
  eventsTriggered: [],
  gameTime: 0, // In days
  activeEvents: [],
  incomingEvents: [],
  hasMightyHero: false,
  defenseScore: 25, // Default 25%
  gamePurchased: false
};

/**
 * Initialization
 */
/**
 * Custom Notification logic
 */
function showNotification(message, title = "Royal Scroll") {
  const modal = document.getElementById("notification-modal");
  const msgEl = document.getElementById("notification-message");
  const titleEl = document.getElementById("notification-title");

  if (msgEl) msgEl.textContent = message;
  if (titleEl) titleEl.textContent = title;

  if (modal) {
    modal.classList.add("active");
    AudioManager.playSFX('interact');
  }
}

function closeNotification() {
  const modal = document.getElementById("notification-modal");
  if (modal) modal.classList.remove("active");
}

function initGame() {
  console.log("initGame: Beginning initialization...");
  try {
    loadGameState();

    // Reset visibility of all core layers
    const screens = ["title-screen", "char-selection-screen", "map-hub", "main-wrapper", "cinematic-overlay", "game-area"];
    screens.forEach(s => {
      const el = document.getElementById(s);
      if (el) el.style.display = "none";
    });

    if (gameState.graduated) {
      const wrapper = document.getElementById("main-wrapper");
      if (wrapper) wrapper.style.display = "grid";
      renderDashboard();
      handleGraduation();
    } else if (!gameState.character) {
      const ts = document.getElementById("title-screen");
      if (ts) ts.style.display = "flex";
    } else {
      renderDashboard();
    }

    updateUI();
    AudioManager.updateToggleIcon();
    setupEventListeners();
  } catch (err) {
    console.error("Initialization Error:", err);
    // Emergency reset if something went horribly wrong
    localStorage.removeItem("euclidState");
    alert("The Kingdom of Euclid has reset due to a logical rift in time. Please begin anew.");
    location.reload();
  }
}

function loadGameState() {
  console.log("loadGameState: Loading state...");
  try {
    const saved = localStorage.getItem("euclidState");
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed && typeof parsed === 'object') {
        // Merge saved state with defaults to ensure missing properties don't crash the game
        gameState = { ...gameState, ...parsed };
      }
    }
  } catch (e) {
    console.error("Failed to load game state:", e);
  }
}

function saveGameState() {
  localStorage.setItem("euclidState", JSON.stringify(gameState));
}

function setupEventListeners() {
  const submitBtn = document.getElementById("submit-proof");
  if (submitBtn) submitBtn.addEventListener("click", submitProof);
}

/**
 * Character Selection
 */
window.startStory = function () {
  const ts = document.getElementById("title-screen");
  if (ts) ts.style.display = "none";
  AudioManager.playMusic('intro');
  startCinematic(true);
};

window.skipIntro = function () {
  const ts = document.getElementById("title-screen");
  if (ts) ts.style.display = "none";
  showCharacterSelection();
  AudioManager.playMusic('hub');
};

function showCharacterSelection() {
  const overlay = document.getElementById("char-selection-screen");
  if (overlay) overlay.style.display = "flex";
}

window.selectCharacter = function (choice) {
  console.log("selectCharacter: Chosen character:", choice);
  gameState.character = choice;
  saveGameState();
  const selectionScreen = document.getElementById("char-selection-screen");
  if (selectionScreen) selectionScreen.style.display = "none";
  renderDashboard();
};

function startCinematic(leadToCharacter = false) {
  const overlay = document.getElementById("cinematic-overlay");
  const content = document.getElementById("cinematic-content");
  if (!overlay || !content) {
    if (leadToCharacter) showCharacterSelection();
    else renderDashboard();
    return;
  }

  overlay.style.display = "flex";
  overlay.style.opacity = "1";

  const paragraphs = [
    "Isocele was once a beacon of absolute truth...",
    "A kingdom where every stone was laid with logical precision.",
    "But your ancestors grew complacent. They traded proof for assumption.",
    "The Logical Decay crept in, crumbling the bridges and silencing the bells.",
    "Now, you return to these ruins, the Crown's Compass in hand.",
    "It falls to you, Royal Heir, to restore the Kingdom of Euclid.",
    "Prepare yourself... for the restoration begins now."
  ];

  let current = 0;

  function nextPara() {
    if (current >= paragraphs.length) {
      overlay.style.opacity = "0";
      setTimeout(() => {
        overlay.style.display = "none";
        if (leadToCharacter) showCharacterSelection();
        else renderDashboard();
      }, 2000);
      return;
    }

    content.innerHTML = `<p class="cinematic-text">${paragraphs[current]}</p>`;
    const p = content.querySelector('.cinematic-text');
    setTimeout(() => p.classList.add('fade-in'), 100);
    setTimeout(() => {
      p.classList.remove('fade-in');
      setTimeout(() => {
        current++;
        nextPara();
      }, 1000);
    }, 3000);
  }
  nextPara();
}

/**
 * UI Rendering & Map Hub
 */
function renderDashboard() {
  console.log("renderDashboard: Rendering dashboard...");
  renderMap();
  updateWorldBrightness();
}

function updateWorldBrightness() {
  const overlay = document.getElementById("world-brightness-overlay");
  const mapHub = document.getElementById("map-hub");
  if (!overlay) return;

  // Progress relative to all levels
  const progress = Math.min(1, gameState.currentLevel / levels.length);

  // 1. World Brightness Overlay (Dullness)
  const opacity = 0.3 - (progress * 0.2);
  overlay.style.opacity = Math.max(0.1, opacity);

  // 2. Map Hub Background Color Transition (More colorful as progress continues)
  if (mapHub) {
    // start more gray (100% grayscale) and get more colorful (0% grayscale)
    const grayVal = Math.max(0, 100 - (progress * 100));
    mapHub.style.setProperty('--map-grayscale', `${grayVal}%`);
  }
}

function renderMap() {
  console.log("renderMap: Rendering map hub...");
  const mapHub = document.getElementById("map-hub");
  const mainWrapper = document.getElementById("main-wrapper");
  const nodesContainer = document.getElementById("village-map");
  const villageView = document.getElementById("village-view");
  const gameArea = document.getElementById("game-area");

  AudioManager.playMusic('hub');

  // Update Map Background per region
  const bgImage = gameAssets.images.regions[gameState.currentRegion] || gameAssets.images.mapBackground.after;
  const hubContainer = document.getElementById("map-hub");
  if (hubContainer) {
    hubContainer.style.setProperty('--region-bg', `url(${bgImage})`);

    // Progressive coloring: background becomes more colorful as levels are completed
    const regionLevels = levels.filter(l => l.region === gameState.currentRegion);
    const completedInRegion = regionLevels.filter(l => l.id <= gameState.currentLevel).length;
    const totalInRegion = regionLevels.length;
    const colorProgress = totalInRegion > 0 ? (completedInRegion / totalInRegion) * 100 : 0;
    const grayscaleAmount = Math.max(0, 100 - colorProgress);
    // Use CSS variable so only background is affected, not node images
    hubContainer.style.setProperty('--map-grayscale', `${grayscaleAmount}%`);
  }

  renderKingdomHUD();

  if (mapHub) mapHub.style.display = "block";
  if (mainWrapper) mainWrapper.style.display = "none";
  if (villageView) villageView.style.display = "none";
  if (gameArea) gameArea.style.display = "none";

  // Hide Home button in nav
  const navHome = document.getElementById("nav-btn-home");
  if (navHome) navHome.style.display = "none";

  if (!nodesContainer) return;
  nodesContainer.innerHTML = "";

  // Draw Central Castle
  const castle = document.createElement("div");
  castle.className = "central-castle";

  // Show restored castle once ALL levels in CURRENT REGION are completed
  const regionLevelsForCastle = levels.filter(l => l.region === gameState.currentRegion);
  const regionComplete = regionLevelsForCastle.every(l => gameState.currentLevel >= l.id);
  const isCastleRestored = regionComplete || gameState.graduated;

  const regionHubs = gameAssets.images.centralCastle[gameState.currentRegion] || gameAssets.images.centralCastle["Isocele"];
  const castleImg = isCastleRestored ? regionHubs.after : regionHubs.before;
  castle.innerHTML = `<img src="${castleImg}" alt="Kingdom Center">`;
  nodesContainer.appendChild(castle);

  // Position nodes in a circle
  const regionLevels = levels.filter(l => l.region === gameState.currentRegion);

  regionLevels.forEach((level, index) => {
    // 360 / map size = angle per node. Start at top (-90 degrees)
    const angleDeg = (index * (360 / regionLevels.length)) - 90;
    const angleRad = angleDeg * (Math.PI / 180);
    const radiusX = 22;
    const radiusY = 31;
    const x = 50 + radiusX * Math.cos(angleRad);
    const y = 35 + radiusY * Math.sin(angleRad);
    const node = document.createElement("div");

    const isUnlocked = gameState.unlockedLevels.includes(level.id);
    const isRestored = gameState.currentLevel >= level.id; // Level ID is 1-indexed progression link
    const asset = gameAssets.images.levels.find(l => l.id === level.id);

    const beforeSrc = level.before || (asset ? asset.before : gameAssets.images.ruinedVillage);
    const afterSrc = level.after || (asset ? asset.after : gameAssets.images.restoredVillage);

    const isCompleted = gameState.currentLevel >= level.id;

    // Royal Guidance Logic: Find the first unlocked node that isn't completed
    const isNextQuest = isUnlocked && !isCompleted;

    node.className = `map-node ${isUnlocked ? 'unlocked' : 'locked'} ${isCompleted ? 'completed' : 'not-completed'} ${isNextQuest ? 'royal-guidance' : ''}`;
    node.style.left = `${x}%`;
    node.style.top = `${y}%`;

    const displaySrc = isCompleted ? afterSrc : beforeSrc;

    const upgradedLevel = (gameState.upgrades && gameState.upgrades[level.id]) || 0;
    const upgradeBadge = upgradedLevel > 0 ? `<div class="upgrade-badge"><i class="bi bi-stars"></i> ${upgradedLevel}</div>` : "";

    node.innerHTML = `
      <img src="${displaySrc}" class="node-img" alt="${level.name}">
      <div class="node-label">${level.name}</div>
      ${upgradeBadge}
    `;

    if (isUnlocked) {
      if (isCompleted) {
        node.onclick = () => window.buyUpgrade(level.id);
        node.title = "Click to Upgrade (100 SP)";
      } else {
        node.onclick = () => startLevel(level.id);
      }
    }

    nodesContainer.appendChild(node);
  });

  renderRegionSelector();
  renderAchievements();
}

/**
 * Region Selector UI - Now uses the header-based element exclusively
 */
function renderRegionSelector() {
  const selector = document.getElementById("region-selector");
  if (!selector) return;

  selector.innerHTML = "";
  const allRegions = ["Isocele", "The Rhombic Sands", "The Gaelic Grids"];

  allRegions.forEach(region => {
    const isUnlocked = gameState.unlockedRegions.includes(region);
    const btn = document.createElement("button");
    btn.className = `region-btn ${gameState.currentRegion === region ? 'active' : ''} ${!isUnlocked ? 'locked' : ''}`;
    btn.innerHTML = `<span>${region}</span> ${!isUnlocked ? '<i class="bi bi-lock-fill"></i>' : ''}`;

    if (isUnlocked) {
      btn.onclick = () => window.switchRegion(region);
    } else {
      btn.title = "Complete the previous region to unlock!";
    }
    selector.appendChild(btn);
  });
}

window.switchRegion = function (regionName) {
  if (gameState.unlockedRegions.includes(regionName)) {
    gameState.currentRegion = regionName;
    saveGameState();
    renderMap();
    renderKingdomHUD();

    // Play region-specific music
    if (regionName === "The Rhombic Sands") {
      AudioManager.playMusic('sands');
    } else if (regionName === "The Gaelic Grids") {
      AudioManager.playMusic('grids');
    } else {
      AudioManager.playMusic('hub');
    }
  }
};

function renderAchievements() {
  const panel = document.getElementById("achievements-panel");
  if (!panel) return;
  panel.innerHTML = ""; // Clear existing

  const badges = [
    { threshold: 1, name: "Bridge Builder", icon: "bi-hammer" },
    { threshold: 5, name: "Master of ASA", icon: "bi-shield-check" },
    { threshold: 10, name: "Sovereign of Truth", icon: "bi-award-fill" }
  ];

  badges.forEach(badge => {
    const isEarned = gameState.currentLevel >= badge.threshold;
    const badgeEl = document.createElement("div");
    badgeEl.className = "achievement-item";

    // Checkmark icon for earned status
    const icon = isEarned ? 'bi-check-circle-fill' : 'bi-circle';
    badgeEl.innerHTML = `<i class="bi ${icon}"></i> ${badge.name}`;
    panel.appendChild(badgeEl);
  });
}

let isDialogueActive = false;

function showNarrative(speaker, text, options = null) {
  if (isDialogueActive && (!options || options.length === 0)) {
    console.warn("Dialogue loop prevention: Blocking overlapping narrative.");
    return;
  }
  isDialogueActive = true;

  const overlay = document.getElementById("narrative-overlay");
  const speakerEl = document.getElementById("speaker-name");
  const textEl = document.getElementById("dialogue-text");
  const portrait = document.getElementById("character-portrait");
  const choiceContainer = document.getElementById("choice-container");
  const closeBtn = document.getElementById("close-narrative-btn");

  if (!overlay) return;

  if (speakerEl) speakerEl.textContent = speaker;
  if (textEl) textEl.innerHTML = text;

  if (portrait) {
    const charMap = {
      "Grand Vizier": gameAssets.images.characters.grandVizier,
      "Lady Aurelia": gameAssets.images.characters.architect,
      "Valerius": gameAssets.images.characters.merchant,
      "Commander Kaelen": gameAssets.images.characters.sentinel,
      "Mighty Hero": "Images/MightyHero.png"
    };

    if (charMap[speaker]) {
      portrait.src = charMap[speaker];
    } else {
      // Correct character persistence for all selection roles
      const charImages = gameAssets.images.characters;
      portrait.src = charImages[gameState.character] || charImages.female;
    }
  }

  // Handle Choice Buttons
  if (choiceContainer) {
    if (options && options.length > 0) {
      choiceContainer.style.display = "flex";
      choiceContainer.innerHTML = "";
      closeBtn.style.display = "none";
      options.forEach(opt => {
        const btn = document.createElement("button");
        btn.className = "btn-choice";
        btn.innerHTML = `<span>${opt.text}</span>`;
        btn.onclick = () => {
          opt.callback();
          isDialogueActive = false;
        };
        choiceContainer.appendChild(btn);
      });
    } else {
      choiceContainer.style.display = "none";
      if (closeBtn) {
        closeBtn.style.display = "block";
        closeBtn.onclick = () => {
          closeNarrative();
          isDialogueActive = false;
        }
      }
    }
  }

  overlay.style.display = "flex";
}

function applyChoiceImpact(impact) {
  if (!impact) return;
  if (impact.population) {
    gameState.targetPopulation = Math.max(0, gameState.targetPopulation + impact.population);
    // Ensure current population also doesn't go negative if we force it
    gameState.villagePopulation = Math.max(0, gameState.villagePopulation);
  }
  if (impact.food) gameState.healthMetrics.food = Math.min(100, Math.max(0, gameState.healthMetrics.food + impact.food));
  if (impact.plague) gameState.healthMetrics.plague = Math.min(100, Math.max(0, gameState.healthMetrics.plague + impact.plague));
  if (impact.defense) gameState.healthMetrics.defense = Math.min(100, Math.max(0, gameState.healthMetrics.defense + impact.defense));
  if (impact.sovereign) gameState.sovereignPoints = Math.max(0, gameState.sovereignPoints + impact.sovereign);

  if (impact.population > 0) spawnOrbs(3, 'citizen');
  else if (impact.population < 0) spawnOrbs(3, 'death');

  renderKingdomHUD();
  saveGameState();
}

window.closeNarrative = function () {
  const overlay = document.getElementById("narrative-overlay");
  if (overlay) overlay.style.display = "none";
}

function updateUI() {
  const xpEl = document.getElementById("total-xp");
  const levelEl = document.getElementById("current-level-val");
  const xpVal = gameState.totalXP || 0;
  const levelVal = (gameState.currentLevel || 0) + 1;

  if (xpEl) xpEl.textContent = xpVal;
  if (levelEl) levelEl.textContent = levelVal;
}

/**
 * Level Gameplay
 */
window.startLevel = function (levelId) {
  console.log("startLevel: Starting level ID:", levelId);
  
  if (levelId > 5 && !gameState.gamePurchased) {
    const modal = document.getElementById("premium-modal");
    if (modal) modal.classList.add("active");
    AudioManager.playSFX('interact');
    return;
  }

  const level = levels.find((l) => l.id === levelId);
  if (!level) return;

  gameState.activeLevel = level;

  // 1. Show Quest Briefing instead of starting immediately
  const briefingModal = document.getElementById("quest-briefing-modal");
  const briefingTitle = document.getElementById("briefing-title");
  const briefingImg = document.getElementById("briefing-img");
  const briefingStory = document.getElementById("briefing-story");
  const briefingTheorem = document.getElementById("briefing-theorem");

  if (briefingTitle) briefingTitle.textContent = `${level.id}. ${level.name}`;
  if (briefingStory) briefingStory.textContent = level.narrative.intro;
  if (briefingTheorem) briefingTheorem.style.display = "none";

  const asset = gameAssets.images.levels.find(l => l.id === level.id);
  const briefingSrc = level.before || (asset ? asset.before : gameAssets.images.ruinedVillage);
  if (briefingImg) briefingImg.src = briefingSrc;


  if (briefingModal) briefingModal.classList.add("active");

  // UI Prep (Hide Map, Show Main Wrapper)
  const mapHub = document.getElementById("map-hub");
  if (mapHub) mapHub.style.display = "none";

  // CRITICAL: Hide main-wrapper entirely during math levels to prevent the black gap
  const mainWrapper = document.getElementById("main-wrapper");
  if (mainWrapper) mainWrapper.style.display = "none";

  const gameArea = document.getElementById("game-area");
  if (gameArea) {
    gameArea.style.display = "flex";
    gameArea.style.marginTop = "70px"; // Align under fixed header
    gameArea.style.paddingTop = "2rem"; // Give space from header as requested
    gameArea.scrollTop = 0;
  }

  // Ensure orbs container is hidden while in question screen
  const orbContainer = document.getElementById("orb-container");
  if (orbContainer) orbContainer.style.display = "none";

  // Show Home button in nav
  const navHome = document.getElementById("nav-btn-home");
  if (navHome) navHome.style.display = "flex";
};

window.beginActivation = function () {
  const briefingModal = document.getElementById("quest-briefing-modal");
  if (briefingModal) briefingModal.classList.remove("active");

  const level = gameState.activeLevel;

  // Region-specific quest music
  const regionMusicMap = {
    "Isocele": "quest",
    "The Rhombic Sands": "sands",
    "The Gaelic Grids": "grids"
  };
  const questTrack = (level && level.region) ? (regionMusicMap[level.region] || "quest") : "quest";

  if (level && level.narrative.choices && level.narrative.choices.length > 0) {
    const choice = level.narrative.choices[0];
    showNarrative(choice.speaker, choice.text, choice.options.map(opt => ({
      text: opt.text,
      callback: () => {
        applyChoiceImpact(opt.impact);
        closeNarrative();
        AudioManager.playMusic(questTrack);
        actuallyStartQuest();
      }
    })));
  } else {
    AudioManager.playMusic(questTrack);
    actuallyStartQuest();
  }
};



function actuallyStartQuest() {
  console.log("actuallyStartQuest: Level officially starting...");
  const level = gameState.activeLevel;
  const villageBg = document.getElementById("village-bg");
  const gameArea = document.getElementById("game-area");
  const levelTitle = document.getElementById("level-title");
  const asset = gameAssets.images.levels.find(l => l.id === level.id);
  const diagramSection = document.querySelector(".diagram-section");

  // Reset markings for new level
  gameState.userMarkings = { ticks: {}, arcs: {} };
  gameState.hintState = { lastStepIndex: -1, tier: 0 };
  saveGameState();

  if (gameArea) gameArea.style.display = "flex";

  if (villageBg && asset) {
    villageBg.src = asset.before;
    villageBg.style.opacity = "1";
    if (diagramSection) {
      diagramSection.style.setProperty('--panel-bg-img', `url(${asset.before})`);
    }
  }

  if (levelTitle) levelTitle.textContent = `${level.id}. ${level.name}`;

  const logicText = document.getElementById("logic-text");
  if (logicText) {
    logicText.innerHTML = `<strong>Given:</strong> ${level.proofData.given.join(", ")}<br><strong>Prove:</strong> ${level.proofData.prove}`;
  }

  renderDiagram(level.diagram);
  renderProofTable(level.proofData);
  renderAnswerBank(level.proofData.bank);

  // Hide answer bank as we use dropdowns now
  const answerBank = document.querySelector(".answer-bank");
  if (answerBank) answerBank.style.display = "none";
}

function renderDiagram(diagram) {
  const svg = document.getElementById("diagram-svg");
  if (!svg) return;
  svg.innerHTML = "";

  const getPoint = (id) => diagram.points.find((p) => p.id === id);

  // Draw Lines
  diagram.lines.forEach((line) => {
    const from = getPoint(line.from);
    const to = getPoint(line.to);
    if (!from || !to) return;
    const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
    lineEl.setAttribute("x1", from.x);
    lineEl.setAttribute("y1", from.y);
    lineEl.setAttribute("x2", to.x);
    lineEl.setAttribute("y2", to.y);
    lineEl.setAttribute("stroke", "var(--logic-cyan)");
    lineEl.setAttribute("stroke-width", "8"); // Thicker hitbox
    lineEl.setAttribute("stroke-opacity", "0"); // Invisible hitbox
    lineEl.style.cursor = "pointer";
    lineEl.onclick = (e) => toggleUserTick(line.id, e);
    svg.appendChild(lineEl);

    // Visible line
    const visibleLine = document.createElementNS("http://www.w3.org/2000/svg", "line");
    visibleLine.setAttribute("x1", from.x);
    visibleLine.setAttribute("y1", from.y);
    visibleLine.setAttribute("x2", to.x);
    visibleLine.setAttribute("y2", to.y);
    visibleLine.setAttribute("stroke", "var(--logic-cyan)");
    visibleLine.setAttribute("stroke-width", "3");
    visibleLine.style.pointerEvents = "none";
    svg.appendChild(visibleLine);
  });

  // Draw Marks (Ticks & Arcs)
  // 1. Given Marks
  if (diagram.givenMarks) {
    diagram.givenMarks.ticks.forEach(tick => {
      const line = diagram.lines.find(l => l.id === tick.line);
      if (line) drawTicks(svg, getPoint(line.from), getPoint(line.to), tick.count);
    });
    diagram.givenMarks.arcs.forEach(arc => {
      const vertex = getPoint(arc.vertex);
      const rays = arc.rays.map(r => getPoint(r));
      // Pass arc.radius if specified for smaller/larger arcs on specific diagrams
      drawArc(svg, vertex, rays, arc.count, arc.label, false, false, null, arc.radius || null);
    });

  }

  // 2. User Marks
  Object.keys(gameState.userMarkings.ticks).forEach(lineId => {
    const marks = gameState.userMarkings.ticks[lineId];
    if (Array.isArray(marks)) {
      marks.forEach(m => {
        const line = diagram.lines.find(l => l.id === lineId);
        if (line) drawTicks(svg, getPoint(line.from), getPoint(line.to), m.count, true, m.pos);
      });
    }
  });

  Object.keys(gameState.userMarkings.arcs).forEach(arcKey => {
    const marks = gameState.userMarkings.arcs[arcKey];
    if (Array.isArray(marks)) {
      marks.forEach(m => {
        const [vId, raysPart] = arcKey.split("_");
        const [r1Id, r2Id] = raysPart.split("-");
        const vertex = getPoint(vId);
        const rays = [getPoint(r1Id), getPoint(r2Id)];
        drawArc(svg, vertex, rays, m.count, null, true, false, null, m.radius);
      });
    }
  });

  // 3. Angle Click Hitboxes (Invisible)
  // OMNI-ANGLE FIX: Find all rays emanating from each vertex
  diagram.points.forEach(vertex => {
    const rawRays = [];

    // a) Lines where vertex is an endpoint
    diagram.lines.forEach(l => {
      if (l.from === vertex.id) rawRays.push({ id: l.to, pt: getPoint(l.to) });
      else if (l.to === vertex.id) rawRays.push({ id: l.from, pt: getPoint(l.from) });
    });

    // b) Lines where vertex lies in the middle (Colinear detection)
    diagram.lines.forEach(l => {
      const p1 = getPoint(l.from);
      const p2 = getPoint(l.to);
      if (l.from === vertex.id || l.to === vertex.id) return;

      const d1 = Math.sqrt((vertex.x - p1.x) ** 2 + (vertex.y - p1.y) ** 2);
      const d2 = Math.sqrt((vertex.x - p2.x) ** 2 + (vertex.y - p2.y) ** 2);
      const dTotal = Math.sqrt((p1.x - p2.x) ** 2 + (p1.y - p2.y) ** 2);

      if (Math.abs(d1 + d2 - dTotal) < 1.0) {
        rawRays.push({ id: l.from, pt: p1 });
        rawRays.push({ id: l.to, pt: p2 });
      }
    });

    // Deduplicate rays by point ID to prevent redundant hitboxes
    const rays = [];
    const seen = new Set();
    rawRays.forEach(r => {
      if (!seen.has(r.id)) {
        seen.add(r.id);
        rays.push(r);
      }
    });

    // Create hitboxes for all pairs of rays
    for (let i = 0; i < rays.length; i++) {
      for (let j = i + 1; j < rays.length; j++) {
        const r1 = rays[i];
        const r2 = rays[j];

        // Skip 180 deg angles
        const angle1 = Math.atan2(r1.pt.y - vertex.y, r1.pt.x - vertex.x);
        const angle2 = Math.atan2(r2.pt.y - vertex.y, r2.pt.x - vertex.x);
        let diff = Math.abs(angle1 - angle2);
        if (diff > Math.PI) diff = 2 * Math.PI - diff;
        if (diff < 0.1 || diff > Math.PI - 0.1) continue;
        // Create an invisible arc hitbox centered at 45 to cover the 30-60 marking range
        drawArc(svg, vertex, [r1.pt, r2.pt], 1, null, false, true, (e) => toggleUserArc(vertex.id, r1.id, r2.id, e), 45);
      }
    }
  });

  // Draw Points and Labels
  diagram.points.forEach((point) => {
    if (!point.label || point.label.length > 2) return; // Skip helper points/labels
    const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
    circle.setAttribute("cx", point.x);
    circle.setAttribute("cy", point.y);
    circle.setAttribute("r", "5");
    circle.setAttribute("fill", "var(--medieval-gold)");
    svg.appendChild(circle);

    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", point.x + 10);
    text.setAttribute("y", point.y - 10);
    text.setAttribute("fill", "white");
    text.setAttribute("font-family", "Space Mono");
    text.setAttribute("font-size", "16");
    text.setAttribute("font-weight", "bold");
    text.textContent = point.label;
    svg.appendChild(text);
  });
}

window.toggleUserTick = function (lineId, event) {
  if (!gameState.userMarkings.ticks[lineId]) gameState.userMarkings.ticks[lineId] = [];

  const line = gameState.activeLevel.diagram.lines.find(l => l.id === lineId);
  const p1 = gameState.activeLevel.diagram.points.find(p => p.id === line.from);
  const p2 = gameState.activeLevel.diagram.points.find(p => p.id === line.to);

  const svg = document.getElementById("diagram-svg");
  const CTM = svg.getScreenCTM();
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const localPt = pt.matrixTransform(CTM.inverse());

  // Project onto line
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const lenSq = dx * dx + dy * dy;
  const t = ((localPt.x - p1.x) * dx + (localPt.y - p1.y) * dy) / lenSq;
  const pos = Math.max(0.1, Math.min(0.9, t));

  const existing = gameState.userMarkings.ticks[lineId].find(m => Math.abs(m.pos - pos) < 0.1);
  if (existing) {
    existing.count = (existing.count + 1) % 4;
    if (existing.count === 0) {
      gameState.userMarkings.ticks[lineId] = gameState.userMarkings.ticks[lineId].filter(m => m !== existing);
    }
  } else {
    gameState.userMarkings.ticks[lineId].push({ pos: pos, count: 1 });
  }

  // Push to history for Undo
  if (!gameState.markHistory) gameState.markHistory = [];
  gameState.markHistory.push({ type: 'tick', lineId: lineId, pos: pos });
  if (gameState.markHistory.length > 50) gameState.markHistory.shift();

  saveGameState();
  renderDiagram(gameState.activeLevel.diagram);
};

window.toggleUserArc = function (vId, r1Id, r2Id, event) {
  const arcKey = vId + "_" + [r1Id, r2Id].sort().join("-");
  if (!gameState.userMarkings.arcs[arcKey]) gameState.userMarkings.arcs[arcKey] = [];

  const svg = document.getElementById("diagram-svg");
  const CTM = svg.getScreenCTM();
  const pt = svg.createSVGPoint();
  pt.x = event.clientX;
  pt.y = event.clientY;
  const localPt = pt.matrixTransform(CTM.inverse());

  const vertex = gameState.activeLevel.diagram.points.find(p => p.id === vId);
  const dist = Math.sqrt((localPt.x - vertex.x) ** 2 + (localPt.y - vertex.y) ** 2);

  // Snap radius to steps of 10 for easier toggling (30, 40, 50, etc.)
  const radius = Math.round(dist / 10) * 10;
  const clampedRadius = Math.max(30, Math.min(60, radius));

  const existing = gameState.userMarkings.arcs[arcKey].find(m => Math.abs(m.radius - clampedRadius) < 5);
  if (existing) {
    existing.count = (existing.count + 1) % 4;
    if (existing.count === 0) {
      gameState.userMarkings.arcs[arcKey] = gameState.userMarkings.arcs[arcKey].filter(m => m !== existing);
    }
  } else {
    gameState.userMarkings.arcs[arcKey].push({ radius: clampedRadius, count: 1 });
  }

  // Push to history for Undo
  if (!gameState.markHistory) gameState.markHistory = [];
  gameState.markHistory.push({ type: 'arc', arcKey: arcKey, radius: clampedRadius });
  if (gameState.markHistory.length > 50) gameState.markHistory.shift();

  saveGameState();
  renderDiagram(gameState.activeLevel.diagram);
};

window.undoMark = function () {
  if (!gameState.markHistory || gameState.markHistory.length === 0) return;
  const last = gameState.markHistory.pop();

  if (last.type === 'tick') {
    const marks = gameState.userMarkings.ticks[last.lineId];
    if (marks) {
      const mark = marks.find(m => Math.abs(m.pos - last.pos) < 0.01);
      if (mark) {
        mark.count--;
        if (mark.count <= 0) {
          gameState.userMarkings.ticks[last.lineId] = marks.filter(m => m !== mark);
        }
      }
    }
  } else if (last.type === 'arc') {
    const marks = gameState.userMarkings.arcs[last.arcKey];
    if (marks) {
      const mark = marks.find(m => Math.abs(m.radius - last.radius) < 1);
      if (mark) {
        mark.count--;
        if (mark.count <= 0) {
          gameState.userMarkings.arcs[last.arcKey] = marks.filter(m => m !== mark);
        }
      }
    }
  }

  saveGameState();
  renderDiagram(gameState.activeLevel.diagram);
};

window.clearAllMarks = function () {
  if (confirm("Are you sure you want to clear all logic markings from this diagram?")) {
    gameState.userMarkings = { ticks: {}, arcs: {} };
    gameState.markHistory = [];
    saveGameState();
    renderDiagram(gameState.activeLevel.diagram);
  }
};

function drawTicks(svg, p1, p2, count, isUser = false, pos = 0.5) {
  const midX = p1.x + (p2.x - p1.x) * pos;
  const midY = p1.y + (p2.y - p1.y) * pos;
  const dx = p2.x - p1.x;
  const dy = p2.y - p1.y;
  const angle = Math.atan2(dy, dx);
  const perp = angle + Math.PI / 2;
  const spacing = 8;
  const tickLen = 10;

  for (let i = 0; i < count; i++) {
    const offset = (i - (count - 1) / 2) * spacing;
    const tx = midX + Math.cos(angle) * offset;
    const ty = midY + Math.sin(angle) * offset;

    const x1 = tx + Math.cos(perp) * (tickLen / 2);
    const y1 = ty + Math.sin(perp) * (tickLen / 2);
    const x2 = tx - Math.cos(perp) * (tickLen / 2);
    const y2 = ty - Math.sin(perp) * (tickLen / 2);

    const line = document.createElementNS("http://www.w3.org/2000/svg", "line");
    line.setAttribute("x1", x1);
    line.setAttribute("y1", y1);
    line.setAttribute("x2", x2);
    line.setAttribute("y2", y2);
    line.setAttribute("stroke", isUser ? "var(--logic-cyan)" : "var(--medieval-gold)");
    line.setAttribute("stroke-width", "2");
    line.style.pointerEvents = "none";
    svg.appendChild(line);
  }
}

function drawArc(svg, vertex, rays, count, label, isUser = false, isHitbox = false, onClick = null, overrideRadius = null) {
  // Calculate vector angles from vertex
  const angles = rays.map(r => Math.atan2(r.y - vertex.y, r.x - vertex.x));
  let start = angles[0];
  let end = angles[1];

  // Ensure we take the shortest path between angles
  let diff = end - start;
  while (diff < -Math.PI) diff += Math.PI * 2;
  while (diff > Math.PI) diff -= Math.PI * 2;

  const baseRadius = overrideRadius || 30;
  const spacing = 6;

  for (let i = 0; i < count; i++) {
    const r = baseRadius + i * spacing;
    const x1 = vertex.x + Math.cos(start) * r;
    const y1 = vertex.y + Math.sin(start) * r;
    const x2 = vertex.x + Math.cos(start + diff) * r;
    const y2 = vertex.y + Math.sin(start + diff) * r;

    // SVG large-arc-flag based on diff
    const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
    const sweep = diff > 0 ? 1 : 0;

    const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
    path.setAttribute("d", `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`);
    path.setAttribute("fill", "none");
    path.setAttribute("stroke", isHitbox ? "transparent" : (isUser ? "var(--logic-cyan)" : "var(--medieval-gold)"));
    path.setAttribute("stroke-width", isHitbox ? "25" : "2");
    if (isHitbox) {
      path.style.cursor = "pointer";
      path.onclick = onClick;
      path.onmouseover = () => path.setAttribute("stroke", "rgba(0, 255, 255, 0.2)");
      path.onmouseout = () => path.setAttribute("stroke", "transparent");
    } else {
      path.style.pointerEvents = "none";
    }
    svg.appendChild(path);
  }

  if (label) {
    const midAngle = start + diff / 2;
    const labelR = baseRadius + (count * spacing) + 12;
    const lx = vertex.x + Math.cos(midAngle) * labelR;
    const ly = vertex.y + Math.sin(midAngle) * labelR;
    const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
    text.setAttribute("x", lx);
    text.setAttribute("y", ly);
    text.setAttribute("fill", "white");
    text.setAttribute("text-anchor", "middle");
    text.setAttribute("dominant-baseline", "middle");
    text.setAttribute("font-size", "12");
    text.setAttribute("font-weight", "bold");
    text.textContent = label;
    svg.appendChild(text);
  }
}

const GLOBAL_DISTRACTORS = {
  statements: [
    "∠A + ∠B = 180°", "AB || CD", "∠1 ≅ ∠3", "AC ≅ BD", "△ABC is Isosceles",
    "m∠ABC = 90°", "Area = 1/2(base)(height)", "a² + b² = c²", "XY ≅ YZ", "∠X and ∠Y are complementary",
    "∠1 and ∠2 are supplementary", "BC ⊥ AD", "Point M is the midpoint", "Quadrilateral ABCD is a Parallelogram",
    "∠ABC is a Right Angle", "Sum of interior angles = 180°", "x + y = 90", "Segment AB is bisected by C"
  ],
  reasons: [
    "Substitution Property", "Angle Addition Postulate", "Segment Addition Postulate",
    "Definition of Midpoint", "Alternate Interior Angles Theorem", "Corresponding Angles Postulate",
    "Transitive Property", "Pythagorean Theorem", "Definition of Right Angle", "Symmetric Property",
    "Reflexive Property", "Vertical Angles Theorem", "Definition of Perpendicular", "Definition of Altitude", "Subtraction Property",
    "Addition Property", "Distributive Property", "Definition of Angle Bisector", "Definition of Segment Bisector", "CPCTC"
  ]
};

function renderProofTable(proofData) {
  const tbody = document.getElementById("proof-body");
  if (!tbody) return;
  tbody.innerHTML = "";

  const bank = proofData.bank || { statements: [], reasons: [] };

  proofData.steps.forEach((step, index) => {
    const tr = document.createElement("tr");
    tr.className = "proof-row";

    // Start with level's bank options, then add distractors to reach 6-10 options
    let stmtOptions = [...new Set(bank.statements)];
    let reasonOptions = [...new Set(bank.reasons)];

    // Add distractors to reach target of 6-10 options
    const targetMin = 6;
    const targetMax = 10;

    // Shuffle distractors and add only what's needed
    const shuffledStmtDistractors = [...GLOBAL_DISTRACTORS.statements].sort(() => Math.random() - 0.5);
    const shuffledReasonDistractors = [...GLOBAL_DISTRACTORS.reasons].sort(() => Math.random() - 0.5);

    // Normalize text for deduplication (e.g., "Def." vs "Definition")
    const normalize = (s) => s.toLowerCase().replace(/\bdef\.\s*/g, "definition ").replace(/\s+/g, " ").trim();
    const isDuplicate = (arr, item) => arr.some(existing => normalize(existing) === normalize(item));

    while (stmtOptions.length < targetMin && shuffledStmtDistractors.length > 0) {
      const distractor = shuffledStmtDistractors.pop();
      if (!isDuplicate(stmtOptions, distractor)) stmtOptions.push(distractor);
    }

    while (reasonOptions.length < targetMin && shuffledReasonDistractors.length > 0) {
      const distractor = shuffledReasonDistractors.pop();
      if (!isDuplicate(reasonOptions, distractor)) reasonOptions.push(distractor);
    }

    // Shuffle final options
    stmtOptions.sort(() => Math.random() - 0.5);
    reasonOptions.sort(() => Math.random() - 0.5);

    const isGiven = step.reason === "Given" || step.reason.includes("Given");

    tr.innerHTML = `
      <td>${index + 1}</td>
      <td>
        ${isGiven
        ? `<div class="proof-dropdown-static">${step.statement}</div>`
        : `<select class="proof-dropdown" data-type="statement" data-index="${index}">
               <option value="">-- Select Statement --</option>
               ${stmtOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
             </select>`
      }
      </td>
      <td>
        ${isGiven
        ? `<div class="proof-dropdown-static">Given</div>`
        : `<select class="proof-dropdown" data-type="reason" data-index="${index}">
               <option value="">-- Select Reason --</option>
               ${reasonOptions.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
             </select>`
      }
      </td>
    `;

    tbody.appendChild(tr);
  });
}


function submitProof() {
  const level = gameState.activeLevel;
  if (!level) return;
  const rows = document.querySelectorAll(".proof-row");

  console.log("submitProof: Starting verification for level", level.id, level.name);
  console.log("submitProof: Found", rows.length, "proof rows");

  let allCorrect = true;


  level.proofData.steps.forEach((step, index) => {
    const row = rows[index];
    const isGiven = step.reason === "Given" || step.reason.includes("Given");

    let userStmt, userReason;

    if (isGiven) {
      userStmt = step.statement;
      userReason = "Given";
    } else {
      const stmtSelect = row.querySelector('select[data-type="statement"]');
      const reasonSelect = row.querySelector('select[data-type="reason"]');
      userStmt = stmtSelect ? stmtSelect.value : "";
      userReason = reasonSelect ? reasonSelect.value : "";
    }

    const isStmtCorrect = userStmt === step.statement;
    const isReasonCorrect = userReason === step.reason;

    if (isStmtCorrect && isReasonCorrect) {
      row.classList.remove("incorrect");
      row.classList.add("correct");
    } else {
      row.classList.remove("correct");
      row.classList.add("incorrect");
      allCorrect = false;
    }
  });

  if (allCorrect) {
    saveGameState();
    handleVictory();
  } else {
    showNotification("The logic is flawed, Royal Heir. Re-examine the scroll.", "Logical Decay Detected");
    AudioManager.playSFX('interact');
  }
}

window.provideHint = function () {
  const level = gameState.activeLevel;
  const rows = document.querySelectorAll(".proof-row");
  const wisdomOverlay = document.getElementById("wisdom-overlay");
  const wisdomText = document.getElementById("wisdom-text");

  if (!gameState.hintState) {
    gameState.hintState = { lastStepIndex: -1, tier: 0 };
  }

  // Helper function to get educational concept hints based on theorem/reason
  function getConceptHint(reason, theorem) {
    const conceptExplanations = {
      "Reflexive Property": "When a segment or angle is compared to itself, it is always congruent. This is called the Reflexive Property. Look for shared sides between your triangles.",
      "SSS Congruence": "Side-Side-Side (SSS) means all three pairs of corresponding sides must be congruent. Count the tick marks on each side to identify matching pairs.",
      "SAS Congruence": "Side-Angle-Side (SAS) needs two sides AND the included angle (the angle BETWEEN those sides) to be congruent. The angle must be 'sandwiched' between the sides.",
      "ASA Congruence": "Angle-Side-Angle (ASA) needs two angles AND the included side (the side BETWEEN those angles) to be congruent.",
      "AAS Congruence": "Angle-Angle-Side (AAS) needs two angles and a non-included side to be congruent. The side is NOT between the angles.",
      "HL Theorem": "Hypotenuse-Leg (HL) only works for right triangles. You need the hypotenuse (longest side) and one leg to be congruent.",
      "CPCTC": "Corresponding Parts of Congruent Triangles are Congruent. Once you prove triangles are congruent, ALL their matching parts are congruent!",
      "Vertical Angles Theorem": "When two lines cross, they form two pairs of vertical angles. Vertical angles are always congruent - they're the angles that are across from each other.",
      "Definition of Angle Bisector": "An angle bisector splits an angle into two equal parts. If a ray bisects an angle, the two resulting angles are congruent.",
      "Definition of Segment Bisector": "A segment bisector divides a segment into two equal parts. If a line bisects a segment, the two resulting segments are congruent.",
      "Definition of Altitude": "An altitude is a perpendicular line from a vertex to the opposite side. It creates right angles at the base.",
      "Definition of Perpendicular": "Perpendicular lines meet at right angles (90 degrees). If a line is perpendicular to another, it creates right angles at the intersection.",
      "Corresponding Angles Postulate": "When parallel lines are cut by a transversal, corresponding angles (in matching positions) are congruent.",
      "Converse Alt. Int. ∠s Theorem": "If alternate interior angles are congruent, then the lines are parallel. This is the 'reverse' of the parallel lines theorem.",
      "AA Similarity": "Angle-Angle (AA) Similarity: If two angles of one triangle are congruent to two angles of another, the triangles are similar (same shape, different size)."
    };
    return conceptExplanations[reason] || `Think about what property or theorem would justify this step in the proof. Consider the ${theorem} theorem.`;
  }

  for (let i = 0; i < level.proofData.steps.length; i++) {
    const row = rows[i];
    const target = level.proofData.steps[i];
    const isGiven = target.reason === "Given";

    let userStmt, userReason;
    let stmtEl, reasonEl;

    if (isGiven) {
      userStmt = target.statement;
      userReason = target.reason;
    } else {
      stmtEl = row.querySelector('select[data-type="statement"]');
      reasonEl = row.querySelector('select[data-type="reason"]');
      userStmt = stmtEl ? stmtEl.value : "";
      userReason = reasonEl ? reasonEl.value : "";
    }

    if (userStmt !== target.statement || userReason !== target.reason) {
      if (gameState.hintState.lastStepIndex === i) {
        gameState.hintState.tier = Math.min(3, gameState.hintState.tier + 1);
      } else {
        gameState.hintState.lastStepIndex = i;
        gameState.hintState.tier = 0;
      }

      if (stmtEl && userStmt !== target.statement) stmtEl.classList.add("hint-glow");
      if (reasonEl && userReason !== target.reason) reasonEl.classList.add("hint-glow");

      let hint = "";
      const tier = gameState.hintState.tier;

      if (tier === 0) {
        // Tier 0: Teach the concept
        hint = `The Sage teaches: "${getConceptHint(target.reason, level.theorem)}"`;
      } else if (tier === 1) {
        // Tier 1: Explain how to apply it
        hint = `The Sage explains: "To apply ${target.reason}, look at the diagram. What elements match this property? Consider what relationships are marked or given."`;
      } else if (tier === 2) {
        // Tier 2: Guide toward the answer
        const stmtPreview = target.statement.substring(0, 12);
        const reasonPreview = target.reason.split(" ")[0];
        hint = `The Sage guides: "For this step, the statement starts with '${stmtPreview}...' and the reason involves '${reasonPreview}...'"`;
      } else {
        // Tier 3: Full reveal after multiple attempts
        hint = `The Sage reveals: "Select '${target.statement}' and '${target.reason}' to proceed."`;
      }

      if (wisdomOverlay && wisdomText) {
        wisdomText.textContent = hint;
        wisdomOverlay.style.display = "block";
      }

      setTimeout(() => {
        if (stmtEl) stmtEl.classList.remove("hint-glow");
        if (reasonEl) reasonEl.classList.remove("hint-glow");
      }, 3000);
      return;
    }
  }
};


window.closeWisdom = function () {
  const overlay = document.getElementById("wisdom-overlay");
  if (overlay) overlay.style.display = "none";
};

function handleVictory() {
  const level = gameState.activeLevel;
  AudioManager.playMusic('victory', false);

  gameState.totalXP += 100;
  gameState.sovereignPoints += 100; // Earn SP for city building

  // Update unlocked levels
  // No redundant increment here

  saveGameState();
  showVictoryModal(level);
}

function renderKingdomHUD() {
  const popEl = document.getElementById("pop-count");
  const maxPopEl = document.getElementById("max-pop");
  const popFill = document.getElementById("pop-bar-fill");
  const restoreEl = document.getElementById("restore-progress");
  const sovereignEl = document.getElementById("sovereign-points");
  const xpEl = document.getElementById("total-xp-display");
  const villageBg = document.getElementById("village-bg");

  const newPop = Math.floor(gameState.villagePopulation);
  const maxPop = gameState.maxPopulation || 100;

  if (popEl) {
    const oldPop = parseInt(popEl.textContent) || 0;
    popEl.textContent = newPop;
    if (newPop > oldPop && oldPop !== 0) {
      popEl.parentElement.classList.add("pulse-growth");
      setTimeout(() => popEl.parentElement.classList.remove("pulse-growth"), 2000);
    } else if (newPop < oldPop) {
      popEl.parentElement.classList.add("pulse-loss");
      setTimeout(() => popEl.parentElement.classList.remove("pulse-loss"), 2000);
    }
  }

  if (maxPopEl) maxPopEl.textContent = maxPop;

  if (popFill) popFill.style.width = `${Math.min(100, (newPop / maxPop) * 100)}%`;

  if (restoreEl) restoreEl.textContent = `${gameState.currentLevel}/${levels.length}`;
  if (sovereignEl) sovereignEl.textContent = gameState.sovereignPoints;
  if (xpEl) xpEl.textContent = gameState.totalXP;

  // Update Village Visuals Based on Population Health
  if (villageBg) {
    const popPercent = (newPop / maxPop) * 100;
    if (popPercent >= 90) {
      villageBg.src = "Images/VillagersHappy.png";
    } else if (popPercent >= 50) {
      villageBg.src = "Images/VillagersContent.png";
    } else if (popPercent >= 20) {
      villageBg.src = "Images/VillagersStruggling.png";
    } else {
      villageBg.src = "Images/VillagersDesperate.png";
    }
  }

  spawnOrbs(); // Ensure orbs are spawned/updated
}

/**
 * Population Metrics & HUD Helpers
 */
window.showPopulationStatus = function () {
  const modal = document.getElementById("population-modal");
  if (!modal) return;

  renderPopulationModal();
  modal.classList.add("active");
};

window.closePopulationStatus = function () {
  const modal = document.getElementById("population-modal");
  if (modal) modal.classList.remove("active");
};

function renderPopulationModal() {
  const metricsContainer = document.getElementById("pop-metrics-container");
  const statusImg = document.getElementById("pop-status-img");
  const statusText = document.getElementById("pop-status-text");
  const thematicDesc = document.getElementById("pop-thematic-desc");

  if (!metricsContainer) return;

  const newPop = Math.floor(gameState.villagePopulation);
  const maxPop = gameState.maxPopulation || 100;
  const metrics = gameState.healthMetrics || { plague: 50, defense: 50, food: 50 };
  const popPercent = (newPop / maxPop) * 100;

  // Calculate Total Health based on metrics and population %
  const avgMetric = (metrics.plague + metrics.defense + metrics.food) / 3;
  const healthCorrelation = (popPercent + avgMetric) / 2;

  const getStatusText = (correlation) => {
    if (correlation >= 90) return "Celebratory";
    if (correlation >= 50) return "Prospering";
    if (correlation >= 20) return "Struggling";
    return "Desperate";
  };

  // Set Visuals and Status
  if (healthCorrelation >= 90) {
    statusImg.src = "Images/VillagersHappy.png";
    thematicDesc.textContent = "The kingdom is in high spirits. Music fills the air, and children play in the freshly paved streets of Euclid.";
  } else if (healthCorrelation >= 50) {
    statusImg.src = "Images/VillagersContent.png";
    thematicDesc.textContent = "Work continues at a steady pace. The village is well-fed, and its people look toward a bright future.";
  } else if (healthCorrelation >= 20) {
    statusImg.src = "Images/VillagersStruggling.png";
    thematicDesc.textContent = "Shadows grow long. Resources are thin, and the worry on the faces of the villagers reflects the heavy toll of restoration.";
  } else {
    statusImg.src = "Images/VillagersDesperate.png";
    thematicDesc.textContent = "Only the most resilient remain. The kingdom's heart beats faintly, waiting for a savior to restore what remains.";
  }

  statusText.textContent = getStatusText(healthCorrelation);

  const getMetricDesc = (val, type) => {
    if (type === 'plague') {
      if (val > 80) return "Robust health; ancient remedies abound.";
      if (val > 40) return "Seasonal sniffles, but manageable.";
      return "The Mist of Decay is gaining a foothold.";
    }
    if (type === 'defense') {
      if (val > 80) return "Unbreakable walls and alert sentries.";
      if (val > 40) return "Regular patrols, yet we feel vulnerable.";
      return "Critical gaps in our gates. We are exposed.";
    }
    if (type === 'food') {
      if (val > 80) return "Granaries overflow with bounty.";
      if (val > 40) return "Rations are sufficient for winter.";
      return "Hunger gnaws at the village's heart.";
    }
  };

  // Determine kingdom prosperity flow
  let growthVal = 0;
  if (avgMetric >= 100) growthVal = 6;
  else if (avgMetric >= 75) growthVal = 5;
  else if (avgMetric >= 50) growthVal = 4;
  else if (avgMetric >= 30) growthVal = 2;
  else growthVal = -2;

  const prosperityHTML = `
    <div style="margin-top: 1rem; padding-top: 1rem; border-top: 1px solid rgba(212,175,55,0.3);">
      <h4 style="color: var(--medieval-gold); font-size: 0.9rem; margin-bottom: 0.5rem; text-transform: uppercase;">Kingdom Prosperity</h4>
      <div style="display: flex; gap: 1rem; font-size: 0.85rem;">
        <div style="flex: 1; color: ${growthVal >= 0 ? 'var(--logic-cyan)' : '#ff4444'};">
          <strong>Settlers Arriving:</strong> ${growthVal > 0 ? '+' : ''}${growthVal} per cycle
        </div>
        <div style="flex: 1; color: #ffaa44;">
          <strong>Citizens Departing:</strong> -2 per cycle
        </div>
      </div>
      <p style="font-size: 0.75rem; color: #aaa; margin-top: 0.4rem; font-style: italic;">
        Citizens may leave due to sickness, hunger, or seeking new adventures. Watch the orbs in the hub!
      </p>
    </div>
  `;

  metricsContainer.innerHTML = `
    ${['plague', 'defense', 'food'].map(key => `
      <div class="metric-row">
        <div class="metric-label" style="display: flex; justify-content: space-between; font-size: 0.9rem; margin-bottom: 0.4rem; color: var(--medieval-gold);">
          <span style="text-transform: capitalize;">${key === 'plague' ? 'Plague Resistance' : key}</span>
          <span>${metrics[key]}%</span>
        </div>
        <div class="metric-bar-bg" style="height: 10px; background: rgba(255, 255, 255, 0.1); border-radius: 5px; overflow: hidden;">
          <div class="metric-bar-fill" style="width: ${metrics[key]}%; height: 100%; background: var(--logic-cyan); transition: width 0.5s ease-out;"></div>
        </div>
        <div class="metric-desc" style="font-size: 0.8rem; color: #ccc; font-style: italic; margin-top: 0.3rem;">${getMetricDesc(metrics[key], key)}</div>
      </div>
    `).join('')}
    ${prosperityHTML}
  `;
}

window.toggleMetricsPopover = function () {
  const popover = document.getElementById("metrics-popover");
  if (!popover) return;

  const isShowing = popover.classList.contains("show");
  if (!isShowing) {
    renderPopulationModal(); // Changed from renderMetrics to renderPopulationModal
    popover.classList.add("show");
  } else {
    popover.classList.remove("show");
  }
};

window.showTheorems = function () {
  const theorems = [
    { name: "SSS Congruence", desc: "If three sides of one triangle are congruent to three sides of another triangle, then the triangles are congruent." },
    { name: "SAS Congruence", desc: "If two sides and the included angle of one triangle are congruent to two sides and the included angle of another triangle, then the triangles are congruent." },
    { name: "ASA Congruence", desc: "If two angles and the included side of one triangle are congruent to two angles and the included side of another triangle, then the triangles are congruent." },
    { name: "AAS Congruence", desc: "If two angles and a non-included side of one triangle are congruent to the corresponding angles and side of another triangle, then the triangles are congruent." },
    { name: "HL Theorem", desc: "If the hypotenuse and a leg of one right triangle are congruent to the hypotenuse and a leg of another right triangle, then the triangles are congruent." },
    { name: "Reflexive Property", desc: "Any geometric figure is congruent to itself (e.g., AB ≅ AB)." },
    { name: "Vertical Angles", desc: "Vertical angles are always congruent." },
    { name: "CPCTC", desc: "Corresponding Parts of Congruent Triangles are Congruent." }
  ];

  const content = `
    <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
      ${theorems.map(t => `
        <div style="margin-bottom: 1.5rem; border-bottom: 1px solid rgba(212,175,55,0.2); padding-bottom: 0.8rem;">
          <h4 style="color: var(--medieval-gold); margin-bottom: 0.4rem;">${t.name}</h4>
          <p style="font-size: 0.9rem; color: #eee; line-height: 1.4;">${t.desc}</p>
        </div>
      `).join('')}
    </div>
  `;
  showNarrative("Scroll of Ancient Theorems", content);
};

window.showTutorial = function () {
  const steps = [
    { title: "Understand the Goal", text: "Look at the 'Prove' statement. This is your final objective. Every step must build toward this." },
    { title: "Mark the Diagram", text: "Click lines and angles to mark them based on current proofs. This helps visualize logic." },
    { title: "Use Your Givens", text: "Always start with the 'Given' information. They are the foundations of your proof." },
    { title: "Geometric Properties", text: "Is a side shared by two triangles? Use the Reflexive Property. Are lines intersecting? Look for Vertical Angles." },
    { title: "Definitions as Bridges", text: "If a given says a line 'bisects' an angle, your next step should likely use the 'Definition of Angle Bisector' to claim two angles are equal." }
  ];

  const content = `
    <div style="max-height: 400px; overflow-y: auto; padding-right: 10px;">
      ${steps.map((s, i) => `
        <div style="margin-bottom: 1.5rem; display: flex; gap: 1rem; align-items: flex-start;">
          <div style="background: var(--medieval-gold); color: black; border-radius: 50%; width: 24px; height: 24px; flex-shrink: 0; display: flex; align-items: center; justify-content: center; font-weight: bold;">${i + 1}</div>
          <div>
            <h4 style="color: var(--medieval-gold); margin-bottom: 0.3rem;">${s.title}</h4>
            <p style="font-size: 0.9rem; color: #eee; line-height: 1.4;">${s.text}</p>
          </div>
        </div>
      `).join('')}
    </div>
  `;
  showNarrative("Sage's Tutorial", content);
};

// --- Visor & Choice System ---

const VISOR_SCENARIOS = {
  1: { // Moat Bridge
    name: "Foundation Focus",
    speaker: "Royal Heir",
    text: "The Bridge is restored, but how should we maintain the approach?",
    options: [
      {
        text: "Enforce a Merchant Toll",
        callback: () => finishVisorMoment("Moat Bridge", "Toll", 50, 10, "The treasury grows, but the people grumble at the cost of entry.", { food: -5, defense: 10 })
      },
      {
        text: "Make it a Free Passage",
        callback: () => finishVisorMoment("Moat Bridge", "Free", 0, 30, "Travelers flock to the village, eager for a new beginning.", { food: 5, plague: -10 })
      }
    ]
  },
  2: { // Market Stalls
    name: "Trade Policy",
    speaker: "Royal Heir",
    text: "The Market Stalls are up. Should we invite foreign silk traders or local farmers first?",
    options: [
      {
        text: "Invite Foreign Traders",
        callback: () => finishVisorMoment("Market Stalls", "Trade", 75, 5, "Exotic goods arrive, filling our coffers but leaving some larders empty.", { food: -10, plague: -15 })
      },
      {
        text: "Subsidize Local Farmers",
        callback: () => finishVisorMoment("Market Stalls", "Farming", 0, 40, "The village is well-fed and growing fast. Contentment is high.", { food: 25, plague: 10 })
      }
    ]
  },
  3: { // Sentry Wall
    name: "Defensive Strategy",
    speaker: "Royal Heir",
    text: "The Sentry Wall stands tall. Where should our watchers focus?",
    options: [
      {
        text: "Fortify Against Siege",
        callback: () => finishVisorMoment("Sentry Wall", "Strength", 0, 5, "The wall is bristling with defenses. No army could breach this.", { defense: 40, food: -5 })
      },
      {
        text: "Open Watchtowers for Trade",
        callback: () => finishVisorMoment("Sentry Wall", "Wealth", 100, 15, "Security is lighter, but the view brings merchants from far and wide.", { defense: -15, plague: -5 })
      }
    ]
  },
  4: { // Blacksmith
    name: "Industrial Direction",
    speaker: "Royal Heir",
    text: "The Forge is hot. Should we prioritized plowshares or swords?",
    options: [
      {
        text: "Forge Swords",
        callback: () => finishVisorMoment("Blacksmith", "Swords", 0, 5, "Our soldiers are well-equipped. We are ready for any threat.", { defense: 30, food: -5 })
      },
      {
        text: "Forge Plowshares",
        callback: () => finishVisorMoment("Blacksmith", "Plows", 0, 50, "The land is tilled and the people are numerous. The village thrives.", { food: 30, defense: -10 })
      }
    ]
  },
  5: { // Docks
    name: "Maritime Expansion",
    speaker: "Royal Heir",
    text: "The Docks are ready. Should we build fishing boats or exploration galleys?",
    options: [
      {
        text: "Fishing Boats",
        callback: () => finishVisorMoment("Fishing Docks", "Food", 20, 35, "The sea provides a steady supply of food for our growing numbers.", { food: 35, plague: 5 })
      },
      {
        text: "Exploration Galleys",
        callback: () => finishVisorMoment("Fishing Docks", "Exotic", 150, 0, "Explorers find massive treasure, but the voyage is too long for families.", { food: -10, defense: 10 })
      }
    ]
  },
  6: { // Stables
    name: "Cavalry vs Caravan",
    speaker: "Royal Heir",
    text: "The Stables are grand. Should we train warhorses or pack mules?",
    options: [
      {
        text: "Warhorses",
        callback: () => finishVisorMoment("Stable Rafters", "Military", 0, 10, "Our knights are now the pride of Euclid. We are ready to strike back.", { defense: 35, plague: -5 })
      },
      {
        text: "Pack Mules",
        callback: () => finishVisorMoment("Stable Rafters", "Trade", 120, 10, "The roads are busy with merchants. Prosperity is within our grasp.", { food: 15, plague: -10 })
      }
    ]
  },
  7: { // Vault
    name: "Reserve Management",
    speaker: "Royal Heir",
    text: "The Vault is secure. Should we store grain for the winter or gold for the guards?",
    options: [
      {
        text: "Store Grain",
        callback: () => finishVisorMoment("Palace Vault", "Grain", 0, 20, "Our silos are full. No drought will break our spirit.", { food: 50, plague: 10 })
      },
      {
        text: "Store Gold",
        callback: () => finishVisorMoment("Palace Vault", "Gold", 300, 0, "The treasury overflows, allowing for grander future projects.", { defense: 20, food: -10 })
      }
    ]
  },
  8: { // Portcullis
    name: "Border Policy",
    speaker: "Royal Heir",
    text: "The Portcullis is strong. Should we keep it closed to outsiders or open it to refugees?",
    options: [
      {
        text: "Close the Gates",
        callback: () => finishVisorMoment("Grand Portcullis", "Isolation", 0, 0, "We are safe from the troubles of the world, but we grow alone.", { defense: 25, plague: 20, food: 10 })
      },
      {
        text: "Open to Refugees",
        callback: () => finishVisorMoment("Grand Portcullis", "Open", 0, 100, "Thousands seek safety within our walls. The village becomes a city!", { food: -40, plague: -30, defense: -20 })
      }
    ]
  },
  9: { // Bell Tower
    name: "Spiritual Guidance",
    speaker: "Royal Heir",
    text: "The Bell Tower rings out. Should the bells signal prayer or alert the militia?",
    options: [
      {
        text: "Signal Prayer",
        callback: () => finishVisorMoment("Bell Tower", "Faith", 0, 30, "A sense of peace settles over Euclid. The people walk with purpose.", { plague: 25, food: 5 })
      },
      {
        text: "Signal Militia",
        callback: () => finishVisorMoment("Bell Tower", "Alert", 0, 5, "Every villager knows their post. We will never be caught off guard.", { defense: 30, food: -5 })
      }
    ]
  },
  10: { // Vineyard
    name: "The Final Toast",
    speaker: "Royal Heir",
    text: "The Vineyard is lush. Is this wine for celebration or for medicinal export?",
    options: [
      {
        text: "Grand Celebration",
        callback: () => finishVisorMoment("Royal Vineyard", "Fest", 500, 50, "The finest vintage is shared with all. Long live the Kingdom!", { food: 20, plague: 10 })
      },
      {
        text: "Medicinal Export",
        callback: () => finishVisorMoment("Royal Vineyard", "Cure", 200, 20, "Our healers study the vine, creating salves that reach distant lands.", { plague: 40, food: 5 })
      }
    ]
  }
};

function triggerVisorMoment(levelId) {
  const scenario = VISOR_SCENARIOS[levelId];
  const level = levels.find(l => l.id === levelId);
  if (!scenario || !level) {
    closeVictoryModal();
    return;
  }

  // Check if already made choice for this level by NAME
  if (gameState.focusChoices[level.name]) {
    proceedLevelTransition();
    return;
  }

  // Find the character name for the speaker (all 4 characters)
  const charNameMap = {
    'male': 'The Prince',
    'female': 'The Princess',
    'sage': 'The Sage',
    'architectFemale': 'The Architect'
  };
  const charName = charNameMap[gameState.character] || 'Royal Heir';
  showNarrative(charName, scenario.text, scenario.options);
}

function finishVisorMoment(location, choice, spGain, popGain, resultText, metricChanges = null) {
  gameState.focusChoices[location] = choice;
  gameState.sovereignPoints += spGain;

  // Set Target Population instead of instant change
  gameState.targetPopulation = Math.max(0, Math.min(gameState.maxPopulation, gameState.targetPopulation + popGain));

  // Apply Metric Changes if any
  if (metricChanges) {
    Object.keys(metricChanges).forEach(key => {
      gameState.healthMetrics[key] = Math.max(0, Math.min(100, gameState.healthMetrics[key] + metricChanges[key]));
    });
  }

  saveGameState();
  renderKingdomHUD();

  // Trigger orbs to reflect the change
  if (popGain !== 0) {
    spawnOrbs(popGain, popGain > 0 ? 'citizen' : 'death');
  }

  showNarrative("Grand Vizier", resultText);

  // Override the close button for this specific narrative to close everything
  const closeBtn = document.getElementById("close-narrative-btn");
  closeBtn.onclick = () => {
    closeNarrative();
    // CRITICAL: Always proceed with level transition after the visor result
    proceedLevelTransition();

    // Re-bind to default for next time
    closeBtn.onclick = () => {
      closeNarrative();
      isDialogueActive = false;
    };
    isDialogueActive = false;
  };
}

/**
 * Orb Animation Logic
 */
function spawnOrbs(count, type) {
  if (type === 'death' && gameState.villagePopulation <= 0) return;

  const container = document.getElementById("orb-container");
  const mapHub = document.getElementById("map-hub");

  // Only spawn if kingdom map is visible
  if (!container || !mapHub || mapHub.style.display === 'none') return;
  container.style.display = "block";

  const rawCount = Math.abs(count);
  if (rawCount === 0) return;

  const emojiMap = {
    'citizen': '👨‍🌾',
    'death': '💀',
    'migrate': '🚶',
    'sick': '🤒',
    'hungry': '😫',
    'defense': '🛡️',
    'food': '🍎',
    'plague': '🦠',
    'sovereign': '💰',
    'adventurer': '🧭'
  };

  const orbTypeEmoji = emojiMap[type] || '✨';
  // 1:1 Mapping: Spawn exactly the number of orbs requested
  const absCount = Math.max(1, rawCount);

  for (let i = 0; i < absCount; i++) {
    setTimeout(() => {
      const orb = document.createElement("div");
      // Use premium golden-orb class
      orb.className = "orb golden-orb pulse";

      const icon = document.createElement("div");
      icon.className = "orb-icon";
      icon.textContent = orbTypeEmoji;
      orb.appendChild(icon);

      // Center is the village heart - use fixed coordinates relative to screen center
      const centerX = window.innerWidth / 2;
      const centerY = (window.innerHeight / 2) - 50; // Slightly above exact center for visual balance

      let startX, startY, endX, endY;

      // Logic: Citizens/Benefits fly IN. Death/Plague fly OUT.
      const isPositive = count > 0;

      if (isPositive) {
        // IN: Edges -> Center
        const isFull = gameState.villagePopulation >= gameState.maxPopulation;

        const side = Math.floor(Math.random() * 4);
        if (side === 0) { startX = -100; startY = Math.random() * window.innerHeight; }
        else if (side === 1) { startX = window.innerWidth + 100; startY = Math.random() * window.innerHeight; }
        else if (side === 2) { startX = Math.random() * window.innerWidth; startY = -100; }
        else { startX = Math.random() * window.innerWidth; startY = window.innerHeight + 100; }

        endX = centerX + (Math.random() * 200 - 100);
        endY = centerY + (Math.random() * 200 - 100);

        if (isFull && type === 'citizen') {
          orb.classList.add('animate-bounce');
        } else {
          orb.classList.add('animate-in');
        }
      } else {
        // OUT: Center -> Edges
        startX = centerX + (Math.random() * 120 - 60);
        startY = centerY + (Math.random() * 120 - 60);

        const side = Math.floor(Math.random() * 4);
        if (side === 0) { endX = -100; endY = Math.random() * window.innerHeight; }
        else if (side === 1) { endX = window.innerWidth + 100; endY = Math.random() * window.innerHeight; }
        else if (side === 2) { endX = Math.random() * window.innerWidth; endY = -100; }
        else { endX = Math.random() * window.innerWidth; endY = window.innerHeight + 100; }

        orb.classList.add('animate-out');
      }

      // Ensure orb is VISIBLY above background
      orb.style.zIndex = "100000";

      orb.style.setProperty('--startX', `${startX}px`);
      orb.style.setProperty('--startY', `${startY}px`);
      orb.style.setProperty('--endX', `${endX}px`);
      orb.style.setProperty('--endY', `${endY}px`);

      container.appendChild(orb);

      // When orb "arrives" or finishes (3s), update population and remove
      setTimeout(() => {
        const valueChange = count / absCount;
        const isFull = gameState.villagePopulation >= gameState.maxPopulation;

        // Don't increase population if it's already full and it's a positive citizen orb
        if (!(isFull && isPositive && type === 'citizen')) {
          gameState.villagePopulation = Math.max(0, Math.min(gameState.maxPopulation, gameState.villagePopulation + valueChange));
        }

        renderKingdomHUD();
        saveGameState();
        orb.remove();
      }, 3000);
    }, i * 350);
  }
}


/**
 * Game Heartbeat for Population Drift
 * Single interval (fixed - no longer nested)
 */
setInterval(() => {
  if (!gameState) return;

  const mapHub = document.getElementById("map-hub");
  // Only tick population when on the kingdom map
  if (!mapHub || mapHub.style.display === 'none') return;

  const metrics = gameState.healthMetrics || { plague: 50, defense: 50, food: 50 };
  const averageHealth = (metrics.plague + metrics.defense + metrics.food) / 3;

  // Growth based on health
  let growth = 0;
  if (averageHealth >= 100) growth = 6;
  else if (averageHealth >= 75) growth = 5;
  else if (averageHealth >= 50) growth = 4;
  else if (averageHealth >= 30) growth = 2;
  else growth = -2;

  // Only spawn orbs if there's a change and we're under/over capacity
  if (growth > 0 && gameState.villagePopulation < gameState.maxPopulation) {
    spawnOrbs(growth, 'citizen');
  } else if (growth < 0 && gameState.villagePopulation > 0) {
    spawnOrbs(growth, 'death');
  }

  // Natural attrition: Citizens leave for various reasons (2 seconds after growth)
  setTimeout(() => {
    if (!gameState || gameState.villagePopulation <= 0) return;
    const mapHub = document.getElementById("map-hub");
    if (!mapHub || mapHub.style.display === 'none') return;

    // Determine departure reason based on lowest health metric
    const metrics = gameState.healthMetrics || { plague: 50, defense: 50, food: 50 };
    let departureType = 'migrate';

    if (metrics.plague < metrics.food && metrics.plague < metrics.defense) {
      departureType = 'sick';
    } else if (metrics.food < metrics.plague && metrics.food < metrics.defense) {
      departureType = 'hungry';
    } else if (Math.random() > 0.6) {
      departureType = 'adventurer'; // Some just seek new horizons
    }

    spawnOrbs(-2, departureType);
  }, 2000);

}, 5000);

function updateEnemyOrbs() {
  const container = document.getElementById("orb-container");
  const mapHub = document.getElementById("map-hub");
  if (!container || !mapHub || mapHub.style.display === 'none') return;

  // Check for active invasion threat
  const hasActiveInvasion = gameState.incomingEvents?.some(e => e.type === 'threat' && e.countdown <= 1) ||
    gameState.activeEvents?.some(e => e.type === 'threat');
  const isThreatened = gameState.healthMetrics.defense < 30 || hasActiveInvasion;

  const existingEnemies = container.querySelectorAll(".enemy-orb");

  if (!isThreatened) {
    // Army retreats - animate out
    existingEnemies.forEach(e => {
      e.classList.add('retreating');
      setTimeout(() => e.remove(), 1500);
    });
    return;
  }

  // Already have enemy orbs
  if (existingEnemies.length >= 8) return;

  // Spawn enemy army in formation on both sides
  const formations = [
    // Left side formation
    { x: 40, y: window.innerHeight * 0.25 },
    { x: 60, y: window.innerHeight * 0.35 },
    { x: 40, y: window.innerHeight * 0.45 },
    { x: 60, y: window.innerHeight * 0.55 },
    // Right side formation
    { x: window.innerWidth - 60, y: window.innerHeight * 0.25 },
    { x: window.innerWidth - 80, y: window.innerHeight * 0.35 },
    { x: window.innerWidth - 60, y: window.innerHeight * 0.45 },
    { x: window.innerWidth - 80, y: window.innerHeight * 0.55 }
  ];

  formations.forEach((pos, i) => {
    setTimeout(() => {
      const orb = document.createElement("div");
      orb.className = "orb enemy-orb";
      orb.innerHTML = '<div class="orb-icon">😠</div>';
      orb.style.cssText = `
        position: fixed;
        left: ${pos.x}px;
        top: ${pos.y}px;
        width: 45px;
        height: 45px;
        border-radius: 50%;
        background: radial-gradient(circle at 30% 30%, #ff6666, #cc0000 60%, #660000);
        border: 2px solid #ff0000;
        box-shadow: 0 0 20px rgba(255, 0, 0, 0.6), 0 0 40px rgba(255, 0, 0, 0.3);
        display: flex;
        justify-content: center;
        align-items: center;
        z-index: 99999;
        animation: enemyPulse 1.5s infinite ease-in-out, enemyAppear 0.5s ease-out;
        font-size: 1.2rem;
      `;
      container.appendChild(orb);
    }, i * 150);
  });
}

function triggerCatastrophicEvent(type) {
  const modal = document.getElementById("catastrophic-modal");
  const img = document.getElementById("cat-event-img");
  const titleElem = document.getElementById("cat-event-title");
  const descElem = document.getElementById("cat-event-desc");
  const impactElem = document.getElementById("cat-event-impact");

  if (!modal) return;

  img.src = gameAssets.images.scenarios[type] || "";

  let title = "";
  let description = "";
  let popLoss = 0;

  if (type === 'invasion') {
    title = "THE CRIMSON LEGION APPROACHES!";
    const hasWallStrength = gameState.focusChoices['Sentry Wall'] === 'Strength';
    const hasWarhorses = gameState.focusChoices['Stable Rafters'] === 'Military';

    if (hasWallStrength && hasWarhorses) {
      description = "The Crimson Legion is pulverized! Your fortified walls hold firm while your knights strike from the flank.";
      popLoss = 0;
    } else if (hasWallStrength) {
      description = "The army breaks against your fortified walls. The kingdom is safe, though the outskirts are singed.";
      popLoss = 5;
    } else {
      description = "Without reinforced defenses, the Legion breaches the village. A dark day for Euclid.";
      popLoss = 60;
    }
  } else if (type === 'famine') {
    title = "THE GREAT DROUGHT";
    const hasGrain = gameState.focusChoices['Palace Vault'] === 'Grain';
    const hasLocalFarms = gameState.focusChoices['Market Stalls'] === 'Farming';

    if (hasGrain || hasLocalFarms) {
      description = "The fields turn to dust, but your reserves keep the people fed. Euclid endures.";
      popLoss = 10;
    } else {
      description = "Starvation haunts the streets. Without reserves, the population withers.";
      popLoss = 50;
    }
  } else if (type === 'storm') {
    title = "THE GULF TEMPEST";
    const hasBoats = gameState.focusChoices['Fishing Docks'] === 'Food';
    const hasBridgeFree = gameState.focusChoices['Moat Bridge'] === 'Free';

    if (hasBoats && hasBridgeFree) {
      description = "The storm rages, but your sturdy fleet and clear paths minimize the devastation.";
      popLoss = 15;
    } else {
      description = "Massive waves tear through the docks and flood the lowlands. Much is lost.";
      popLoss = 45;
    }
  } else if (type === 'plague') {
    title = "THE MIST OF DECAY";
    const hasRefugees = gameState.focusChoices['Grand Portcullis'] === 'Open';
    const hasMedicines = gameState.focusChoices['Royal Vineyard'] === 'Cure';

    if (hasMedicines) {
      description = "The Mist arrives, but your medicinal wine provides the cure. The plague is short-lived.";
      popLoss = 5;
    } else if (hasRefugees) {
      description = "Overcrowding turns the Mist into a catastrophe. The sickness spreads like wildfire.";
      popLoss = 60;
    } else {
      description = "The sickness takes many, but isolation prevents a total collapse.";
      popLoss = 25;
    }
  } else if (type === 'sandstorm') {
    // Rhombic Sands Event
    title = "THE DESERT'S WRATH";
    const hasOasis = gameState.focusChoices['Rhind Papyrus Scriptum'] === 'Finest Lotus';

    if (hasOasis) {
      description = "The sandstorm rages for three days, but your lotus gardens provided shelter. The pyramids stand defiant.";
      popLoss = 10;
    } else {
      description = "Walls of sand bury the outer settlements. Many workers are lost beneath the dunes.";
      popLoss = 35;
    }
  } else if (type === 'locusts') {
    // Rhombic Sands Event
    title = "THE PLAGUE OF LOCUSTS";
    const hasGrain = gameState.focusChoices['Pyramid Capstone'] === 'Gilded Limestone';

    if (hasGrain) {
      description = "The locusts swarm, but your efficient construction saved grain for the people. The Nile provides.";
      popLoss = 15;
    } else {
      description = "A black cloud of locusts devours every crop along the Nile. Famine grips the land.";
      popLoss = 45;
    }
  } else if (type === 'celtic_raid') {
    // Gaelic Grids Event
    title = "THE RAIDERS FROM THE NORTH";
    const hasDefense = gameState.defenseScore >= 70;

    if (hasDefense || gameState.hasMightyHero) {
      description = "The Celtic raiders charge, but your hero and stone walls repel them. The druids chant victory!";
      popLoss = 5;
    } else {
      description = "The painted warriors breach the outer rings. Sacred groves are burned, villages pillaged.";
      popLoss = 40;
    }
  } else if (type === 'druid_curse') {
    // Gaelic Grids Event
    title = "THE DRUID'S CURSE";
    const hasFaith = gameState.villagePopulation >= 80;

    if (hasFaith) {
      description = "Dark magic swirls through the standing stones, but your people's faith breaks the curse.";
      popLoss = 10;
    } else {
      description = "Arcane runes glow with malevolent power. Children sicken and crops wither under the hex.";
      popLoss = 35;
    }
  }


  // Update target population for drift and UI
  gameState.targetPopulation = Math.max(0, gameState.targetPopulation - popLoss);

  titleElem.textContent = title;
  descElem.textContent = description;
  impactElem.textContent = popLoss === 0 ? "No Casualties" : `-${popLoss} Population`;

  modal.classList.add("active");
  saveGameState();
}

window.closeCatastrophicEvent = function () {
  const modal = document.getElementById("catastrophic-modal");
  if (modal) modal.classList.remove("active");

  // Just update the HUD and return to map - DO NOT call proceedLevelTransition here!
  // The level transition already happened before the event popup was shown.
  // Calling proceedLevelTransition again was causing levels to skip.
  renderKingdomHUD();
  renderMap();
}


window.buyUpgrade = function (levelId) {
  if (levelId === 'hero') {
    if (gameState.hasMightyHero) {
      showNotification("The Mighty Hero is already patrolling your borders!", "Hero Status");
      return;
    }
    // Hero joins when kingdom is thriving (100+ population)
    if (gameState.villagePopulation >= 100) {
      gameState.hasMightyHero = true;
      saveGameState();
      renderKingdomHUD();
      renderMap();

      // Show specialized hero join narrative
      const content = `
        <div style="text-align: center;">
          <img src="Images/MightyHero.png" style="width: 100%; max-height: 300px; object-fit: cover; border: 3px solid var(--medieval-gold); border-radius: 8px; margin-bottom: 1rem;">
          <p>Your prosperous kingdom has attracted a legendary champion! The Mighty Hero now patrols our borders, bolstering defenses by 5% against all threats.</p>
        </div>
      `;
      showNarrative("Mighty Hero", content);
    } else {
      showNotification(`Your kingdom needs ${100 - Math.floor(gameState.villagePopulation)} more citizens to attract a hero! Current: ${Math.floor(gameState.villagePopulation)}/100`, "Hero Requirement");
    }
    return;
  }

  // Level upgrades still use sovereign points if they exist
  if (gameState.sovereignPoints >= 100) {
    gameState.sovereignPoints -= 100;
    if (!gameState.upgrades) gameState.upgrades = {};
    gameState.upgrades[levelId] = (gameState.upgrades[levelId] || 0) + 1;
    saveGameState();
    renderMap();
    showNotification("Infrastructure Upgraded! The Kingdom thrives.", "Upgrade Complete");
  } else {
    showNotification("Not enough Sovereign Points! Prove more theorems to earn them.", "Insufficient Points");
  }
};

function showVictoryModal(level) {
  const modal = document.getElementById("victory-modal");
  const beforeImg = document.getElementById("victory-before-img");
  const afterImg = document.getElementById("victory-after-img");
  const hammer = document.getElementById("architect-hammer");
  const congratsLabel = document.getElementById("congrats-label");
  const huzzahTitle = document.querySelector(".huzzah-title");
  const story = document.getElementById("victory-story");
  const victoryBtns = document.getElementById("victory-buttons");
  const content = modal.querySelector(".victory-modal-content");

  // Prefer level's own before/after, fall back to gameAssets lookup for Isocele
  const asset = gameAssets.images.levels.find(l => l.id == level.id);
  const beforeSrc = level.before || (asset ? asset.before : gameAssets.images.ruinedVillage);
  const afterSrc = level.after || (asset ? asset.after : gameAssets.images.restoredVillage);

  // Initial State: Reset visibility
  if (beforeImg) {
    beforeImg.src = beforeSrc;
    beforeImg.style.opacity = "1";
  }
  if (afterImg) {
    afterImg.src = afterSrc;
    afterImg.style.opacity = "0";
  }

  if (congratsLabel) congratsLabel.style.display = "none";
  if (huzzahTitle) huzzahTitle.style.display = "none";
  if (story) {
    story.textContent = level.narrative.victory;
    story.style.display = "none";
  }
  if (victoryBtns) victoryBtns.style.display = "none";
  if (hammer) hammer.style.opacity = "0";

  if (modal) modal.classList.add("active");

  // Cinematic Sequence
  let hits = 0;
  const totalHits = 3;

  const hitSequence = setInterval(() => {
    hits++;

    // 1. Swing Hammer
    if (hammer) {
      hammer.classList.remove("swinging");
      void hammer.offsetWidth; // Trigger reflow
      hammer.classList.add("swinging");
    }

    // 2. Shake Frame on Impact
    setTimeout(() => {
      if (content) {
        content.classList.remove("shake");
        void content.offsetWidth;
        content.classList.add("shake");
      }
    }, 200);

    // 3. Final Hit
    if (hits === totalHits) {
      clearInterval(hitSequence);
      setTimeout(() => {
        // Reveal After Image
        if (afterImg) afterImg.style.opacity = "1";
        if (beforeImg) beforeImg.style.opacity = "0";

        // Show Celebration
        if (huzzahTitle) huzzahTitle.style.display = "block";
        if (congratsLabel) congratsLabel.style.display = "block";
        if (story) story.style.display = "block";
        if (victoryBtns) victoryBtns.style.display = "grid"; // Show buttons container

        AudioManager.playSFX('victory'); // Huzzah!
        burstConfetti();
      }, 300);
    }
  }, 800);
}

function burstConfetti() {
  const container = document.getElementById("confetti-container");
  if (!container) return;
  container.innerHTML = "";

  const colors = ["#d4af37", "#f9f1d0", "#fff", "#00ffff", "#39ff14"];
  const count = 50;

  for (let i = 0; i < count; i++) {
    const piece = document.createElement("div");
    piece.className = "confetti-piece animate";
    piece.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
    piece.style.setProperty("--x", `${Math.random() * 100 - 50}px`);
    piece.style.setProperty("--x2", `${Math.random() * 400 - 200}px`);
    piece.style.left = `${Math.random() * 100}%`;
    piece.style.animationDelay = `${Math.random() * 0.5}s`;
    container.appendChild(piece);
  }
}

function showEpicVictory() {
  // Hide game area first
  const gameArea = document.getElementById("game-area");
  if (gameArea) gameArea.style.display = "none";

  const modal = document.getElementById("epic-victory-modal");
  const img = document.getElementById("epic-victory-img");
  const xpEl = document.getElementById("epic-total-xp");
  const levelsEl = document.getElementById("epic-total-levels");
  const popEl = document.getElementById("epic-total-pop");


  if (img && gameAssets.images.epicVictory) {
    img.src = gameAssets.images.epicVictory;
  }

  // Populate stats
  if (xpEl) xpEl.textContent = gameState.totalXP;
  if (levelsEl) levelsEl.textContent = levels.length;
  if (popEl) popEl.textContent = gameState.villagePopulation;

  // Play victory music
  AudioManager.playMusic('victory', false);

  // Show confetti
  const confettiContainer = document.getElementById("epic-confetti-container");
  if (confettiContainer) {
    confettiContainer.innerHTML = "";
    createConfetti(confettiContainer);
  }

  // Show modal
  if (modal) modal.classList.add("active");
}

window.closeEpicVictory = function () {
  const modal = document.getElementById("epic-victory-modal");
  if (modal) modal.classList.remove("active");
  AudioManager.playMusic('hub');
  renderDashboard();
};

function handleGraduation() {
  const villageBg = document.getElementById("village-bg");
  villageBg.src = gameAssets.images.restoredVillage;

  setTimeout(() => {
    const text = `
            Grand Vizier: "Your Highness... look upon Isocele. It is no longer a ruin of the past, but a monument to the future."
            <br><br>
            Chancellor: "By the Laws of SSS and the power of the Reflexive Property, you have bound this kingdom together. The Chaos Rot has been banished."
            <br><br>
            <div style="font-family: 'Orbitron'; color: var(--medieval-gold); text-align: center; border-top: 1px solid gold; padding-top: 1rem;">
                THE CORONATION OF LOGIC
                <br>
                <small>You have graduated from Architect to Sovereign. The Kingdom of Euclid stands firm, balanced by Reason and proven by Truth.</small>
            </div>
        `;
    showNarrative("The High Council", text);

    // Final UI Cleanup
    gameState.graduated = true;
    saveGameState();
  }, 1000);
}

function renderAnswerBank(bank) {
  const bankEl = document.getElementById("bank-items");
  if (!bankEl) return;
  bankEl.innerHTML = "";

  const allItems = [
    ...bank.statements.map((s) => ({ text: s, type: "statement" })),
    ...bank.reasons.map((r) => ({ text: r, type: "reason" })),
  ];

  allItems.sort(() => Math.random() - 0.5);

  bankEl.innerHTML = `
    <div class="bank-scroll-container">
      <div class="bank-title-medieval">Scroll of Truths</div>
      <div class="bank-list">
        ${allItems.map(item => `
          <div class="bank-item-static">
            <span class="bank-item-type">[${item.type.toUpperCase()}]</span>
            <span class="bank-item-text">${item.text}</span>
          </div>
        `).join('')}
      </div>
    </div>
  `;
}

let draggedItem = null;

// Global scope expose
window.initGame = initGame;

document.addEventListener("DOMContentLoaded", initGame);

window.closePremiumModal = function () {
  const modal = document.getElementById("premium-modal");
  if (modal) modal.classList.remove("active");
  const errorEl = document.getElementById("premium-error");
  if (errorEl) errorEl.style.display = "none";
  const inputEl = document.getElementById("premium-password");
  if (inputEl) inputEl.value = "";
  AudioManager.playSFX('interact');
};

window.verifyPremiumPassword = function () {
  const inputEl = document.getElementById("premium-password");
  const errorEl = document.getElementById("premium-error");
  
  if (inputEl && inputEl.value === "MathI5Fun") {
    gameState.gamePurchased = true;
    saveGameState();
    
    // Success feedback
    AudioManager.playSFX('correct');
    showNotification("The path is open! Thank you for purchasing The Chronicles of Euclid.", "Full Game Unlocked");
    
    closePremiumModal();
    renderMap();
  } else {
    if (errorEl) errorEl.style.display = "block";
    AudioManager.playSFX('interact');
  }
};

window.closeVictoryModal = function () {
  const modal = document.getElementById("victory-modal");
  if (modal) modal.classList.remove("active");

  const completedLevelId = gameState.activeLevel ? gameState.activeLevel.id : (gameState.currentLevel + 1);

  // Check for Visor Moment (CYOA) before proceeding to map/event
  if (VISOR_SCENARIOS[completedLevelId]) {
    const level = levels.find(l => l.id === completedLevelId);
    if (level && !gameState.focusChoices[level.name]) {
      triggerVisorMoment(completedLevelId);
      return;
    }
  }

  proceedLevelTransition();
};

function proceedLevelTransition() {
  // Guard against multiple calls while transition is in progress
  if (gameState.transitionInProgress) {
    console.warn("proceedLevelTransition: Blocked duplicate call - transition already in progress");
    return;
  }
  gameState.transitionInProgress = true;

  const currentLevelId = gameState.currentLevel + 1;
  const completedLevel = levels.find(l => l.id === currentLevelId);

  console.log("proceedLevelTransition: Processing level", currentLevelId, "currentLevel was:", gameState.currentLevel);

  // 1. Advance Time based on Repair Time
  if (completedLevel && completedLevel.repairTime) {
    advanceTime(completedLevel.repairTime);
  }

  // 2. Increase Max Population for restoration
  gameState.maxPopulation = 100 + (gameState.currentLevel * 50);


  // 3. Region Unlock Logic - Grand Celebration!
  // Use currentLevelId (the level just completed) not gameState.currentLevel (which is 0-indexed and not yet incremented)
  if (currentLevelId === 10 && !gameState.unlockedRegions.includes("The Rhombic Sands")) {
    gameState.unlockedRegions.push("The Rhombic Sands");
    // CRITICAL: Unlock the first level of the new region so player can access it
    if (!gameState.unlockedLevels.includes(11)) {
      gameState.unlockedLevels.push(11);
    }
    saveGameState();
    const celebrationContent = `
      <div style="text-align: center;">
        <h2 style="color: var(--medieval-gold); font-size: 1.8rem; margin-bottom: 1rem;">THE RHOMBIC SANDS AWAIT!</h2>
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">By the power of Logic and Geometry, you have restored the Kingdom of Isocele!</p>
        <p style="color: var(--logic-cyan);">A new land has been revealed beyond the eastern mountains...</p>
        <p style="margin-top: 1rem; font-style: italic;">The ancient pyramids of Egypt call to you, Royal Heir. New theorems and challenges await in the sun-scorched sands!</p>
      </div>
    `;
    setTimeout(() => showNarrative("REGION UNLOCKED", celebrationContent), 500);
  } else if (currentLevelId === 15 && !gameState.unlockedRegions.includes("The Gaelic Grids")) {
    gameState.unlockedRegions.push("The Gaelic Grids");
    // CRITICAL: Unlock the first level of the new region so player can access it
    if (!gameState.unlockedLevels.includes(16)) {
      gameState.unlockedLevels.push(16);
    }
    saveGameState();
    const celebrationContent = `
      <div style="text-align: center;">
        <h2 style="color: var(--medieval-gold); font-size: 1.8rem; margin-bottom: 1rem;">THE GAELIC GRIDS BECKON!</h2>
        <p style="font-size: 1.1rem; margin-bottom: 1rem;">The wisdom of the Rhombic Sands has been restored!</p>
        <p style="color: var(--logic-cyan);">Beyond the western seas, the Celtic lands of ancient Ireland await...</p>
        <p style="margin-top: 1rem; font-style: italic;">Stone circles and mystical proofs call to you. Prepare for the final challenges!</p>
      </div>
    `;
    setTimeout(() => showNarrative("REGION UNLOCKED", celebrationContent), 500);
  }

  // 4. Check for Catastrophic Event Milestones (themed per region)
  // WARNINGS appear after completing level X, EVENT POPUP appears after completing level X+1

  // These levels trigger a WARNING popup (upcoming event)
  const eventWarnings = {
    // Isocele (Medieval) - warning appears after these levels
    1: 'storm',      // Warning after level 1, event happens after level 2
    4: 'invasion',   // Warning after level 4, event happens after level 5
    7: 'famine',     // Warning after level 7, event happens after level 8
    9: 'plague',     // Warning after level 9, event happens after level 10
    // Rhombic Sands (Egyptian)
    11: 'sandstorm', // Warning after level 11, event happens after level 12
    13: 'locusts',   // Warning after level 13, event happens after level 14
    // Gaelic Grids (Celtic)
    16: 'celtic_raid',  // Warning after level 16, event happens after level 17
    18: 'druid_curse'   // Warning after level 18, event happens after level 19
  };

  // These levels trigger the actual EVENT popup (warning was shown on previous level)
  const eventTriggers = {
    2: 'storm',
    5: 'invasion',
    8: 'famine',
    10: 'plague',
    12: 'sandstorm',
    14: 'locusts',
    17: 'celtic_raid',
    19: 'druid_curse'
  };

  // Show WARNING notification (one level early)
  if (eventWarnings[currentLevelId]) {
    const eventType = eventWarnings[currentLevelId];
    const catEvent = {
      id: `catastrophe_${eventType}`,
      name: eventType.charAt(0).toUpperCase() + eventType.slice(1) + " Approaching",
      type: 'threat',
      level: 3,
      countdown: 1,
      duration: 4,
      flavor: `Scouts report an incoming ${eventType}! Complete the next structure to face it.`
    };
    gameState.incomingEvents.push(catEvent);
    showNotification(`URGENT: Scouts report a ${eventType} approaching! Prepare before the next restoration.`, "Scout Report");
  }

  // Show actual EVENT popup (after warning level)
  if (eventTriggers[currentLevelId] && !gameState.eventsTriggered.includes(eventTriggers[currentLevelId])) {
    const eventType = eventTriggers[currentLevelId];
    gameState.eventsTriggered.push(eventType);
    setTimeout(() => triggerCatastrophicEvent(eventType), 1500);
  }


  // 5. Finish level transition - check if we just completed the LAST level
  console.log("proceedLevelTransition: currentLevelId =", currentLevelId, "levels.length =", levels.length);
  if (currentLevelId >= levels.length) {
    // All levels in all regions completed - show epic victory!
    console.log("proceedLevelTransition: Final level completed! Showing epic victory.");
    showEpicVictory();
    gameState.graduated = true;
    gameState.transitionInProgress = false;
    saveGameState();
    return;
  }



  // Unlock the next level
  const nextLevelId = gameState.currentLevel + 2;
  const nextLevel = levels.find(l => l.id === nextLevelId);
  if (nextLevel && !gameState.unlockedLevels.includes(nextLevel.id)) {
    gameState.unlockedLevels.push(nextLevel.id);
  }

  gameState.currentLevel++;
  console.log("proceedLevelTransition: Level incremented to", gameState.currentLevel);
  gameState.transitionInProgress = false; // Reset guard flag
  saveGameState();

  renderMap();
}


// --- UI Toggles ---
window.toggleAchievements = function () {
  const panel = document.getElementById("achievements-panel");
  const btn = document.getElementById("achievements-toggle");
  if (panel) {
    const isShowing = panel.classList.contains("show");

    // Close other possible dropdowns if they existed
    panel.classList.toggle("show");
    btn.classList.toggle("active");
  }
};

// Close dropdown when clicking outside
document.addEventListener("click", (e) => {
  const dropdown = document.getElementById("achievements-dropdown");
  const panel = document.getElementById("achievements-panel");
  const btn = document.getElementById("achievements-toggle");
  if (dropdown && !dropdown.contains(e.target)) {
    if (panel) panel.classList.remove("show");
    if (btn) btn.classList.remove("active");
  }
});

// Intercept dashboard/map transitions to handle floating home button & HUD updates
// Consolidation: We only need ONE global renderMap override for external logic
const originalRenderMapInternal = renderMap;
renderMap = function () {
  if (typeof originalRenderMapInternal === 'function') {
    originalRenderMapInternal();
  }

  // 1. Manage Navigation Buttons
  const homeBtn = document.getElementById("nav-btn-home");
  if (homeBtn) homeBtn.style.display = "none";

  // 2. Inject repair times and update boards
  const nodes = document.querySelectorAll(".map-node");
  levels.forEach((level, idx) => {
    const node = nodes[idx];
    if (node && !(gameState.currentLevel > idx)) {
      const timeLabel = document.createElement("div");
      timeLabel.className = "node-repair-time";
      timeLabel.innerHTML = `<i class="bi bi-clock-history"></i> ${level.repairTime}`;
      node.appendChild(timeLabel);
    }
  });

  renderEventBoard();
  renderKingdomHUD();
};

// Intercept quest start to show home button (handled by startLevel in this case)
const originalStartQuest = window.startQuest; // Assuming startQuest triggers the level
if (typeof window.startQuest === 'undefined') {
  // If startQuest isn't global, we'll need to find where it is or how it's called
}
// --- Event & Time System ---

const EVENT_LIBRARY = {
  threats: [
    { id: 'famine_l1', name: "Local Famine", level: 1, type: 'threat', flavor: "Crops wither in the fields." },
    { id: 'marauders_l2', name: "Forest Marauders", level: 2, type: 'threat', flavor: "Bandits harass our borders." },
    { id: 'plague_l3', name: "Mist Fever", level: 3, type: 'threat', flavor: "A sickly green fog settles." },
    { id: 'invasion_l4', name: "Crimson Legion", level: 4, type: 'threat', flavor: "The enemy army approaches." },
    { id: 'chaos_l5', name: "Reality Rift", level: 5, type: 'threat', flavor: "Logic itself starts to warp." }
  ],
  prosperity: [
    { id: 'trade_fair', name: "Grand Trade Fair", type: 'prosperity', flavor: "Merchants bring exotic goods." },
    { id: 'harvest', name: "Bountiful Harvest", type: 'prosperity', flavor: "The silos are overflowing." },
    { id: 'pilgrimage', name: "Holy Pilgrimage", type: 'prosperity', flavor: "Seekers of truth visit." }
  ]
};

function parseTimeToDays(str) {
  if (!str) return 0;
  const num = parseInt(str);
  if (str.includes("Day")) return num;
  if (str.includes("Week")) return num * 7;
  if (str.includes("Month")) return num * 30; // Approximation
  return 0;
}

window.advanceTime = function (daysStr) {
  const days = parseTimeToDays(daysStr);
  gameState.gameTime += days;

  // Update Incoming Events
  gameState.incomingEvents.forEach(ev => {
    ev.countdown -= days;
    if (ev.countdown <= 0) {
      ev.countdown = 0;
      gameState.activeEvents.push(ev);
    }
  });

  // Remove events that have moved to active
  gameState.incomingEvents = gameState.incomingEvents.filter(ev => ev.countdown > 0);

  // Process Active Events & Impacts
  processEventImpacts();

  // Potentially schedule new events if none are incoming
  if (gameState.incomingEvents.length === 0) {
    scheduleRandomEvent();
  }

  saveGameState();
  renderEventBoard();
  renderKingdomHUD();
};

function scheduleRandomEvent() {
  const isThreat = Math.random() < 0.6;
  const pool = isThreat ? EVENT_LIBRARY.threats : EVENT_LIBRARY.prosperity;
  const base = pool[Math.floor(Math.random() * pool.length)];

  const event = {
    ...base,
    countdown: 5 + Math.floor(Math.random() * 15), // 5-20 days
    duration: 3 + Math.floor(Math.random() * 5)    // 3-8 days
  };

  gameState.incomingEvents.push(event);
}

function processEventImpacts() {
  const defense = updateDefenseScore();

  gameState.activeEvents.forEach(ev => {
    if (ev.type === 'threat') {
      const penetrationThreshold = ev.level * 20;
      if (defense < penetrationThreshold) {
        // Threat penetrates!
        const popLoss = ev.level * 10;
        gameState.targetPopulation = Math.max(0, gameState.targetPopulation - popLoss);
        spawnOrbs(-5, 'death');
        console.log(`Threat ${ev.name} penetrated defense (${defense}% < ${penetrationThreshold}%)!`);
      }

      // Threats can destroy prosperity
      if (Math.random() < 0.3) {
        gameState.activeEvents = gameState.activeEvents.filter(e => e.type !== 'prosperity');
      }
    } else {
      // Prosperity buffs
      gameState.sovereignPoints += 2;
      gameState.targetPopulation = Math.min(gameState.maxPopulation, gameState.targetPopulation + 2);
    }

    ev.duration -= 1; // Simplification: events last a bit
  });

  gameState.activeEvents = gameState.activeEvents.filter(ev => ev.duration > 0);
}

function updateDefenseScore() {
  let score = gameState.healthMetrics.defense;
  if (gameState.hasMightyHero) score += 5;

  // Cap at 100
  gameState.defenseScore = Math.min(100, score);
  return gameState.defenseScore;
}

function renderEventBoard() {
  const activeList = document.getElementById("active-events-list");
  const incomingList = document.getElementById("incoming-events-list");
  if (!activeList || !incomingList) return;

  activeList.innerHTML = gameState.activeEvents.length ? "" : "<div class='event-empty'>Peaceful days.</div>";
  incomingList.innerHTML = gameState.incomingEvents.length ? "" : "<div class='event-empty'>No rumors.</div>";

  gameState.activeEvents.forEach(ev => {
    const div = document.createElement("div");
    div.className = `event-item ${ev.type}`;
    div.innerHTML = `
      <strong>${ev.name}</strong>
      ${ev.level ? `<span class='event-strength'>Strength: ${ev.level}</span>` : ''}
    `;
    activeList.appendChild(div);
  });

  gameState.incomingEvents.forEach(ev => {
    const div = document.createElement("div");
    div.className = `event-item ${ev.type}`;
    div.innerHTML = `
      <strong>${ev.name}</strong>
      <span class='event-countdown'>Arriving in ${ev.countdown} days</span>
    `;
    incomingList.appendChild(div);
  });
}


// Helper to format gameTime into Month/Day
function formatKingdomAge(totalDays) {
  const months = Math.floor(totalDays / 30);
  const days = totalDays % 30;
  if (months > 0) return `Month ${months + 1}, Day ${days}`;
  return `Day ${days + 1}`;
}

const originalRenderKingdomHUD = renderKingdomHUD;
renderKingdomHUD = function () {
  originalRenderKingdomHUD();

  const defEl = document.getElementById("def-count");
  const defFill = document.getElementById("def-bar-fill");
  const defScore = updateDefenseScore();

  if (defEl) defEl.textContent = defScore;
  if (defFill) defFill.style.width = `${defScore}%`;

  // Update population text if target moved
  const popCount = document.getElementById("pop-count");
  if (popCount) popCount.textContent = Math.floor(gameState.villagePopulation);

  // Update Kingdom Age
  const timeVal = document.getElementById("game-time-val");
  if (timeVal) {
    timeVal.textContent = formatKingdomAge(gameState.gameTime || 0);
  }
};

// Hook into victory to advance time
const originalHandleVictory = handleVictory;
handleVictory = function () {
  const level = gameState.activeLevel;
  if (level && level.repairTime) {
    advanceTime(level.repairTime);
  }
  originalHandleVictory();
};
