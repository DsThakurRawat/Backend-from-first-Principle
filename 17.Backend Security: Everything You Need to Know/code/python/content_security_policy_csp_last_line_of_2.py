import bleach

ALLOWED_TAGS = ['p', 'b', 'i', 'em', 'strong', 'a', 'ul', 'ol', 'li']
ALLOWED_ATTRS = {'a': ['href']}

def sanitise_comment(raw_html: str) -> str:
    # Strip ALL tags not in allow-list, strip dangerous attributes
    return bleach.clean(
        raw_html,
        tags=ALLOWED_TAGS,
        attributes=ALLOWED_ATTRS,
        strip=True  # strip disallowed, don't escape
    )

# <script>...</script> → stripped entirely
# <b>bold</b> → kept
# <img onerror="..."> → attribute stripped
