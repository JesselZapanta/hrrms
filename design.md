# HRRMS – Design System

Design language for the **Human Resource Records Management System (HRRMS)** — City Council Office, LGU Ozamiz.

Inspired by the **Asenso Ozamiz** mark and the physical 201-folder filing system: official, calm, archive-like — not generic SaaS.

## 1. Color Palette

| Token | Hex | Usage |
|-------|-----|-------|
| `navy` | `#1B2C63` | Primary / sidebar / headers |
| `deep-orange` | `#E85B18` | CTAs, accents, active states, focus |
| `warm-paper` | `#FAF8F4` | Background — reads like a folder, not generic gray |
| `ink` | `#1E2233` | Text |
| `warm-hairline` | `#E7E2D6` | Borders / dividers |

### Status tones (muted — must not fight the orange)
- **Green** (success / active) — muted, desaturated
- **Amber** (warning / pending) — muted
- **Red** (error / terminated / overdue) — muted

Status colors stay low-saturation so the deep orange always remains the visual anchor.

## 2. Typography

| Use | Font | Why |
|-----|------|-----|
| Headings | **Space Grotesk** | Angular — matches the logo's geometry |
| UI / body | **Inter** | Clean, readable, neutral |
| Record IDs, dates, file metadata | **IBM Plex Mono** | "Registry ledger" feel — appropriate for an official HR archive |

### Hierarchy
- **H1/H2:** Space Grotesk, medium/bold, navy or ink
- **Body:** Inter, regular, ink
- **Meta/IDs/dates:** IBM Plex Mono, small caps or lowercase, ink at reduced opacity
- **Buttons:** Inter, medium, maybe uppercase for the primary CTA

## 3. Signature Elements

### Manila-folder tabs (category headers)
Category headers are **shaped like real manila-folder tabs** using `clip-path` — reinforcing that this is a physical filing system.

```
Category tab:
clip-path: polygon(0 0, 12% 0, 20% 100%, 100% 100%, 100% 0);
```

Example shapes (adjust to taste):
- **Active category tab:** filled deep orange (white text) or navy (white text)
- **Inactive tabs:** warm-paper fill, ink text, warm-hairline border
- Tabs sit along the top of the file-manager panel like a file folder

### 201-file folders (employee records)
Employee records read as **201-folder files**, not generic table rows/cards:
- A folder-front look: flat bordered panel with a slightly angled tab corner or the manila tab treatment
- Employee name as the folder label (Space Grotesk)
- Position + status as the typed line below
- Record ID + birth date in IBM Plex Mono (like the stamp on a folder)
- Status shown as a small muted dot/badge (green/amber/red) — quiet, not shouty

## 4. Layout

- **Fixed navy sidebar** — navigation, logo, user info; white/paper icons
- **Warm-paper canvas** for the content area
- **Flat bordered cards** — `warm-hairline` border, no heavy shadows; a whisper of shadow only where absolutely needed
- Overall feel: official and calm, not app-y

### Suggested structure
```
┌──────────────┬───────────────────────────────────┐
│  NAVY        │   WARM PAPER CANVAS                │
│  SIDEBAR     │                                    │
│              │   [category tab][category tab][..] │
│  HRRMS logo  │   ┌─────────────────────────────┐  │
│  Nav links   │   │ 201-folder card             │  │
│  (Users,     │   │  Surname, Given Name        │  │
│   Employees, │   │  Position  •  Status        │  │
│   Categories)│   │  ID: 201-00001  DOB: ---    │  │
│              │   └─────────────────────────────┘  │
│  User row    │                                    │
└──────────────┴───────────────────────────────────┘
```

## 5. Components

### Sidebar
- Navy background (`#1B2C63`), white/paper text
- Active item: deep orange left indicator (or orange-tinted pill)
- Logo area at top; current user + role pinned at bottom

### Buttons
- **Primary:** deep orange fill, white text
- **Secondary:** navy outline / navy text on paper
- **Ghost/danger:** muted red text
- Small radius, flat (no gradient/shadow)

### Cards / 201-folders
- Warm-paper or white fill, `warm-hairline` border
- Folder-tab header via `clip-path`
- Mono metadata line; status dot

### Category tabs
- Manila tab shapes (`clip-path`)
- Active: deep orange (or navy) fill, white text
- Inactive: paper fill, ink text, hairline border

### Forms & inputs
- Inter body text, `warm-hairline` borders
- Focus ring in deep orange
- Labels: ink, small; hints: mono, muted

### File list
- File names in Inter, metadata (subcategory, date, size, ID) in IBM Plex Mono
- PDF preview pane embedded; save/upload via OS dialog

## 6. Tokens (Tailwind / CSS variables)

```css
:root {
  --navy:          #1B2C63;
  --deep-orange:   #E85B18;
  --warm-paper:    #FAF8F4;
  --ink:           #1E2233;
  --warm-hairline: #E7E2D6;

  --status-green:  desaturate(#2E7D32);   /* muted */
  --status-amber:  desaturate(#B26A00);   /* muted */
  --status-red:    desaturate(#B3261E);   /* muted */

  --font-heading: 'Space Grotesk', sans-serif;
  --font-body:    'Inter', sans-serif;
  --font-mono:    'IBM Plex Mono', monospace;
}
```

## 7. Load Fonts

Self-host or use Google Fonts:
- Space Grotesk (400, 500, 700)
- Inter (400, 500, 600, 700)
- IBM Plex Mono (400, 500)
