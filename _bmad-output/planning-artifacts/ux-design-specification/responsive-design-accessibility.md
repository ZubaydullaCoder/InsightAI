# Responsive Design & Accessibility

## Responsive Strategy

Mahalla Ovozi is a **desktop-primary internal tool**. The primary usage context is a 1920×1080 monitor in the hokim’s office or a district staff workstation. A hard minimum width of `1024px` is enforced — no mobile or small-screen layout is defined or required for the MVP pilot.

Rather than mobile-first, the product uses a **desktop-first, range-optimized** approach. The five-lane layout is the canonical design. Narrower desktop viewports (1024–1279px) receive condensed variants; wider viewports (≥1440px) receive expanded variants.

| Viewport Range | Strategy |
|---|---|
| `< 1024px` | Hard block: *“Mahalla Ovozi faqat kompyuter ekranida ishlaydi”* centered message, app shell hidden |
| `1024px – 1279px` | Condensed: drawer `340px`, card padding `10px 12px`, filter chips compressed |
| `1280px – 1439px` | Standard: all specs at documented defaults |
| `≥ 1440px` | Expanded: drawer `380px`, lane column `min-width: 220px` |
| `≥ 1920px` | Wide: lane columns expand proportionally, no horizontal scroll |

## Breakpoint Strategy

**Single functional breakpoint** (desktop-range only):

```css
/* Standard: 1280px–1439px (default) */

/* Condensed: 1024px–1279px */
@media (max-width: 1279px) {
  .drawer { width: 340px; }
  .signal-card { padding: 10px 12px; }
}

/* Expanded: ≥1440px */
@media (min-width: 1440px) {
  .drawer { width: 380px; }
  .lane-column { min-width: 220px; }
}

/* Hard minimum enforcement */
@media (max-width: 1023px) {
  .app-shell { display: none; }
  .unsupported-msg { display: flex; }
}
```

No tablet or mobile breakpoints are defined. If the pilot reveals tablet use (e.g., iPad in a field office), this becomes a Phase 2 scope item.

## Accessibility Strategy

**Target compliance: WCAG 2.1 Level AA** — the standard for government and institutional digital tools.

### Contrast Pairs (all pre-validated in Step 8)

| Pair | Ratio | AA |
|---|---|---|
| `#1A1714` text on `#FAFAF9` | 18.2:1 | ✅ |
| `#6B6560` secondary on `#FAFAF9` | 5.9:1 | ✅ |
| `#4F46A8` primary on `#FFFFFF` | 7.2:1 | ✅ |
| `#991B1B` Шикоят text on `#FEE2E2` | 5.1:1 | ✅ |
| `#075985` Савол text on `#E0F2FE` | 5.3:1 | ✅ |
| `#166534` Ташаккур text on `#DCFCE7` | 5.8:1 | ✅ |
| `#D97706` delay accent on `#FFFBEB` | 3.1:1 | ✅ (large text) |

### Keyboard Navigation

| Target | Implementation |
|---|---|
| Signal cards | `tabIndex={0}`, Enter/Space triggers `onClick` |
| Lane columns | `role="feed"` + `aria-label` (category Uzbek Cyrillic name) |
| Filter chips | Native `<button>` elements — keyboard accessible by default |
| Mahalla `Select` | AntD `Select` — keyboard accessible by default |
| Drawer close | `<button aria-label="Yopish">` |
| Escape to close | `document.addEventListener('keydown', e => e.key === 'Escape' && closeDrawer())` |
| Focus trap | Not applied — drawer is an overlay, not a modal; trapping would prevent lane access |

### Screen Reader ARIA Spec

| Element | ARIA |
|---|---|
| `<LaneColumn>` | `role="feed"` + `aria-label="{categoryName}"` |
| `<SignalCard>` | `role="article"` + `aria-label="{senderName}, {mahalla}, {relativeTime}"` |
| Tone badge | `aria-hidden="true"` (visual only; info in card aria-label) |
| Hokim star | `aria-hidden="true"` (decorative) |
| Drawer | AntD `Drawer` ships with `role="dialog"` + `aria-modal` |
| Delay banner | AntD `Alert` ships with `role="alert"` |
| Loading lane | `aria-busy="true"` on `<LaneColumn>` during skeleton state |

### Touch Target Sizes

Not applicable for MVP (desktop-only, mouse input). If tablet support is added in Phase 2, all interactive elements must meet the 44×44px minimum touch target requirement.

## Testing Strategy

**Responsive testing:**
- Chrome DevTools device emulation at 1024px, 1280px, 1440px, 1920px
- Real-device test on the hokim’s actual workstation browser (Chrome on Windows — confirm at pilot kickoff)
- Verify lane column min-width enforcement prevents horizontal overflow at 1024px

**Accessibility testing:**
- Automated: `axe-core` via `@axe-core/react` in development mode (console warnings)
- Manual keyboard: tab through all interactive elements, confirm Escape closes drawer, confirm no unintended focus trap
- Contrast: spot-check with Chrome DevTools accessibility tree
- Screen reader: NVDA on Windows + Chrome (most common in CIS government environments)

**Accepted pilot limitations:**
- No RTL support — Uzbek Cyrillic is LTR
- No high-contrast OS mode support in MVP
- No `prefers-reduced-motion` support in MVP (drawer animation always plays)

## Implementation Guidelines

**Responsive layout:**
- CSS custom properties for all token values — no hardcoded px breakpoints scattered across components.
- `<LaneGrid>` is the sole owner of grid layout logic — no breakpoint logic inside `<LaneColumn>` or `<SignalCard>`.
- The `<1024px` unsupported-screen message is a CSS `@media` block only — no JavaScript required.

**Accessibility implementation:**
- Never override AntD focus styles with `outline: none`. If custom styles are needed, replace with `outline: 2px solid {colorPrimary}; outline-offset: 2px`.
- `aria-label` on `<SignalCard>` must be computed in English as a fallback (for screen readers in English mode) alongside Uzbek Cyrillic display content. This is the only location where English strings may appear in component code.

---
