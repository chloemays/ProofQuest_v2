import re
import json
import os

# Per-level CCSS mapping. Determined by analysis of each proof's content:
#   CO.C.9  - theorems about lines and angles
#   CO.C.10 - theorems about triangles
#   CO.C.11 - theorems about parallelograms
#   SRT.B.4 - theorems about similarity
#   SRT.B.5 - use congruence/similarity criteria for triangles
LEVEL_STANDARDS = {
    1:  ["HSG.CO.C.10", "HSG.SRT.B.5"],
    2:  ["HSG.CO.C.10", "HSG.SRT.B.5"],
    3:  ["HSG.CO.C.10", "HSG.SRT.B.5"],
    4:  ["HSG.CO.C.9", "HSG.CO.C.10", "HSG.SRT.B.5"],
    5:  ["HSG.CO.C.10", "HSG.SRT.B.5"],
    6:  ["HSG.CO.C.10", "HSG.SRT.B.5"],
    7:  ["HSG.CO.C.10", "HSG.SRT.B.5"],
    8:  ["HSG.CO.C.10", "HSG.SRT.B.5"],
    9:  ["HSG.CO.C.10"],
    10: ["HSG.CO.C.9"],
    11: ["HSG.CO.C.10", "HSG.CO.C.11", "HSG.SRT.B.5"],
    12: ["HSG.CO.C.10", "HSG.SRT.B.5"],
    13: ["HSG.CO.C.9"],
    14: ["HSG.CO.C.10", "HSG.CO.C.11", "HSG.SRT.B.5"],
    15: ["HSG.CO.C.10", "HSG.CO.C.11", "HSG.SRT.B.5"],
    16: ["HSG.CO.C.9", "HSG.CO.C.10", "HSG.SRT.B.5"],
    17: ["HSG.CO.C.10", "HSG.SRT.B.5"],
    18: ["HSG.CO.C.10"],
    19: ["HSG.SRT.B.4", "HSG.SRT.B.5"],
    20: ["HSG.CO.C.10", "HSG.SRT.B.5"],
}


REGION_SYMBOLS = {
    'Isocele': '&#9884;',
    'The Rhombic Sands': '&#9671;',
    'The Gaelic Grids': '&#10048;',
}
DEFAULT_REGION_SYMBOL = '&#10070;'


def region_slug(region):
    if not region:
        return 'unknown'
    s = region.lower().replace('the ', '').strip()
    return re.sub(r'[^a-z0-9]+', '-', s).strip('-')


def extract_levels_from_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    match = re.search(r'const levels = \[(.*?)\];\s*(?:let|const|var) ', content, re.DOTALL)
    if not match:
        print("Could not find levels array in game.js")
        return []

    array_content = match.group(1)

    level_strings = []
    depth = 0
    current_start = None
    for i, ch in enumerate(array_content):
        if ch == '{':
            if depth == 0:
                current_start = i
            depth += 1
        elif ch == '}':
            depth -= 1
            if depth == 0 and current_start is not None:
                level_strings.append(array_content[current_start:i+1])
                current_start = None

    levels_data = []

    for block in level_strings:
        level_id_match = re.search(r'^\s*\{\s*"?id"?:\s*(\d+)', block)
        if not level_id_match:
            continue
        level_id = int(level_id_match.group(1))

        def first_str(field):
            m = re.search(r'"?' + field + r'"?:\s*"([^"]+)"', block)
            return m.group(1) if m else ""

        name = first_str('name') or "Unknown"
        region = first_str('region')
        theorem = first_str('theorem')
        repair_time = first_str('repairTime')

        given_match = re.search(r'"?given"?:\s*\[(.*?)\]', block, re.DOTALL)
        given_items = []
        if given_match:
            given_raw = given_match.group(1)
            if given_raw.strip():
                given_items = [g.strip().strip('"').strip("'") for g in given_raw.split(',')]

        prove = first_str('prove') or "Unknown"

        steps_match = re.search(r'"?steps"?:\s*\[(.*?)\]\s*,', block, re.DOTALL)
        steps = []
        if steps_match:
            steps_raw = steps_match.group(1)
            step_blocks = re.findall(r'\{[^\}]+\}', steps_raw)
            for sb in step_blocks:
                stmt_m = re.search(r'"?statement"?:\s*"([^"]+)"', sb)
                rsn_m = re.search(r'"?reason"?:\s*"([^"]+)"', sb)
                if stmt_m and rsn_m:
                    steps.append({
                        "statement": stmt_m.group(1),
                        "reason": rsn_m.group(1)
                    })

        diagram_start = block.find('"diagram": {')
        if diagram_start == -1:
            diagram_start = block.find('diagram: {')
        diagram_str = "null"
        if diagram_start != -1:
            brace_start = block.find('{', diagram_start)
            if brace_start != -1:
                d = 0
                for i in range(brace_start, len(block)):
                    if block[i] == '{':
                        d += 1
                    elif block[i] == '}':
                        d -= 1
                        if d == 0:
                            diagram_str = block[brace_start:i+1]
                            break

        levels_data.append({
            "id": level_id,
            "name": name,
            "region": region,
            "theorem": theorem,
            "repair_time": repair_time,
            "given": given_items,
            "prove": prove,
            "steps": steps,
            "diagram_js": diagram_str,
            "standards": LEVEL_STANDARDS.get(level_id, []),
        })

    return levels_data

def generate_html(levels):
    html = r"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Chronicles of Euclid - Teacher Answer Key</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link href="https://fonts.googleapis.com/css2?family=Cinzel+Decorative:wght@400;700;900&family=MedievalSharp&family=Crimson+Text:ital,wght@0,400;0,600;0,700;1,400&display=swap" rel="stylesheet">
    <style>
        :root {
            --deep-plum: #2d1b4e;
            --royal-gold: #c9a34f;
            --burnt-gold: #a67c2e;
            --parchment: #f5e6c8;
            --parchment-dark: #e8d4a8;
            --ink-brown: #3b2414;
            --faded-ink: #5c3d2a;
            --blood-red: #7a2018;
            --emerald: #2e5339;
            --midnight: #1a1028;
            --border-ornate: #8b6914;
        }

        body {
            font-family: 'Crimson Text', Georgia, serif;
            background-color: #ffffff;
            color: var(--ink-brown);
            margin: 0;
            padding: 2rem;
            line-height: 1.55;
            font-size: 1.0rem;
        }

        .container {
            max-width: 1200px;
            margin: 0 auto;
            background: #ffffff;
            border: 3px double var(--border-ornate);
            border-radius: 4px;
            padding: 1.5rem 2rem;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            position: relative;
        }

        .container::before,
        .container::after {
            content: '';
            position: absolute;
            width: 50px;
            height: 50px;
            border: 3px solid var(--royal-gold);
            opacity: 0.5;
        }
        .container::before { top: 14px; left: 14px; border-right: none; border-bottom: none; }
        .container::after { bottom: 14px; right: 14px; border-left: none; border-top: none; }

        h1, h2, h3 {
            font-family: 'Cinzel Decorative', 'MedievalSharp', cursive;
            color: var(--deep-plum);
            text-align: center;
        }

        /* Compact header: image + title block in a single row */
        .compact-header {
            display: flex;
            align-items: center;
            gap: 1.2rem;
            padding: 0.7rem 1.2rem;
            border: 2px solid var(--burnt-gold);
            border-radius: 4px;
            margin-bottom: 1rem;
            background: linear-gradient(135deg, rgba(45, 27, 78, 0.05) 0%, rgba(139, 105, 20, 0.05) 100%);
            position: relative;
        }
        .compact-header::before {
            content: '';
            position: absolute;
            inset: 4px;
            border: 1px solid rgba(139, 105, 20, 0.18);
            border-radius: 2px;
            pointer-events: none;
        }
        .compact-header .banner-img {
            width: 110px;
            height: 75px;
            object-fit: cover;
            border: 2px solid var(--royal-gold);
            border-radius: 3px;
            flex-shrink: 0;
            box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        }
        .compact-header .title-block { flex: 1; text-align: center; }
        .compact-header h1 {
            font-size: 1.55rem;
            text-transform: uppercase;
            letter-spacing: 3px;
            margin: 0;
            font-weight: 900;
            text-shadow: 1px 1px 2px rgba(139, 105, 20, 0.2);
            line-height: 1.1;
        }
        .compact-header .subtitle {
            font-family: 'MedievalSharp', cursive;
            font-size: 1.0rem;
            color: var(--blood-red);
            margin-top: 0.15rem;
            letter-spacing: 1px;
        }
        .compact-header .ornate-mini {
            color: var(--royal-gold);
            letter-spacing: 4px;
            font-size: 0.7rem;
            margin-top: 0.1rem;
        }

        h2 {
            font-family: 'MedievalSharp', cursive;
            font-size: 1.5rem;
            margin-top: 1rem;
            margin-bottom: 0.9rem;
            color: var(--blood-red);
            position: relative;
            padding-bottom: 0.6rem;
        }

        h2::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 25%;
            width: 50%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--royal-gold), var(--burnt-gold), var(--royal-gold), transparent);
        }

        .tutorial-box {
            background: linear-gradient(135deg, rgba(45, 27, 78, 0.05) 0%, rgba(139, 105, 20, 0.05) 100%);
            border: 2px solid var(--burnt-gold);
            padding: 1rem 1.2rem;
            border-radius: 4px;
            margin-bottom: 1rem;
            display: flex;
            align-items: center;
            gap: 1.2rem;
            position: relative;
        }

        .tutorial-box::before {
            content: '';
            position: absolute;
            inset: 4px;
            border: 1px solid rgba(139, 105, 20, 0.15);
            border-radius: 2px;
            pointer-events: none;
        }

        .tutorial-content { flex: 1; font-size: 0.95rem; }
        .tutorial-content p { margin: 0.4rem 0; }
        .tutorial-image { width: 130px; flex-shrink: 0; text-align: center; }
        .tutorial-image img {
            max-width: 100%;
            border-radius: 6px;
            border: 2px solid var(--royal-gold);
            box-shadow: 0 3px 10px rgba(45, 27, 78, 0.3);
        }
        .tutorial-box h3 {
            font-family: 'MedievalSharp', cursive;
            color: var(--deep-plum);
            margin: 0 0 0.4rem 0;
            text-align: left;
            border-bottom: 1px solid rgba(139, 105, 20, 0.3);
            padding-bottom: 0.3rem;
            font-size: 1.3rem;
        }

        .standards-box {
            background: rgba(45, 27, 78, 0.05);
            border-left: 5px solid var(--royal-gold);
            padding: 1rem 1.5rem;
            margin: 1.2rem 0;
            font-size: 1.0rem;
        }
        .standards-box ul { margin: 0.4rem 0 0 0; padding-left: 1.2rem; }
        .standards-box li { margin-bottom: 0.2rem; }

        /* Row-major grid: levels read top-to-bottom in order: 1,2 / 3,4 / ... */
        .levels-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 0.9rem 1.1rem;
            margin-top: 1rem;
        }

        .level-card {
            background: #ffffff;
            border: 1.5px solid var(--burnt-gold);
            padding: 0.6rem 0.7rem 0.5rem;
            border-radius: 3px;
            box-shadow: 0 1px 3px rgba(0,0,0,0.05);
            break-inside: avoid;
            page-break-inside: avoid;
            box-sizing: border-box;
            position: relative;
        }
        .level-card::before {
            content: '';
            position: absolute;
            inset: 3px;
            border: 1px solid rgba(139, 105, 20, 0.18);
            border-radius: 2px;
            pointer-events: none;
        }

        /* Region-specific accents (subtle, ink-friendly when printed). */
        .level-card.region-isocele { border-color: #8b6914; }
        .level-card.region-isocele .quest-symbol { color: #8b6914; }
        .level-card.region-isocele .level-header { border-bottom-color: #c9a34f; }

        .level-card.region-rhombic-sands { border-color: #b88840; }
        .level-card.region-rhombic-sands .quest-symbol { color: #b88840; }
        .level-card.region-rhombic-sands .level-header { border-bottom-color: #d4a86a; }
        .level-card.region-rhombic-sands::before { border-style: dashed; border-color: rgba(184, 136, 64, 0.22); }

        .level-card.region-gaelic-grids { border-color: #5a7345; }
        .level-card.region-gaelic-grids .quest-symbol { color: #5a7345; }
        .level-card.region-gaelic-grids .level-header { border-bottom-color: #8aa672; }
        .level-card.region-gaelic-grids::before { border-color: rgba(90, 115, 69, 0.25); }

        .level-header {
            font-family: 'MedievalSharp', cursive;
            font-weight: bold;
            color: var(--blood-red);
            margin-bottom: 0.25rem;
            text-align: center;
            border-bottom: 1px solid var(--royal-gold);
            padding-bottom: 0.35rem;
            position: relative;
            line-height: 1.15;
        }
        .quest-number {
            display: block;
            font-size: 0.78rem;
            letter-spacing: 3px;
            color: var(--burnt-gold);
            margin-bottom: 0.05rem;
            text-transform: uppercase;
        }
        .quest-symbol { font-size: 1rem; margin: 0 0.4rem; }
        .quest-title { display: block; font-size: 1.2rem; }

        .level-meta {
            font-size: 0.78rem;
            text-align: center;
            color: var(--faded-ink);
            margin-bottom: 0.35rem;
            font-style: italic;
            line-height: 1.25;
        }
        .level-meta .region-badge {
            display: inline-block;
            border: 1px solid rgba(139, 105, 20, 0.45);
            border-radius: 10px;
            padding: 0.05rem 0.55rem;
            font-style: normal;
            font-family: 'MedievalSharp', cursive;
            font-size: 0.78rem;
            background: rgba(201, 163, 79, 0.06);
            margin-right: 0.35rem;
        }
        .level-card.region-rhombic-sands .level-meta .region-badge { border-color: rgba(184, 136, 64, 0.55); background: rgba(212, 168, 106, 0.08); }
        .level-card.region-gaelic-grids .level-meta .region-badge { border-color: rgba(90, 115, 69, 0.55); background: rgba(138, 166, 114, 0.08); }
        .level-meta .pip { color: var(--royal-gold); margin: 0 0.35rem; font-style: normal; }
        .level-meta strong { font-style: normal; color: var(--ink-brown); }
        .standards-line {
            font-size: 0.72rem;
            text-align: center;
            color: var(--faded-ink);
            margin-bottom: 0.35rem;
            font-family: 'Crimson Text', serif;
        }
        .standards-line strong { color: var(--ink-brown); }
        .standards-line .std-tag {
            display: inline-block;
            border: 1px solid rgba(139, 105, 20, 0.55);
            border-radius: 2px;
            padding: 0 0.3rem;
            margin: 0 0.12rem;
            background: rgba(201, 163, 79, 0.08);
            font-weight: 600;
        }

        .given-prove {
            margin-bottom: 0.35rem;
            padding: 0.45rem 0.7rem;
            background: rgba(45, 27, 78, 0.04);
            border-left: 3px solid var(--royal-gold);
            border-radius: 0 3px 3px 0;
            font-size: 0.95rem;
            line-height: 1.4;
        }

        .diagram-container {
            text-align: center;
            margin-bottom: 0.35rem;
            background: rgba(45, 27, 78, 0.02);
            border: 1px dashed rgba(139, 105, 20, 0.25);
            border-radius: 3px;
            padding: 0.3rem;
        }

        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 0.92rem;
        }

        th, td {
            border: 1.5px solid rgba(139, 105, 20, 0.35);
            padding: 0.3rem 0.45rem;
            text-align: left;
            vertical-align: top;
        }

        th {
            background: var(--deep-plum);
            color: var(--parchment);
            font-family: 'MedievalSharp', cursive;
            font-weight: bold;
            font-size: 0.95rem;
        }

        @media print {
            @page { size: letter; margin: 0.45in; }
            body { background: white !important; padding: 0; margin: 0; font-size: 9.5pt; line-height: 1.35; color: #000 !important; }
            .container { box-shadow: none; border: none; padding: 0; max-width: 100%; background: white !important; }
            .container::before, .container::after { display: none; }
            .compact-header { border: 1px solid #555 !important; background: white !important; padding: 0.35rem 0.6rem; margin-bottom: 0.5rem; gap: 0.6rem; }
            .compact-header::before { display: none; }
            .compact-header .banner-img { display: none; }
            .compact-header h1 { font-size: 13pt; letter-spacing: 1.5px; color: #000 !important; text-shadow: none !important; }
            .compact-header .subtitle { font-size: 9.5pt; color: #000 !important; }
            .compact-header .ornate-mini { color: #777 !important; font-size: 6.5pt; letter-spacing: 2px; }
            h2 { font-size: 11.5pt; margin-top: 0.3rem; margin-bottom: 0.35rem; color: #000 !important; padding-bottom: 0.25rem; }
            h2::after { background: #000 !important; height: 1px; left: 30%; width: 40%; }
            .tutorial-box { border: 1px solid #555; background: white !important; break-inside: avoid; page-break-inside: avoid; gap: 0.5rem; padding: 0.5rem 0.7rem; margin-bottom: 0.6rem; }
            .tutorial-box::before { display: none; }
            .tutorial-image { width: 80px; }
            .tutorial-image img { border: 1.5px solid #555 !important; box-shadow: none !important; }
            .tutorial-box h3 { font-size: 10.5pt; color: #000 !important; padding-bottom: 0.15rem; margin-bottom: 0.25rem; }
            .tutorial-content { font-size: 8.5pt; }
            .tutorial-content p { margin: 0.2rem 0; }
            .standards-box { background: white !important; border-left: 2px solid #000; padding: 0.35rem 0.6rem; margin: 0.4rem 0; font-size: 8.5pt; }
            .standards-box ul { padding-left: 1rem; }
            .levels-grid { display: grid !important; grid-template-columns: repeat(2, 1fr) !important; column-gap: 0.5rem; row-gap: 0.4rem; margin-top: 0.4rem; }
            .level-card {
                break-inside: avoid; page-break-inside: avoid;
                border: 1px solid #555 !important;
                box-shadow: none !important;
                padding: 0.3rem 0.35rem 0.25rem;
                background: white !important;
            }
            .level-card::before { border: 1px solid #aaa !important; inset: 2px; }
            /* Region styles in print: use border style only (ink-friendly). */
            .level-card.region-isocele { border-color: #555 !important; }
            .level-card.region-rhombic-sands { border: 1px dashed #555 !important; }
            .level-card.region-rhombic-sands::before { border: 1px dashed #aaa !important; }
            .level-card.region-gaelic-grids { border: 1.5px double #555 !important; }
            .level-card.region-gaelic-grids::before { border: 1px solid #aaa !important; }
            .level-header { color: #000 !important; padding-bottom: 0.2rem; margin-bottom: 0.2rem; border-bottom: 1px solid #777 !important; }
            .quest-number { color: #555 !important; font-size: 7.5pt; letter-spacing: 2.5px; }
            .quest-symbol { color: #555 !important; font-size: 9pt; }
            .quest-title { font-size: 10.5pt; }
            .level-meta { color: #333 !important; font-size: 7.2pt; margin-bottom: 0.2rem; }
            .level-meta .region-badge { background: white !important; border: 1px solid #888 !important; padding: 0.02rem 0.4rem; }
            .level-meta .pip { color: #888 !important; }
            .standards-line { color: #333 !important; font-size: 6.8pt; margin-bottom: 0.2rem; }
            .standards-line .std-tag { background: white !important; border-color: #888 !important; }
            .given-prove { background: white !important; border-left: 2px solid #555 !important; padding: 0.2rem 0.4rem; margin-bottom: 0.25rem; font-size: 8.4pt; line-height: 1.3; }
            .diagram-container { border: 1px solid #bbb !important; background: white !important; padding: 0.15rem; margin-bottom: 0.25rem; }
            .diagram-container svg { max-height: 105px !important; margin-bottom: -3px; }
            table { font-size: 8pt; }
            th, td { padding: 0.18rem 0.3rem; border: 1px solid #777 !important; }
            th { background: #f0f0f0 !important; color: #000 !important; font-size: 8pt; padding-top: 0.15rem; padding-bottom: 0.15rem; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
            h2.print-break-before { page-break-before: always; break-before: page; }
        }
        @media (max-width: 800px) {
            .levels-grid { grid-template-columns: 1fr; }
            .compact-header { flex-direction: column; }
            .tutorial-box { flex-direction: column; }
            .container { padding: 0.8rem; }
        }
    </style>
</head>
<body>

<div class="container">
    <div class="compact-header">
        <img class="banner-img" src="Images/CastleTitle.jpg" alt="The Chronicles of Euclid Castle">
        <div class="title-block">
            <h1>The Chronicles of Euclid</h1>
            <div class="subtitle">&#9876; Teacher Answer Key &#9876;</div>
            <div class="ornate-mini">&#10086; &#10070; &#10086; &#10070; &#10086;</div>
        </div>
    </div>

    <div class="tutorial-box">
        <div class="tutorial-image">
            <img src="Images/SageCharacter.png" alt="The Royal Sage">
            <div style="font-family: 'MedievalSharp', cursive; margin-top: 0.3rem; font-weight: bold; color: var(--deep-plum); font-size: 0.95rem;">&#10070; The Royal Sage &#10070;</div>
        </div>
        <div class="tutorial-content">
            <h3>Classroom Walkthrough &amp; Tutorial</h3>
            <p>Welcome to <strong>The Chronicles of Euclid</strong>! This interactive Geometry Proof Quest helps students master geometric proofs through an engaging, medieval narrative. Students act as the Royal Heir to the Kingdom of Euclid &mdash; a realm afflicted by "Logical Decay." To rebuild bridges, castles, and farmlands, students must complete two-column proofs.</p>
            <p style="margin-bottom: 0.4rem;"><strong>Realm crests:</strong> <strong>&#9884; Isocele</strong> (Levels 1&ndash;10) &middot; <strong>&#9671; Rhombic Sands</strong> (11&ndash;15) &middot; <strong>&#10048; Gaelic Grids</strong> (16&ndash;20).</p>

            <div class="standards-box">
                <strong>&#10070; Common Core State Standards (CCSS) Aligned &#10070;</strong>
                <ul>
                    <li><strong>HSG.CO.C.9:</strong> Prove theorems about lines and angles. <em>(Levels 4, 10, 13, 16)</em></li>
                    <li><strong>HSG.CO.C.10:</strong> Prove theorems about triangles. <em>(Levels 1&ndash;9, 11&ndash;12, 14&ndash;18, 20)</em></li>
                    <li><strong>HSG.CO.C.11:</strong> Prove theorems about parallelograms. <em>(Levels 11, 14, 15)</em></li>
                    <li><strong>HSG.SRT.B.4:</strong> Prove theorems about similarity. <em>(Level 19)</em></li>
                    <li><strong>HSG.SRT.B.5:</strong> Use congruence and similarity criteria for triangles. <em>(Levels 1&ndash;8, 11&ndash;12, 14&ndash;17, 19, 20)</em></li>
                </ul>
            </div>

            <p style="margin-bottom: 0;"><strong>Premium Access:</strong> The first 5 levels are free. To unlock the remaining 15 levels, provide students with the password: <strong style="font-size:1.2rem; color:var(--blood-red);">MathI5Fun</strong>.</p>
        </div>
    </div>

    <h2 class="print-break-before">&#9874; Complete Proof Answer Key &#9874;</h2>

    <div class="levels-grid">
"""
    
    for level in levels:
        given_str = ", ".join(level["given"])
        region = level.get('region') or ''
        slug = region_slug(region)
        sym = REGION_SYMBOLS.get(region, DEFAULT_REGION_SYMBOL)
        # Strip leading "HSG." from each std for compactness
        std_tags = ''.join(
            f'<span class="std-tag">{s.replace("HSG.", "")}</span>'
            for s in level.get('standards', [])
        )
        meta_bits = []
        if region:
            meta_bits.append(f'<span class="region-badge">{sym}&nbsp;{region}&nbsp;{sym}</span>')
        if level.get('theorem'):
            meta_bits.append(f'<strong>Theorem:</strong>&nbsp;{level["theorem"]}')
        meta_html = ''.join(meta_bits) if len(meta_bits) <= 1 else \
            meta_bits[0] + '<span class="pip">&#10070;</span>' + '<span class="pip">&#10070;</span>'.join(meta_bits[1:])

        html += f"""
        <div class="level-card region-{slug}">
            <div class="level-header">
                <span class="quest-number"><span class="quest-symbol">{sym}</span>Quest&nbsp;{level['id']}<span class="quest-symbol">{sym}</span></span>
                <span class="quest-title">{level['name']}</span>
            </div>
            <div class="level-meta">{meta_html}</div>
            <div class="standards-line"><strong>CCSS:</strong> {std_tags}</div>
            <div class="given-prove">
                <strong>Given:</strong> {given_str}<br>
                <strong>Prove:</strong> {level['prove']}
            </div>
            <div class="diagram-container">
                <svg id="diagram-{level['id']}" width="320" height="260" style="max-width: 100%;"></svg>
            </div>
            <table>
                <thead>
                    <tr>
                        <th style="width: 50%;">Statement</th>
                        <th style="width: 50%;">Reason</th>
                    </tr>
                </thead>
                <tbody>
"""
        for step in level["steps"]:
            html += f"""
                    <tr>
                        <td>{step['statement']}</td>
                        <td>{step['reason']}</td>
                    </tr>
"""
        html += """
                </tbody>
            </table>
        </div>
"""

        diagram_js = level.get('diagram_js', "null")
        html += f"""
        <script>
            window.diagramsData = window.diagramsData || {{}};
            window.diagramsData[{level['id']}] = {diagram_js};
        </script>
"""

    html += r"""
    </div>
</div>

<script>
function renderDiagrams() {
    for (let id in window.diagramsData) {
        let diagram = window.diagramsData[id];
        let svg = document.getElementById("diagram-" + id);
        if (svg && diagram) {
            drawDiagram(svg, diagram);
        }
    }
}

function drawDiagram(svg, diagram) {
    if (!diagram || !diagram.points) return;
    svg.innerHTML = "";

    const getPoint = (id) => diagram.points.find((p) => p.id === id);

    let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
    diagram.points.forEach(p => {
        if (p.x < minX) minX = p.x;
        if (p.x > maxX) maxX = p.x;
        if (p.y < minY) minY = p.y;
        if (p.y > maxY) maxY = p.y;
    });
    const padding = 40;
    minX -= padding; minY -= padding; maxX += padding; maxY += padding;
    svg.setAttribute("viewBox", `${minX} ${minY} ${maxX - minX} ${maxY - minY}`);
    svg.style.width = "100%";
    svg.style.height = "auto";
    svg.style.maxHeight = "160px";

    if (diagram.lines) {
        diagram.lines.forEach((line) => {
            const from = getPoint(line.from);
            const to = getPoint(line.to);
            if (!from || !to) return;
            const lineEl = document.createElementNS("http://www.w3.org/2000/svg", "line");
            lineEl.setAttribute("x1", from.x);
            lineEl.setAttribute("y1", from.y);
            lineEl.setAttribute("x2", to.x);
            lineEl.setAttribute("y2", to.y);
            lineEl.setAttribute("stroke", "#2d1b4e");
            lineEl.setAttribute("stroke-width", "2.5");
            svg.appendChild(lineEl);
        });
    }

    if (diagram.givenMarks && diagram.givenMarks.ticks) {
        diagram.givenMarks.ticks.forEach(tickMark => {
            let p1, p2;
            const line = diagram.lines.find(l => l.id === tickMark.line);
            if (line) {
                p1 = getPoint(line.from);
                p2 = getPoint(line.to);
            } else {
                const chars = tickMark.line.split('');
                if (chars.length === 2) {
                    p1 = getPoint(chars[0]);
                    p2 = getPoint(chars[1]);
                }
            }
            if (!p1 || !p2) return;
            drawTicks(svg, p1, p2, tickMark.count);
        });
    }

    if (diagram.givenMarks && diagram.givenMarks.arcs) {
        diagram.givenMarks.arcs.forEach(arcMark => {
            const vertex = getPoint(arcMark.vertex);
            const rays = arcMark.rays.map(rId => getPoint(rId));
            if (!vertex || rays.length < 2 || !rays[0] || !rays[1]) return;
            drawArc(svg, vertex, rays, arcMark.count, arcMark.label, arcMark.radius);
        });
    }

    diagram.points.forEach((point) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", point.x);
        circle.setAttribute("cy", point.y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#2d1b4e");
        svg.appendChild(circle);

        if (point.label) {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            const cx = (minX + maxX) / 2;
            const cy = (minY + maxY) / 2;
            const dx = point.x > cx ? 12 : -12;
            const dy = point.y > cy ? 12 : -12;
            
            text.setAttribute("x", point.x + dx);
            text.setAttribute("y", point.y + dy);
            text.setAttribute("fill", "#3b2414");
            text.setAttribute("font-family", "'Crimson Text', serif");
            text.setAttribute("font-size", "18");
            text.setAttribute("font-weight", "bold");
            text.setAttribute("text-anchor", point.x > cx ? "start" : "end");
            text.setAttribute("dominant-baseline", point.y > cy ? "hanging" : "auto");
            
            text.setAttribute("paint-order", "stroke fill");
            text.setAttribute("stroke", "rgba(255,255,255,0.9)");
            text.setAttribute("stroke-width", "5");
            text.setAttribute("stroke-linejoin", "round");
            
            text.textContent = point.label;
            svg.appendChild(text);
        }
    });
}

function drawTicks(svg, p1, p2, count, pos = 0.5) {
    const midX = p1.x + (p2.x - p1.x) * pos;
    const midY = p1.y + (p2.y - p1.y) * pos;
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const angle = Math.atan2(dy, dx);
    const perp = angle + Math.PI / 2;
    const spacing = 8;
    const tickLen = 12;

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
        line.setAttribute("stroke", "#c9a34f");
        line.setAttribute("stroke-width", "2.5");
        svg.appendChild(line);
    }
}

function drawArc(svg, vertex, rays, count, label, overrideRadius = null) {
    const angles = rays.map(r => Math.atan2(r.y - vertex.y, r.x - vertex.x));
    let start = angles[0];
    let end = angles[1];

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

        const largeArc = Math.abs(diff) > Math.PI ? 1 : 0;
        const sweep = diff > 0 ? 1 : 0;

        const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
        path.setAttribute("d", `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} ${sweep} ${x2} ${y2}`);
        path.setAttribute("fill", "none");
        path.setAttribute("stroke", "#c9a34f");
        path.setAttribute("stroke-width", "2.5");
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
        text.setAttribute("fill", "#2d1b4e");
        text.setAttribute("text-anchor", "middle");
        text.setAttribute("dominant-baseline", "middle");
        text.setAttribute("font-size", "14");
        text.setAttribute("font-weight", "bold");
        text.textContent = label;
        svg.appendChild(text);
    }
}

window.addEventListener('DOMContentLoaded', renderDiagrams);
</script>
</body>
</html>
"""
    return html

def main():
    game_js_path = os.path.join(os.path.dirname(__file__), 'game.js')
    levels = extract_levels_from_js(game_js_path)
    
    if not levels:
        print("Failed to extract levels.")
        return
        
    levels = sorted(levels, key=lambda x: int(x['id']))
        
    html_content = generate_html(levels)
    
    output_path = os.path.join(os.path.dirname(__file__), 'AnswerKey.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"Successfully generated {output_path} with {len(levels)} levels.")

if __name__ == "__main__":
    main()
