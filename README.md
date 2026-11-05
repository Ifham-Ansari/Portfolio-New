# Ifham Ansari portfolio

## Local development

```powershell
npm install
npm run dev
```

Open the local URL printed in the terminal.

## Static build and Netlify

```powershell
npm run lint
npm run build
```

Next.js exports the site to `out/`. The existing Netlify site can use the build command and publish directory in `netlify.toml`; this project does not deploy automatically.

Project descriptions, categories, image names, and links live in `src/data/portfolio-projects.ts`. Screenshots are in `public/images/projects/`. A GitHub profile is labeled separately when no project-specific repository is known. Some historical project links may be offline and should be verified before sharing.

## Presentation and accessibility

The desktop hero assembles into a three-node pipeline over 175vh of additional scroll. Toolkit chips assemble into four groups, the experience timeline draws with the scroll, and the project section translates vertical scrolling into a pinned horizontal gallery. Category filters preserve the original order and content. Previous/Next buttons, Arrow keys, Home/End, and Tab navigation expose every project. On small or short viewports, projects return to the original vertical stories; skill disclosures remain keyboard-accessible.

The near-black, violet, and ice-blue theme uses larger body text and controls. The hero's SVG network responds to mouse movement and scroll position without replacing the native cursor. Sections and project stories reveal on entering the viewport. The bottom-right pause control stops ambient animation.

A brief full-screen identity intro runs once per tab session, with a Skip button and Escape-key support. It dismisses automatically after approximately two seconds and is bypassed for reduced-motion preferences. It is an introduction, not a simulated loading progress indicator. System reduced-motion preferences also disable scroll reveals, ambient animations, and smooth scrolling.

Profile information is in `src/data/profile.ts`. Main layout styles are in `src/components/Portfolio.module.css`; project and visual styles have their own CSS modules. No backend is required.

## Scroll animation modules

Added libraries: **GSAP** (including its bundled **ScrollTrigger**) and **Lenis**. Framer Motion and the existing Next.js/MUI stack are retained. `ScrollDirector.tsx` loads animation code only when motion is enabled. All timelines, pin spacers, listeners, ticker callbacks, pointer decorations, and text splits are cleaned up when preferences or breakpoints change.

- `src/animations/runtime.ts`: Lenis/ticker integration, breakpoint lifecycle, filter refresh.
- `hero.ts`: split headline, node assembly, SVG connector drawing and pulses.
- `toolkit.ts`: deterministic scattered-chip assembly.
- `gallery.ts`: pinning, horizontal travel, counter, parallax, keyboard/focus handling.
- `experience.ts`: timeline, staggered responsibilities, legal data count-ups.
- `details.ts`: About, Education, recognition, and Contact reveals.
- `pointer.ts`: optional desktop cursor ring, spotlight, and magnetic contact action. The native cursor is preserved.
- `scroll.css`: progressive-enhancement styling; default layouts remain usable without JavaScript.

### Tune timing and scroll length

Edit `src/animations/settings.ts`:

| Setting | Default | Effect |
| --- | --- | --- |
| `heroScroll` | `1.75` | Extra viewport heights for hero pin (1.5–2 recommended). |
| `scrub` | `0.65` | Seconds for scroll animations to catch up. |
| `galleryPixelsPerCard` | `0.75` | Viewport heights per project transition. |
| `smoothDuration` | `0.9` | Lenis smoothing duration in seconds. |
| `revealDuration` | `0.75` | Heading reveal duration in seconds. |
| `desktopQuery` | 1024px wide / 600px tall | Minimum viewport for pinned scenes; compact layouts support typical laptop browser heights. |

Reduced motion and the pause control restore static content and remove pins and smooth scrolling. Count-ups retain accessible final values. Most animation uses transform/opacity; SVG connector dash offset is the explicit line-drawing exception. Node haze uses a static blurred layer with animated opacity, not an animated blur radius. Run `npm run lint`, `npx tsc --noEmit`, and `npm run build` before publishing `out` to the existing Netlify site.
