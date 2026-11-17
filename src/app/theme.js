import { StyleSheet } from 'react-native';

export default StyleSheet.create({
  // =====================================================================================================
   SITE THEME — the one file that colours the whole site.

   Edit the colours in section 1 and everything follows: page backgrounds, cards, borders, text,
   buttons, hover states, glows, the helicopter tour's UI and helipads, and the 3D project galaxy.
   Any CSS colour works (#hex, rgb(), hsl(), named colours).

   Section 2 is built from section 1 automatically — you normally never need to touch it.
   (The tour's 3D landscape — sky, grass, mountains, trees — keeps its natural colours on purpose.)
   =====================================================================================================
  ':root': {
    // --- 1. YOUR COLOURS --------------------------------------------------------------------------
    'Primary': '#0B0D17',
    // main background
    'Secondary': '#8B5CF6',
    // accent: buttons, links, active tabs, highlights, glows
    'Light': '#F8FAFC',
    // text and light accents
    'Hover': '#704ac7',
    // hover / focus accent
    // Status colours (optional)
    'Success': '#6EE7B7',
    // "land" buttons, success ticks
    'Highlight': '#F2B84B',
    // "featured" badges, tour telemetry
    'Danger': '#EF5A42',
    // crash warnings
    // --- 2. DERIVED SHADES (built from section 1) -------------------------------------------------
    // Neutral ladder: the light colour blended into the background.
     Low numbers = raised surfaces and borders, middle = muted text, high = body text.
    'N02': 'color-mix(in srgb, var(--light) 2%, var(--primary))',
    'N04': 'color-mix(in srgb, var(--light) 4%, var(--primary))',
    'N06': 'color-mix(in srgb, var(--light) 6%, var(--primary))',
    'N08': 'color-mix(in srgb, var(--light) 8%, var(--primary))',
    'N10': 'color-mix(in srgb, var(--light) 10%, var(--primary))',
    'N13': 'color-mix(in srgb, var(--light) 13%, var(--primary))',
    'N16': 'color-mix(in srgb, var(--light) 16%, var(--primary))',
    'N20': 'color-mix(in srgb, var(--light) 20%, var(--primary))',
    'N25': 'color-mix(in srgb, var(--light) 25%, var(--primary))',
    'N30': 'color-mix(in srgb, var(--light) 30%, var(--primary))',
    'N38': 'color-mix(in srgb, var(--light) 38%, var(--primary))',
    'N45': 'color-mix(in srgb, var(--light) 45%, var(--primary))',
    'N52': 'color-mix(in srgb, var(--light) 52%, var(--primary))',
    'N60': 'color-mix(in srgb, var(--light) 60%, var(--primary))',
    'N68': 'color-mix(in srgb, var(--light) 68%, var(--primary))',
    'N76': 'color-mix(in srgb, var(--light) 76%, var(--primary))',
    'N84': 'color-mix(in srgb, var(--light) 84%, var(--primary))',
    'N92': 'color-mix(in srgb, var(--light) 92%, var(--primary))',
    // Accent tints on the background: selected chips, accent-tinted panels and gradients.
    'A06': 'color-mix(in srgb, var(--secondary) 6%, var(--primary))',
    'A10': 'color-mix(in srgb, var(--secondary) 10%, var(--primary))',
    'A16': 'color-mix(in srgb, var(--secondary) 16%, var(--primary))',
    'A22': 'color-mix(in srgb, var(--secondary) 22%, var(--primary))',
    'A30': 'color-mix(in srgb, var(--secondary) 30%, var(--primary))',
    'A40': 'color-mix(in srgb, var(--secondary) 40%, var(--primary))',
    'A55': 'color-mix(in srgb, var(--secondary) 55%, var(--primary))',
    // Lighter accents: the second gradient stop, soft labels, pale highlights.
    'Accent2': 'color-mix(in srgb, var(--secondary) 45%, var(--light))',
    'AccentSoft': 'color-mix(in srgb, var(--secondary) 60%, var(--light))',
    'AccentPale': 'color-mix(in srgb, var(--secondary) 22%, var(--light))',
    // Status shades.
    'Success12': 'color-mix(in srgb, var(--success) 12%, var(--primary))',
    'Success22': 'color-mix(in srgb, var(--success) 22%, var(--primary))',
    'Success35': 'color-mix(in srgb, var(--success) 35%, var(--primary))',
    'SuccessLight': 'color-mix(in srgb, var(--success) 45%, var(--light))',
    'Highlight12': 'color-mix(in srgb, var(--highlight) 12%, var(--primary))',
    'Highlight45': 'color-mix(in srgb, var(--highlight) 45%, var(--primary))',
    'HighlightLight': 'color-mix(in srgb, var(--highlight) 45%, var(--light))',
    'Danger20': 'color-mix(in srgb, var(--danger) 20%, var(--primary))',
    'DangerLight': 'color-mix(in srgb, var(--danger) 30%, var(--light))',
    // Project tones — each project's colour on helipads, autopilot chips and galaxy planets.
    'Tone0': 'color-mix(in srgb, var(--secondary) 35%, var(--light))',
    'Tone1': 'color-mix(in srgb, var(--secondary) 55%, var(--light))',
    'Tone2': 'color-mix(in srgb, var(--hover) 40%, var(--light))',
    'Tone3': 'color-mix(in srgb, var(--secondary) 25%, var(--light))',
    'Tone4': 'color-mix(in srgb, var(--hover) 60%, var(--light))',
    'Tone5': 'color-mix(in srgb, var(--secondary) 45%, var(--light))',
    'Tone6': 'color-mix(in srgb, var(--hover) 28%, var(--light))',
    'Tone7': 'color-mix(in srgb, var(--secondary) 65%, var(--light))',
    // Names used throughout the site's CSS.
    'Background': 'var(--primary)',
    'Foreground': 'var(--light)',
    'Violet': 'var(--secondary)',
    'Accent': 'var(--accent-2)',
    'Muted': 'var(--n-76)'
  }
});
