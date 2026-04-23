import re
import json
import os

def extract_levels_from_js(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    # Find the levels array in game.js
    # It starts with 'const levels = [' and ends before '];'
    match = re.search(r'const levels = \[(.*?)\];\s*let gameState', content, re.DOTALL)
    if not match:
        print("Could not find levels array in game.js")
        return []

    levels_str = "[" + match.group(1) + "]"
    
    # We can't directly JSON.parse a raw JS object string easily in Python because of unquoted keys.
    # We will use a regex approach to extract the necessary parts: id, name, prove, steps
    
    levels_data = []
    
    # We need to find each level object.
    # A level object starts with `  {\n    id: X,` and we can capture everything up to the next level or end of array.
    level_matches = re.finditer(r'\{\s*id:\s*(\d+),\s*region:\s*"[^"]+",\s*name:\s*"([^"]+)"(.*?proofData:\s*\{(.*?)\n    \}\s*\n  \})', match.group(1), re.DOTALL)
    
    for l_match in level_matches:
        level_id = l_match.group(1)
        name = l_match.group(2)
        proof_data_block = l_match.group(4)
        
        # given
        given_match = re.search(r'given:\s*\[(.*?)\]', proof_data_block, re.DOTALL)
        given_items = []
        if given_match:
            given_raw = given_match.group(1)
            given_items = [g.strip().strip('"').strip("'") for g in given_raw.split(',')]
            
        # prove
        prove_match = re.search(r'prove:\s*"([^"]+)"', proof_data_block)
        prove = prove_match.group(1) if prove_match else "Unknown"
        
        # steps
        steps_match = re.search(r'steps:\s*\[(.*?)\]\s*,', proof_data_block, re.DOTALL)
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
                    
        levels_data.append({
            "id": level_id,
            "name": name,
            "given": given_items,
            "prove": prove,
            "steps": steps
        })
        
    return levels_data

def generate_html(levels):
    html = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>The Chronicles of Euclid - Teacher Answer Key</title>
    <style>
        :root {
            --medieval-gold: #b8860b; 
            --earthy-brown: #5c4033; 
            --parchment: #fdfbf7; 
            --border-color: #8b5a2b;
            --accent-green: #4a5d23;
        }
        
        @import url('https://fonts.googleapis.com/css2?family=MedievalSharp&family=Alice&display=swap');
        
        body {
            font-family: 'Alice', serif;
            background-color: #eaddcf; 
            background-image: radial-gradient(circle at center, #f5ecd8 0%, #eaddcf 100%);
            color: #2c1e16;
            margin: 0;
            padding: 2rem;
            line-height: 1.5;
            font-size: 1.15rem; /* Larger base font size */
        }
        
        .container {
            max-width: 1200px; /* Wider to accommodate columns */
            margin: 0 auto;
            background: var(--parchment);
            border: 4px double var(--border-color);
            border-radius: 8px;
            padding: 3rem 4rem;
            box-shadow: 0 10px 40px rgba(92, 64, 51, 0.4);
            position: relative;
        }
        
        .header-banner {
            text-align: center;
            margin-bottom: 2rem;
        }
        
        .header-banner img {
            max-width: 100%;
            height: auto;
            max-height: 200px;
            border-radius: 8px;
            border: 3px solid var(--border-color);
            box-shadow: 0 5px 15px rgba(0,0,0,0.3);
            object-fit: cover;
        }
        
        h1, h2, h3 {
            font-family: 'MedievalSharp', cursive;
            color: var(--earthy-brown);
            text-align: center;
        }
        
        h1 {
            font-size: 3rem;
            text-transform: uppercase;
            letter-spacing: 3px;
            border-bottom: 2px solid var(--medieval-gold);
            padding-bottom: 0.5rem;
            margin-top: 1rem;
            margin-bottom: 1.5rem;
            font-weight: 700;
        }
        
        h2 {
            font-size: 2.2rem;
            margin-top: 2rem;
            margin-bottom: 2rem;
            border-bottom: 1px dashed var(--border-color);
            padding-bottom: 0.5rem;
        }
        
        .tutorial-box {
            background: rgba(184, 134, 11, 0.05);
            border: 2px solid var(--medieval-gold);
            padding: 2rem;
            border-radius: 8px;
            margin-bottom: 3rem;
            box-shadow: inset 0 0 20px rgba(184, 134, 11, 0.05);
            display: flex;
            align-items: center;
            gap: 2rem;
        }
        
        .tutorial-content {
            flex: 1;
        }
        
        .tutorial-image {
            width: 200px;
            flex-shrink: 0;
            text-align: center;
        }
        
        .tutorial-image img {
            max-width: 100%;
            border-radius: 50%;
            border: 3px solid var(--border-color);
            box-shadow: 0 4px 10px rgba(0,0,0,0.2);
        }
        
        .tutorial-box h3 {
            color: var(--accent-green);
            margin-top: 0;
            text-align: left;
            border-bottom: 1px solid rgba(74, 93, 35, 0.3);
            padding-bottom: 0.5rem;
            font-size: 1.8rem;
        }
        
        .standards-box {
            background: rgba(74, 93, 35, 0.05);
            border-left: 5px solid var(--accent-green);
            padding: 1rem 1.5rem;
            margin: 1.5rem 0;
            font-size: 1.05rem;
        }
        
        /* Two-column layout for levels to save pages */
        .levels-grid {
            column-count: 2;
            column-gap: 2rem;
            margin-top: 2rem;
        }
        
        .level-card {
            background: white;
            border: 2px solid rgba(139, 90, 43, 0.4);
            padding: 1.5rem;
            margin-bottom: 2rem;
            border-radius: 6px;
            box-shadow: 0 4px 10px rgba(0,0,0,0.05);
            
            /* CRITICAL FOR PRINTING: Page Breaks */
            break-inside: avoid;
            page-break-inside: avoid;
            display: inline-block; /* Forces block not to split in columns */
            width: 100%;
            box-sizing: border-box;
        }
        
        .level-header {
            font-size: 1.6rem;
            font-weight: bold;
            color: var(--earthy-brown);
            margin-bottom: 0.8rem;
            font-family: 'MedievalSharp', cursive;
            text-align: center;
            border-bottom: 1px solid rgba(139, 90, 43, 0.2);
            padding-bottom: 0.5rem;
        }
        
        .given-prove {
            margin-bottom: 1rem;
            padding: 0.8rem 1rem;
            background: rgba(92, 64, 51, 0.04);
            border-left: 4px solid var(--medieval-gold);
            border-radius: 0 4px 4px 0;
            font-size: 1.1rem;
        }
        
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 1.1rem; /* Larger font for table */
        }
        
        th, td {
            border: 1px solid rgba(139, 90, 43, 0.3);
            padding: 0.6rem 0.8rem; /* Condensed padding */
            text-align: left;
            vertical-align: top;
        }
        
        th {
            background: rgba(184, 134, 11, 0.1);
            color: var(--earthy-brown);
            font-family: 'MedievalSharp', cursive;
            font-weight: bold;
            font-size: 1.2rem;
        }
        
        /* Print Styles - Ensure perfect printing */
        @media print {
            @page {
                size: letter;
                margin: 0.5in;
            }
            body {
                background: white !important;
                padding: 0;
                margin: 0;
                font-size: 12pt; /* Point sizes work better for print */
            }
            .container {
                box-shadow: none;
                border: none;
                padding: 0;
                max-width: 100%;
            }
            .header-banner {
                display: none; /* Save ink */
            }
            h1 {
                font-size: 24pt;
                margin-top: 0;
            }
            .tutorial-box {
                border: 2px solid #ccc;
                background: #fafafa !important;
                break-inside: avoid;
                gap: 1rem;
            }
            .levels-grid {
                column-count: 2;
                column-gap: 1.5rem;
            }
            .level-card {
                break-inside: avoid;
                page-break-inside: avoid;
                border: 1px solid #ccc;
                box-shadow: none;
                margin-bottom: 15px;
                padding: 1rem;
            }
            table {
                font-size: 11pt;
            }
            th, td {
                padding: 0.4rem;
            }
            th {
                background: #f0f0f0 !important;
            }
            .given-prove {
                background: #f9f9f9 !important;
                border-left: 3px solid #666;
            }
            /* Force page break before H2s if needed */
            h2.print-break-before {
                page-break-before: always;
                break-before: page;
            }
        }
        
        /* Mobile fallback for grid */
        @media (max-width: 800px) {
            .levels-grid {
                column-count: 1;
            }
            .tutorial-box {
                flex-direction: column;
            }
        }
    </style>
</head>
<body>

<div class="container">
    <div class="header-banner">
        <img src="Images/CastleTitle.jpg" alt="The Chronicles of Euclid Castle">
    </div>
    
    <h1>The Chronicles of Euclid</h1>
    <h2>Teacher Answer Key & Guide</h2>
    
    <div class="tutorial-box">
        <div class="tutorial-image">
            <img src="Images/SageCharacter.png" alt="The Royal Sage">
            <div style="font-family: 'MedievalSharp', cursive; margin-top: 0.5rem; font-weight: bold; color: var(--earthy-brown);">The Royal Sage</div>
        </div>
        <div class="tutorial-content">
            <h3>Classroom Walkthrough & Tutorial</h3>
            <p>Welcome to <strong>The Chronicles of Euclid</strong>! This interactive Geometry Proof Quest is designed to help students master geometric proofs through an engaging, medieval narrative. Students act as the Royal Heir to the Kingdom of Euclid. The kingdom is suffering from "Logical Decay." To rebuild infrastructure, students must complete two-column proofs.</p>
            
            <div class="standards-box">
                <strong>Common Core State Standards (CCSS) Aligned:</strong>
                <ul style="margin-top: 0.5rem; margin-bottom: 0;">
                    <li><strong>HSG.CO.C.9:</strong> Prove theorems about lines and angles.</li>
                    <li><strong>HSG.CO.C.10:</strong> Prove theorems about triangles.</li>
                    <li><strong>HSG.SRT.B.4:</strong> Prove theorems about similarity.</li>
                    <li><strong>HSG.SRT.B.5:</strong> Use congruence and similarity criteria for triangles.</li>
                </ul>
            </div>
            
            <p><strong>Gameplay Loop & Mechanics:</strong></p>
            <ol>
                <li>Students select a region and choose a node on the map to restore.</li>
                <li>They read a short scenario and make a leadership choice.</li>
                <li>They enter the <strong>Proof Table</strong> to complete the geometric proof.</li>
                <li><strong>Hint System:</strong> If students get stuck, they can click "Seek Wisdom" for a helpful nudge.</li>
            </ol>
            
            <p style="margin-bottom: 0;"><strong>Premium Access:</strong> The first 5 levels are free. To unlock the remaining 15 levels, provide students with the password: <strong style="font-size:1.3rem; color:#3b1d00;">MathI5Fun</strong>. <em>(Please do not distribute this password outside of your own classroom!)</em></p>
        </div>
    </div>

    <h2 class="print-break-before">Complete Proof Answer Key</h2>
    
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

    html += """
    </div>
</div>
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
    
    output_path = os.path.join(os.path.dirname(__file__), 'AnswerKey.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(html_content)
        
    print(f"Successfully generated {output_path} with {len(levels)} levels.")

if __name__ == "__main__":
    main()
