import os
import re
import subprocess
import shutil

def markdown_to_html(md_text):
    lines = md_text.splitlines()
    html_lines = []
    in_code_block = False
    in_list = False
    in_table = False

    for line in lines:
        stripped = line.strip()

        # Handle code blocks
        if stripped.startswith("```"):
            if in_code_block:
                html_lines.append("</code></pre>")
                in_code_block = False
            else:
                if in_list:
                    html_lines.append("</ul>")
                    in_list = False
                if in_table:
                    html_lines.append("</tbody></table>")
                    in_table = False
                html_lines.append("<pre><code>")
                in_code_block = True
            continue

        if in_code_block:
            # Escape HTML characters inside code blocks
            escaped = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
            html_lines.append(escaped)
            continue

        # Close list if line is not a list item
        if in_list and not stripped.startswith("- ") and not stripped.startswith("* "):
            html_lines.append("</ul>")
            in_list = False

        # Close table if line is not a table row
        if in_table and not stripped.startswith("|"):
            html_lines.append("</tbody></table>")
            in_table = False

        # Empty lines
        if not stripped:
            continue

        # Headers
        if stripped.startswith("### "):
            html_lines.append(f"<h3>{format_inline(stripped[4:])}</h3>")
            continue
        if stripped.startswith("## "):
            html_lines.append(f"<h2>{format_inline(stripped[3:])}</h2>")
            continue
        if stripped.startswith("# "):
            html_lines.append(f"<h1>{format_inline(stripped[2:])}</h1>")
            continue

        # Numbered list / section headers like "1. ", "14.1 "
        m_section = re.match(r"^(\d+(\.\d+)*)\s+(.*)$", stripped)
        if m_section and len(m_section.group(1)) <= 4 and not stripped.startswith("-"):
            sec_num = m_section.group(1)
            title = m_section.group(3)
            if "." not in sec_num:
                html_lines.append(f"<h2 class='sec-title'>{sec_num}. {format_inline(title)}</h2>")
            else:
                html_lines.append(f"<h3 class='subsec-title'>{sec_num} {format_inline(title)}</h3>")
            continue

        # Blockquote / Alert
        if stripped.startswith("> "):
            content = stripped[2:]
            html_lines.append(f"<div class='alert-box'>{format_inline(content)}</div>")
            continue

        # Lists
        if stripped.startswith("- ") or stripped.startswith("* "):
            if not in_list:
                html_lines.append("<ul>")
                in_list = True
            html_lines.append(f"<li>{format_inline(stripped[2:])}</li>")
            continue

        # Table rows
        if stripped.startswith("|") and stripped.endswith("|"):
            cells = [c.strip() for c in stripped[1:-1].split("|")]
            # Check if divider row
            if all(re.match(r"^:?-+:?$", c) for c in cells):
                continue
            if not in_table:
                html_lines.append("<table><thead><tr>")
                for c in cells:
                    html_lines.append(f"<th>{format_inline(c)}</th>")
                html_lines.append("</tr></thead><tbody>")
                in_table = True
            else:
                html_lines.append("<tr>")
                for c in cells:
                    html_lines.append(f"<td>{format_inline(c)}</td>")
                html_lines.append("</tr>")
            continue

        # Paragraph
        html_lines.append(f"<p>{format_inline(stripped)}</p>")

    if in_list:
        html_lines.append("</ul>")
    if in_table:
        html_lines.append("</tbody></table>")
    if in_code_block:
        html_lines.append("</code></pre>")

    return "\n".join(html_lines)

def format_inline(text):
    text = text.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
    # Bold **text**
    text = re.sub(r"\*\*(.+?)\*\*", r"<strong>\1</strong>", text)
    # Inline code `code`
    text = re.sub(r"`(.+?)`", r"<code>\1</code>", text)
    return text

def main():
    repo_root = r"c:\Users\ACER\Downloads\implementasi"
    md_file = os.path.join(repo_root, "docs", "INSTRUKSI_ANTIGRAVITY.md")
    html_file = os.path.join(repo_root, "docs", "INSTRUKSI_ANTIGRAVITY.html")
    pdf_file = os.path.join(repo_root, "docs", "INSTRUKSI_ANTIGRAVITY.pdf")
    brain_dir = r"C:\Users\ACER\.gemini\antigravity\brain\12de0f7a-953f-4f1e-be2b-cc4638dd80a3"

    with open(md_file, "r", encoding="utf-8") as f:
        md_text = f.read()

    body_html = markdown_to_html(md_text)

    full_html = f"""<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>SIAJAR - Instruksi Pengerjaan untuk Antigravity</title>
    <style>
        @page {{
            size: A4 portrait;
            margin: 15mm 12mm 15mm 12mm;
        }}
        body {{
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
            color: #0f172a;
            background-color: #ffffff;
            margin: 0;
            padding: 20px;
            font-size: 11px;
            line-height: 1.6;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
        }}
        .header {{
            border-bottom: 2px solid #2563eb;
            padding-bottom: 10px;
            margin-bottom: 20px;
        }}
        .header h1 {{
            margin: 0 0 4px 0;
            font-size: 20px;
            color: #1e3a8a;
        }}
        .header p {{
            margin: 0;
            color: #475569;
            font-size: 11px;
        }}
        h1 {{
            color: #1e3a8a;
            font-size: 16px;
            border-bottom: 1px solid #cbd5e1;
            padding-bottom: 4px;
            margin-top: 18px;
            margin-bottom: 8px;
        }}
        h2, .sec-title {{
            color: #1e40af;
            font-size: 14px;
            background: #f1f5f9;
            border-left: 4px solid #2563eb;
            padding: 6px 10px;
            margin-top: 16px;
            margin-bottom: 8px;
            border-radius: 0 4px 4px 0;
        }}
        h3, .subsec-title {{
            color: #0f172a;
            font-size: 12px;
            font-weight: 700;
            margin-top: 12px;
            margin-bottom: 6px;
            border-bottom: 1px dashed #e2e8f0;
            padding-bottom: 2px;
        }}
        p {{
            margin: 0 0 8px 0;
        }}
        ul {{
            margin: 0 0 10px 0;
            padding-left: 20px;
        }}
        li {{
            margin-bottom: 4px;
        }}
        code {{
            background: #f1f5f9;
            padding: 1px 4px;
            border-radius: 3px;
            font-family: Consolas, monospace;
            font-size: 10.5px;
            color: #0969da;
        }}
        pre {{
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 6px;
            padding: 8px 12px;
            font-size: 10px;
            overflow-x: auto;
            margin: 8px 0;
        }}
        .alert-box {{
            background: #eff6ff;
            border-left: 3px solid #3b82f6;
            padding: 8px 12px;
            border-radius: 0 6px 6px 0;
            margin: 10px 0;
            color: #1e40af;
        }}
        table {{
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
            font-size: 10.5px;
        }}
        th {{
            background: #f8fafc;
            border: 1px solid #cbd5e1;
            padding: 6px 8px;
            text-align: left;
            font-weight: 600;
        }}
        td {{
            border: 1px solid #e2e8f0;
            padding: 5px 8px;
            vertical-align: top;
        }}
        tr:nth-child(even) td {{
            background: #fbfcfd;
        }}
        .footer {{
            text-align: center;
            font-size: 9.5px;
            color: #64748b;
            margin-top: 30px;
            padding-top: 10px;
            border-top: 1px solid #e2e8f0;
        }}
    </style>
</head>
<body>
    <div class="header">
        <h1>SIAJAR — Dokumen Asli Instruksi dan Spesifikasi Pengerjaan</h1>
        <p>Universitas Islam Riau • Sumber Instruksi Utama Pengembangan LMS SIAJAR (Fase 0 – Fase 7)</p>
    </div>

    {body_html}

    <div class="footer">
        Dokumen Instruksi Antigravity LMS SIAJAR • Arsip Resmi Spesifikasi Sistem
    </div>
</body>
</html>
"""

    with open(html_file, "w", encoding="utf-8") as f:
        f.write(full_html)
    print(f"HTML berhasil dibuat di {html_file}")

    # Generate PDF with Edge
    edge_paths = [
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ]
    edge_bin = next((p for p in edge_paths if os.path.exists(p)), None)

    if edge_bin:
        cmd = [
            edge_bin,
            "--headless",
            "--disable-gpu",
            "--run-all-compositor-stages-before-draw",
            f"--print-to-pdf={pdf_file}",
            html_file
        ]
        res = subprocess.run(cmd, capture_output=True, text=True)
        if res.returncode == 0:
            print(f"PDF berhasil dibuat di {pdf_file}")
        else:
            print("Gagal membuat PDF:", res.stderr)
    else:
        print("Microsoft Edge tidak ditemukan.")

    # Copy files to brain artifact directory
    if os.path.exists(brain_dir):
        shutil.copy2(md_file, os.path.join(brain_dir, "INSTRUKSI_ANTIGRAVITY.md"))
        shutil.copy2(html_file, os.path.join(brain_dir, "INSTRUKSI_ANTIGRAVITY.html"))
        if os.path.exists(pdf_file):
            shutil.copy2(pdf_file, os.path.join(brain_dir, "INSTRUKSI_ANTIGRAVITY.pdf"))
        print("Seluruh berkas berhasil disalin ke folder artifact brain.")

if __name__ == "__main__":
    main()
