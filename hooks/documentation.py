import re
from pathlib import Path

from mkdocs.utils.meta import get_data

FOLDER = "documentation"
HEADING = re.compile(r"^#\s+(.+?)\s*$", re.M)
PLACEHOLDER = "<!-- documentation -->"
COLOURS = ["ad-c-teal", "ad-c-blue", "ad-c-violet"]


def documents(docs_dir):
    """Pages in docs/documentation/, read from their front-matter.

    Front-matter keys: title, description, group (hub section), order.
    A page with `draft: true` is left out of the nav, the hub and the build.
    """
    found = []
    folder = Path(docs_dir, FOLDER)
    if not folder.is_dir():
        return found
    for path in folder.glob("*.md"):
        body, meta = get_data(path.read_text(encoding="utf-8"))
        heading = HEADING.search(body)
        found.append({
            "src": f"{FOLDER}/{path.name}",
            "title": meta.get("title") or (heading.group(1) if heading else path.stem),
            "nav": meta.get("nav_title") or meta.get("title") or (heading.group(1) if heading else path.stem),
            "description": meta.get("description", ""),
            "group": meta.get("group", "Documents"),
            "order": meta.get("order", 999),
            "draft": bool(meta.get("draft")),
        })
    found.sort(key=lambda doc: (doc["order"], doc["title"]))
    return found


def on_config(config, **kwargs):
    for item in config["nav"] or []:
        if isinstance(item, dict) and "Documentation" in item:
            hub = item["Documentation"]
            if isinstance(hub, list):
                hub = next(iter(hub[0].values())) if isinstance(hub[0], dict) else hub[0]
            pages = [{doc["nav"]: doc["src"]} for doc in documents(config["docs_dir"]) if not doc["draft"]]
            item["Documentation"] = [{"Overview": hub}] + pages
    return config


def on_files(files, config, **kwargs):
    hidden = {doc["src"] for doc in documents(config["docs_dir"]) if doc["draft"]}
    for file in list(files):
        if file.src_uri in hidden:
            files.remove(file)
    return files


def on_page_markdown(markdown, page, config, **kwargs):
    if PLACEHOLDER not in markdown:
        return markdown
    return markdown.replace(PLACEHOLDER, hub(config["docs_dir"], page.file.src_uri))


def hub(docs_dir, src_uri):
    base = Path(src_uri).parent
    groups = {}
    for doc in documents(docs_dir):
        if not doc["draft"]:
            groups.setdefault(doc["group"], []).append(doc)
    out = ['<div class="ad-hub" markdown="1">']
    for i, (name, docs) in enumerate(groups.items()):
        out.append(f'\n<div class="ad-hub-group {COLOURS[i % len(COLOURS)]}" markdown="1">')
        out.append(f'<p class="ad-hub-label"><span>{len(docs):02d}</span>{name}</p>\n')
        for doc in docs:
            link = Path(doc["src"]).relative_to(base).as_posix() if base != Path(".") else doc["src"]
            out.append(f"[{doc['title']}<span>{doc['description']}</span>]({link}){{ .ad-hub-card }}")
        out.append("\n</div>")
    if not groups:
        out.append('<p class="ad-hub-intro">No documents yet.</p>')
    out.append("\n</div>")
    return "\n".join(out)
