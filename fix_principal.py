import re

with open('src/views/principal.vue', 'r', encoding='utf-8') as f:
    content = f.read()

# Extract body content
body_match = re.search(r'<body([^>]*)>(.*?)</body>', content, re.DOTALL | re.IGNORECASE)
if body_match:
    body_attrs = body_match.group(1)
    body_content = body_match.group(2)
else:
    body_attrs = ''
    body_content = content

# Extract style content
style_match = re.search(r'<style>(.*?)</style>', content, re.DOTALL | re.IGNORECASE)
style_content = style_match.group(1) if style_match else ''

vue_component = f"""<template>
<div{body_attrs}>
{body_content}
</div>
</template>

<style>
{style_content}
</style>
"""

with open('src/views/principal.vue', 'w', encoding='utf-8') as f:
    f.write(vue_component)

print("principal.vue fixed")
