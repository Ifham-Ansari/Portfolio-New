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

The editorial showcase uses native vertical scrolling, category filters, and a desktop project index. On mobile, projects become stacked visual stories. Skills use keyboard-accessible disclosure panels.

The near-black, violet, and ice-blue theme uses larger body text and controls. The hero's SVG network responds to mouse movement and scroll position without replacing the native cursor. Sections and project stories reveal on entering the viewport. The bottom-right pause control stops ambient animation.

A brief full-screen identity intro runs once per tab session, with a Skip button and Escape-key support. It dismisses automatically after approximately two seconds and is bypassed for reduced-motion preferences. It is an introduction, not a simulated loading progress indicator. System reduced-motion preferences also disable scroll reveals, ambient animations, and smooth scrolling.

Profile information is in `src/data/profile.ts`. Main layout styles are in `src/components/Portfolio.module.css`; project and visual styles have their own CSS modules. No backend or additional animation dependencies are required.
