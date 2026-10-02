import html
from datetime import date
from pathlib import Path

import milestones
import minutes

PLACEHOLDER = "<!-- journey -->"


def phases(docs_dir):
    found = []
    for milestone in milestones.milestones(docs_dir):
        docs = [page for page in milestone["pages"] if not page["soon"]]
        items = []
        for step, page in enumerate(docs, 1):
            items.append({
                "date": page["date"] if isinstance(page["date"], date) else None,
                "step": f"MS{milestone['number']} · Step {step}",
                "title": page["title"],
                "text": page["description"],
                "src": page["src"],
                "link": "Read document",
            })
        soon = None
        if not docs and milestone["pages"]:
            page = milestone["pages"][0]
            soon = {
                "date": None,
                "step": f"MS{milestone['number']}",
                "title": f"{milestone['name']} phase",
                "text": page["description"],
                "src": page["src"],
                "link": "Read document",
                "soon": True,
            }
        found.append({"name": milestone["name"], "items": items, "soon": soon})

    for day, number, src in minutes.minute_files(docs_dir):
        info = minutes.parse(Path(docs_dir, src).read_text(encoding="utf-8"))
        target = found[0] if found else None
        for phase in found:
            if any(item["date"] and item["date"] <= day for item in phase["items"]):
                target = phase
        if target is None:
            continue
        target["items"].append({
            "date": day,
            "step": f"Minute {number}",
            "title": f"Meeting {number}",
            "text": ", ".join(info["topics"]),
            "src": src,
            "link": "Read minute",
        })

    for phase in found:
        phase["items"].sort(key=lambda item: item["date"] or date.max)
        if phase["soon"]:
            phase["items"].append(phase["soon"])
    return found


def card(item, side, active):
    classes = f"ad-timeline-item ad-timeline-{side}" + (" ad-timeline-item--active" if active else "")
    when = "Coming soon" if item.get("soon") else (minutes.short(item["date"]) if item["date"] else "")
    return f'''<div class="{classes}" markdown="1">
<span class="ad-timeline-dot"></span>
<div class="ad-timeline-card" markdown="1">
<div class="ad-timeline-meta"><span class="ad-timeline-step">{item["step"]}</span><span>{when}</span></div>

### {item["title"]}

{html.escape(item["text"])}

[{item["link"]} →]({item["src"]}){{ .ad-timeline-link }}

</div>
</div>
'''


def timeline(docs_dir):
    found = phases(docs_dir)
    dated = [item for phase in found for item in phase["items"] if item["date"]]
    latest = max(dated, key=lambda item: item["date"]) if dated else None
    out = ['<div class="ad-timeline" markdown="1">\n']
    side = 0
    for phase in found:
        if not phase["items"]:
            continue
        out.append(f'<span class="ad-timeline-phase">{phase["name"]}</span>\n')
        for item in phase["items"]:
            out.append(card(item, "right" if side % 2 == 0 else "left", item is latest))
            side += 1
    out.append("</div>")
    return "\n".join(out)


def on_page_markdown(markdown, page, config, **kwargs):
    if page.file.src_uri != "journey.md" or PLACEHOLDER not in markdown:
        return markdown
    return markdown.replace(PLACEHOLDER, timeline(config["docs_dir"]))
