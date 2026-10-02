import re
from pathlib import Path

from mkdocs.utils.meta import get_data

FOLDER = re.compile(r"^ms(\d+)-(.+)$")
HEADING = re.compile(r"^#\s+(.+?)\s*$", re.M)
PLACEHOLDER = "<!-- milestones -->"
COLOURS = ["ad-c-teal", "ad-c-blue", "ad-c-blue-violet", "ad-c-violet"]


def milestones(docs_dir):
    found = []
    for folder in Path(docs_dir, "milestones").iterdir():
        match = FOLDER.match(folder.name)
        if not folder.is_dir() or not match:
            continue
        pages = []
        for path in folder.glob("*.md"):
            body, meta = get_data(path.read_text(encoding="utf-8"))
            heading = HEADING.search(body)
            pages.append({
                "src": f"milestones/{folder.name}/{path.name}",
                "title": meta.get("title") or (heading.group(1) if heading else path.stem),
                "description": meta.get("description", ""),
                "order": meta.get("order", 999),
                "date": meta.get("date"),
                "soon": path.stem.endswith("-soon"),
            })
        if any(not page["soon"] for page in pages):
            pages = [page for page in pages if not page["soon"]]
        pages.sort(key=lambda page: (page["order"], page["title"]))
        name = match.group(2).replace("-", " ").title()
        found.append({"number": int(match.group(1)), "name": name, "folder": folder.name, "pages": pages})
    return sorted(found, key=lambda milestone: milestone["number"])


def on_config(config, **kwargs):
    for item in config["nav"] or []:
        if isinstance(item, dict) and "Milestones" in item:
            sections = []
            for milestone in milestones(config["docs_dir"]):
                pages = [{"Coming soon" if page["soon"] else page["title"]: page["src"]} for page in milestone["pages"]]
                if pages:
                    sections.append({f"MS{milestone['number']} - {milestone['name']}": pages})
            item["Milestones"] = ["milestones/index.md"] + sections
    return config


def on_page_markdown(markdown, page, config, **kwargs):
    if page.file.src_uri != "milestones/index.md" or PLACEHOLDER not in markdown:
        return markdown
    return markdown.replace(PLACEHOLDER, hub(config["docs_dir"]))


def hub(docs_dir):
    out = ['<div class="ad-hub" markdown="1">']
    for i, milestone in enumerate(milestones(docs_dir)):
        cards = []
        for page in milestone["pages"]:
            src = page["src"][len("milestones/"):]
            if page["soon"]:
                cards.append(f"[{milestone['name']}<span>Coming soon</span>]({src}){{ .ad-hub-card .ad-hub-card--soon }}")
            else:
                cards.append(f"[{page['title']}<span>{page['description']}</span>]({src}){{ .ad-hub-card }}")
        if not cards:
            continue
        out.append(f'\n<div class="ad-hub-group {COLOURS[i % len(COLOURS)]}" markdown="1">')
        out.append(f'<p class="ad-hub-label"><span>MS{milestone["number"]}</span>{milestone["name"]}</p>\n')
        out.extend(cards)
        out.append("\n</div>")
    out.append("\n</div>")
    return "\n".join(out)
