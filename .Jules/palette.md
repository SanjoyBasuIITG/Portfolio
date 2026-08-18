## 2024-08-17 - Decorative SVGs inside links

**Learning:** When using `<svg>` elements inside anchor tags (`<a>`) alongside visible text (like a social media link or email address), screen readers will read both the text and try to interpret the SVG. If the SVG is purely decorative, this creates redundancy and noise for screen reader users.

**Action:** Always add `aria-hidden="true"` to purely decorative `<svg>` icons that accompany text inside links or buttons to ensure a cleaner and more concise screen reader experience.