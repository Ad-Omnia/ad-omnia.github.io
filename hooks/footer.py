def top(item):
    while item.parent is not None:
        item = item.parent
    return item


def on_page_context(context, page, config, nav, **kwargs):
    section = top(page)
    if page.previous_page is not None and top(page.previous_page) is not section:
        page.previous_page = None
    if page.next_page is not None and top(page.next_page) is not section:
        page.next_page = None
    return context
