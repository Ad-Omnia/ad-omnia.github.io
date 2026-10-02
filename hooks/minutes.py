import html
import re
import shutil
from datetime import date
from pathlib import Path

MINUTE_FILE = re.compile(r"^minutes/(\d{4})-(\d{2})-(\d{2})_Minute(\d+)_[^/]+\.md$")
PARTICIPANT = re.compile(r"^-\s+(.+?)\s+(\d+)\s*$")
WHEN = re.compile(r"on\s+(\d{2}/\d{2}/\d{4})\s+at\s+(\d{1,2}:\d{2})")
PLACEHOLDER = "<!-- minutes -->"
DOWNLOADABLE = re.compile(r"^(milestones|minutes)/.+\.md$")
SKIPPED = re.compile(r"(^|/)(index|[^/]*-soon|0000-[^/]*)\.md$")
sources = {}


def sections(markdown):
    found = {}
    for chunk in re.split(r"^## ", markdown, flags=re.M)[1:]:
        title, _, body = chunk.partition("\n")
        found[title.strip().lower()] = body
    return found


def bullets(body):
    return [line[2:].strip() for line in body.splitlines() if line.startswith("- ")]


def parse(markdown):
    parts = sections(markdown)
    participants = []
    for line in parts.get("participants", "").splitlines():
        match = PARTICIPANT.match(line.strip())
        if match:
            participants.append({"name": match.group(1), "id": match.group(2)})
    when = WHEN.search(parts.get("date and time", ""))
    return {
        "participants": participants,
        "when": " · ".join(filter(None, [pretty(when.group(1)), when.group(2)])) if when else "",
        "topics": bullets(parts.get("topics of discussion", "")),
    }


def pretty(day):
    d, m, y = (int(x) for x in day.split("/"))
    return short(date(y, m, d))


def short(day):
    return f"{day.day} {day.strftime('%b %Y')}"


def without_sidebar_sections(markdown):
    return re.sub(r"^## (?:Participants|Date and Time)\n.*?(?=^## |\Z)", "", markdown, flags=re.M | re.S)


def minute_files(docs_dir):
    found = []
    for path in Path(docs_dir, "minutes").glob("*.md"):
        src = f"minutes/{path.name}"
        match = MINUTE_FILE.match(src)
        if match and match.group(1) != "0000":
            day = date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
            found.append((day, int(match.group(4)), src))
    return sorted(found)


def on_config(config, **kwargs):
    for item in config["nav"] or []:
        if isinstance(item, dict) and "Minutes" in item:
            entries = [{f"Minute {number} · {short(day)}": src} for day, number, src in minute_files(config["docs_dir"])]
            item["Minutes"] = ["minutes/index.md"] + entries
    return config


def on_pre_build(config, **kwargs):
    sources.clear()


def on_page_markdown(markdown, page, config, files, **kwargs):
    src = page.file.src_uri
    if DOWNLOADABLE.match(src) and not SKIPPED.search(src) and "downloads" not in page.meta:
        page.meta["downloads"] = [{"label": "Markdown", "href": src}]
        sources[src] = page.file.abs_src_path
    match = MINUTE_FILE.match(src)
    if match and match.group(1) != "0000":
        page.meta["minute"] = parse(markdown)
        return without_sidebar_sections(markdown)
    if src == "minutes/index.md" and PLACEHOLDER in markdown:
        return markdown.replace(PLACEHOLDER, index(files))
    return markdown


def index(files):
    minutes = []
    for file in files:
        match = MINUTE_FILE.match(file.src_uri)
        if not match or match.group(1) == "0000":
            continue
        info = parse(Path(file.abs_src_path).read_text(encoding="utf-8"))
        day = date(int(match.group(1)), int(match.group(2)), int(match.group(3)))
        minutes.append((day, int(match.group(4)), Path(file.src_uri).name, info))
    minutes.sort(key=lambda item: (item[0], item[1]), reverse=True)

    out = ['<div class="ad-hub" markdown="1">']
    month = None
    for day, number, name, info in minutes:
        label = day.strftime("%B %Y")
        if label != month:
            if month is not None:
                out.append("\n</div>\n")
            out.append(f'\n<div class="ad-hub-group" markdown="1">\n<p class="ad-hub-label"><span>{day.year}</span>{day.strftime("%B")}</p>\n')
            month = label
        topics = html.escape(", ".join(info["topics"]))
        out.append(f"[Minute {number}<span>{short(day)} · {topics}</span>]({name}){{ .ad-hub-card }}")
    if month is not None:
        out.append("\n</div>\n")
    out.append("</div>")
    return "\n".join(out)


def on_post_build(config, **kwargs):
    site = Path(config["site_dir"])
    for src, path in sources.items():
        target = site / src
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copyfile(path, target)
