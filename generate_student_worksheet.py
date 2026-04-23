import re
import json
import os

def extract_levels_from_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the levels array in game.js
    match = re.search(r'const levels = \[(.*?)\];\s*(?:let|const|var) ', content, re.DOTALL)
    if not match:
        print("Could not find levels array in game.js")
        return []

    array_content = match.group(1)
    
    # Split into individual level objects using brace-counting
    # Each top-level object in the array starts with { and ends with }
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
        # Extract top-level id (first occurrence, which is the level id)
        level_id_match = re.search(r'^\s*\{\s*id:\s*(\d+)', block)
        if not level_id_match: continue
        level_id = level_id_match.group(1)
        
        name_match = re.search(r'name:\s*"([^"]+)"', block)
        name = name_match.group(1) if name_match else "Unknown"
        
        given_match = re.search(r'given:\s*\[(.*?)\]', block, re.DOTALL)
        given_items = []
        if given_match:
            given_raw = given_match.group(1)
            if given_raw.strip():
                given_items = [g.strip().strip('"').strip("'") for g in given_raw.split(',')]
            
        prove_match = re.search(r'prove:\s*"([^"]+)"', block)
        prove = prove_match.group(1) if prove_match else "Unknown"
        
        steps_match = re.search(r'steps:\s*\[(.*?)\]\s*,', block, re.DOTALL)
        steps = []
        if steps_match:
            steps_raw = steps_match.group(1)
            step_blocks = re.findall(r'\{[^\}]+\}', steps_raw)
            for sb in step_blocks:
                stmt_m = re.search(r'statement:\s*"([^"]+)"', sb)
                rsn_m = re.search(r'reason:\s*"([^"]+)"', sb)
                if stmt_m and rsn_m:
                    steps.append({
                        "statement": stmt_m.group(1),
                        "reason": rsn_m.group(1)
                    })
                    
        # Extract diagram using brace-counting from 'diagram: {'
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
            "given": given_items,
            "prove": prove,
            "steps": steps,
            "diagram_js": diagram_str
        })
        
    return levels_data

def generate_html(levels):
    html = r"""<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Chronicles of Euclid - Student Quest Log</title>
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
            line-height: 1.6;
            font-size: 1.1rem;
        }
        
        .container {
            max-width: 1200px; 
            margin: 0 auto;
            background: #ffffff;
            border: 3px double var(--border-ornate);
            border-radius: 4px;
            padding: 2.5rem 3.5rem;
            box-shadow: 0 2px 12px rgba(0, 0, 0, 0.08);
            position: relative;
        }
        
        /* Ornate corner flourishes */
        .container::before,
        .container::after {
            content: '';
            position: absolute;
            width: 50px;
            height: 50px;
            border: 3px solid var(--royal-gold);
            opacity: 0.5;
        }
        .container::before {
            top: 14px; left: 14px;
            border-right: none; border-bottom: none;
        }
        .container::after {
            bottom: 14px; right: 14px;
            border-left: none; border-top: none;
        }
        
        .header-banner {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .header-banner img {
            max-width: 100%;
            height: auto;
            max-height: 200px;
            border-radius: 4px;
            border: 3px solid var(--royal-gold);
            box-shadow: 0 5px 20px rgba(0,0,0,0.4);
            object-fit: cover;
        }
        
        h1, h2, h3 {
            font-family: 'Cinzel Decorative', 'MedievalSharp', cursive;
            color: var(--deep-plum);
            text-align: center;
        }
        
        h1 {
            font-size: 2.3rem;
            text-transform: uppercase;
            letter-spacing: 4px;
            padding-bottom: 0.5rem;
            margin-top: 1rem;
            margin-bottom: 0.3rem;
            font-weight: 900;
            color: var(--deep-plum);
            text-shadow: 1px 1px 2px rgba(139, 105, 20, 0.25);
        }
        
        .ornate-divider {
            text-align: center;
            margin: 0.3rem 0 1rem 0;
            font-size: 1rem;
            color: var(--royal-gold);
            letter-spacing: 10px;
        }
        
        h2 {
            font-family: 'MedievalSharp', cursive;
            font-size: 1.9rem;
            margin-top: 2rem;
            margin-bottom: 1.5rem;
            color: var(--blood-red);
            position: relative;
            padding-bottom: 0.8rem;
        }
        
        h2::after {
            content: '';
            position: absolute;
            bottom: 0;
            left: 20%;
            width: 60%;
            height: 2px;
            background: linear-gradient(90deg, transparent, var(--royal-gold), var(--burnt-gold), var(--royal-gold), transparent);
        }
        
        .tutorial-box {
            background: linear-gradient(135deg, rgba(45, 27, 78, 0.05) 0%, rgba(139, 105, 20, 0.05) 100%);
            border: 2px solid var(--burnt-gold);
            padding: 2rem;
            border-radius: 4px;
            margin-bottom: 3rem;
            display: flex;
            align-items: center;
            gap: 2rem;
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
        
        .tutorial-content { flex: 1; }
        
        .tutorial-image {
            width: 200px;
            flex-shrink: 0;
            text-align: center;
        }
        
        .tutorial-image img {
            max-width: 100%;
            border-radius: 8px;
            border: 3px solid var(--royal-gold);
            box-shadow: 0 4px 15px rgba(45, 27, 78, 0.35);
        }
        
        .tutorial-box h3 {
            font-family: 'MedievalSharp', cursive;
            color: var(--deep-plum);
            margin-top: 0;
            text-align: left;
            border-bottom: 1px solid rgba(139, 105, 20, 0.3);
            padding-bottom: 0.5rem;
            font-size: 1.7rem;
        }
        
        .hero-label {
            font-family: 'MedievalSharp', cursive;
            margin-top: 0.5rem;
            font-weight: bold;
            color: var(--deep-plum);
            font-size: 1.1rem;
        }
        
        .student-name-box {
            display: flex;
            justify-content: flex-end;
            margin-bottom: 2rem;
            font-family: 'MedievalSharp', cursive;
            font-size: 1.4rem;
            color: var(--faded-ink);
        }
        
        .student-name-line {
            border-bottom: 2px solid var(--faded-ink);
            width: 300px;
            margin-left: 1rem;
        }
        
        /* Two-column layout */
        .levels-grid {
            column-count: 2;
            column-gap: 2rem;
            margin-top: 2rem;
        }
        
        .level-card {
            background: #ffffff;
            border: 2px solid var(--burnt-gold);
            padding: 1.5rem;
            margin-bottom: 2rem;
            border-radius: 4px;
            box-shadow: 0 1px 4px rgba(0,0,0,0.06);
            break-inside: avoid;
            page-break-inside: avoid;
            display: inline-block;
            width: 100%;
            box-sizing: border-box;
        }
        
        .level-header {
            font-size: 1.4rem;
            font-weight: bold;
            color: var(--blood-red);
            margin-bottom: 0.8rem;
            font-family: 'MedievalSharp', cursive;
            text-align: center;
            border-bottom: 1px solid var(--royal-gold);
            padding-bottom: 0.5rem;
        }
        
        .given-prove {
            margin-bottom: 0.8rem;
            padding: 0.7rem 1rem;
            background: rgba(45, 27, 78, 0.04);
            border-left: 4px solid var(--royal-gold);
            border-radius: 0 4px 4px 0;
            font-size: 1rem;
        }
        
        .diagram-container {
            text-align: center;
            margin-bottom: 0.8rem;
            background: rgba(45, 27, 78, 0.025);
            border: 1px dashed rgba(139, 105, 20, 0.25);
            border-radius: 4px;
            padding: 0.5rem;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 1rem;
        }
        
        th, td {
            border: 2px solid rgba(139, 105, 20, 0.35);
            padding: 0.9rem 0.7rem;
            text-align: left;
            vertical-align: top;
        }
        
        td { height: 2.5rem; }
        
        th {
            background: var(--deep-plum);
            color: var(--parchment);
            font-family: 'MedievalSharp', cursive;
            font-weight: bold;
            font-size: 1.1rem;
        }
        
        @media print {
            @page {
                size: letter;
                margin: 0.5in;
            }
            body {
                background: white !important;
                padding: 0;
                margin: 0;
                font-size: 11pt;
            }
            .container {
                box-shadow: none;
                border: none;
                padding: 0.5rem 1rem;
                max-width: 100%;
                background: white !important;
            }
            .container::before, .container::after { display: none; }
            .header-banner { display: none; }
            h1 {
                font-size: 18pt;
                margin-top: 0;
                margin-bottom: 0.3rem;
            }
            h2 {
                font-size: 14pt;
                margin-top: 0.5rem;
                margin-bottom: 0.5rem;
            }
            h2::after { display: none; }
            .ornate-divider { margin: 0.2rem 0 0.5rem 0; }
            .tutorial-box {
                border: 1px solid #aaa;
                background: white !important;
                break-inside: avoid;
                page-break-inside: avoid;
                gap: 0.8rem;
                padding: 1rem;
                margin-bottom: 1.5rem;
            }
            .tutorial-box::before { display: none; }
            .tutorial-image { width: 120px; }
            .tutorial-image img { border-width: 2px; }
            .levels-grid {
                column-count: 2;
                column-gap: 1.2rem;
            }
            .level-card {
                break-inside: avoid;
                page-break-inside: avoid;
                border: 1.5px solid #999;
                box-shadow: none;
                margin-bottom: 12px;
                padding: 0.7rem;
                background: white !important;
            }
            .level-header {
                font-size: 11pt;
                margin-bottom: 0.4rem;
                padding-bottom: 0.3rem;
            }
            .given-prove {
                background: white !important;
                border-left: 3px solid #999;
                padding: 0.4rem 0.7rem;
                margin-bottom: 0.5rem;
                font-size: 9.5pt;
            }
            .diagram-container {
                border: 1px solid #ddd;
                background: white !important;
                padding: 0.3rem;
                margin-bottom: 0.5rem;
            }
            .diagram-container svg {
                max-height: 180px;
            }
            table { font-size: 9.5pt; }
            th, td { padding: 0.5rem; }
            td { height: 1.8rem; }
            th {
                background: #444 !important;
                color: white !important;
                font-size: 10pt;
            }
            h2.print-break-before {
                page-break-before: always;
                break-before: page;
            }
            .student-name-box {
                font-size: 12pt;
                margin-bottom: 0.8rem;
            }
        }
        
        @media (max-width: 800px) {
            .levels-grid { column-count: 1; }
            .tutorial-box { flex-direction: column; }
            .container { padding: 1.5rem; }
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header-banner">
        <img src="Images/CastleTitle.jpg" alt="The Chronicles of Euclid Castle">
    </div>
    
    <div class="student-name-box">
        Student Name: <div class="student-name-line"></div>
    </div>
    
    <h1>The Chronicles of Euclid</h1>
    <div class="ornate-divider">&#9830; &#9830; &#9830;</div>
    <h2>Student Quest Log</h2>
    
    <div class="tutorial-box">
        <div class="tutorial-image">
            <img src="Images/MightyHero_NoText.png" alt="Royal Heir">
            <div class="hero-label">Royal Heir</div>
        </div>
        <div class="tutorial-content">
            <h3>Your Geometry Quest Begins...</h3>
            <p>Welcome to <strong>The Chronicles of Euclid</strong>! You are the Royal Heir to the kingdom. Unfortunately, the kingdom is suffering from "Logical Decay."</p>
            <p>To rebuild the bridges, castles, and farmlands, you must complete <strong>two-column proofs</strong>. Use this Quest Log to write down your work and keep track of your logical deductions before entering them into the magical portals (your computer).</p>
            <p><strong>Instructions:</strong> For each level below, read the Given information and look at the Prove goal. Then, fill in the blank table with the correct Statements and Reasons to complete the proof.</p>
        </div>
    </div>

    <h2 class="print-break-before">Your Proof Challenges</h2>
    
    <div class="levels-grid">
"""
    
    for level in levels:
        given_str = ", ".join(level["given"])
        html += f"""
        <div class="level-card">
            <div class="level-header">Level {level['id']}: {level['name']}</div>
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
        # Create empty rows based on the number of steps
        for _ in range(len(level["steps"])):
            html += """
                    <tr>
                        <td></td>
                        <td></td>
                    </tr>
"""
        html += """
                </tbody>
            </table>
        </div>
"""
        
        # Inject diagram JS object
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

    // Draw Lines
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

    // Draw Given Marks (Ticks)
    if (diagram.givenMarks && diagram.givenMarks.ticks) {
        diagram.givenMarks.ticks.forEach(tickMark => {
            let p1, p2;
            const line = diagram.lines.find(l => l.id === tickMark.line);
            if (line) {
                p1 = getPoint(line.from);
                p2 = getPoint(line.to);
            } else {
                // Fallback: treat the tick line ID as two point IDs (e.g. "AC" -> "A" and "C")
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

    // Draw Given Marks (Arcs)
    if (diagram.givenMarks && diagram.givenMarks.arcs) {
        diagram.givenMarks.arcs.forEach(arcMark => {
            const vertex = getPoint(arcMark.vertex);
            const rays = arcMark.rays.map(rId => getPoint(rId));
            if (!vertex || rays.length < 2 || !rays[0] || !rays[1]) return;
            drawArc(svg, vertex, rays, arcMark.count, arcMark.label, arcMark.radius);
        });
    }

    // Draw Points
    diagram.points.forEach((point) => {
        const circle = document.createElementNS("http://www.w3.org/2000/svg", "circle");
        circle.setAttribute("cx", point.x);
        circle.setAttribute("cy", point.y);
        circle.setAttribute("r", "4");
        circle.setAttribute("fill", "#2d1b4e");
        svg.appendChild(circle);

        if (point.label) {
            const text = document.createElementNS("http://www.w3.org/2000/svg", "text");
            text.setAttribute("x", point.x + 8);
            text.setAttribute("y", point.y - 8);
            text.setAttribute("fill", "#3b2414");
            text.setAttribute("font-family", "'Crimson Text', serif");
            text.setAttribute("font-size", "16");
            text.setAttribute("font-weight", "bold");
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
        
    # Sort levels by integer ID to ensure sequential order
    levels = sorted(levels, key=lambda x: int(x['id']))
        
    html_content = generate_html(levels)
    
    output_path = os.path.join(os.path.dirname(__file__), 'StudentWorksheet.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"Successfully generated {output_path} with {len(levels)} levels.")

if __name__ == "__main__":
    main()
