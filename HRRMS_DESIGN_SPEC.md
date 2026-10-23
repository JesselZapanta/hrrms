# HRRMS UI Redesign Spec — "Ozamiz City HR 201 Files Management System"

> **Purpose of this document:** Instructions for an AI coding assistant to restyle the existing HRRMS (HR Records Management System) of the **City Council Office, LGU Ozamiz** so that it visually matches the reference design (`Ozamiz_City_HR_201_Files_Dashboard.png`). Keep all existing functionality, routes, and data logic. Only change the look, layout, and component styling unless stated otherwise.

---

## 1. Files Provided

| File | Role |
|---|---|
| `Ozamiz_City_HR_201_Files_Dashboard.png` | **Primary visual reference** (target look) |
| `1792758027868_image.png` | **Current system** (admin dashboard to be redesigned) |
| `IMG_1448.webp` | Ozamiz City **Official Seal** (red ring, navy center, "FORTIS IN FIDE"). Use as logo in header + favicon + login page |
| `IMG_1449.jpeg` | **"Asenso Ozamiz" logo** (navy "A" with orange arrow, orange "SENSO", navy "Q" with orange check, orange "ZAMIZ"). Use as a secondary brand mark (login page, footer, or sidebar bottom) |
| `IMG_1450.jpeg` | **Ozamiz City Hall photo** (Mayor Fernando T. Bernad Memorial Hall, with orange "ASENSO OZAMIZ" rooftop lettering). Use as banner/hero and sidebar background imagery |

**Asset usage rules**
- Place assets in `/public/assets/` (or the framework equivalent) with clean names: `seal.webp`, `asenso-logo.jpeg`, `city-hall.jpeg`.
- When the City Hall photo is used as a background, always apply a **gradient overlay** (navy → transparent, or white → transparent) so text stays readable.
- Never stretch the seal; keep it circular, 1:1 aspect ratio.

---

## 2. Design Language Summary

- **Style:** Modern government-portal dashboard. Clean, card-based, light content area, bold navy + orange branding.
- **Mood:** Trustworthy, official, organized, friendly. Slogan on the design: *"Secure records. Organized people. Better service."*
- **Key traits:**
  - Navy-blue branded **header** and **sidebar**, light-gray **content canvas**, white **cards**.
  - **Orange** is the single accent color (active nav item, curved swoosh, CTAs, warnings).
  - Diagonal **orange swoosh** graphics on the header and sidebar (decorative curved stripe that sweeps from bottom-left to top-right).
  - Soft rounded corners, subtle shadows, generous spacing.
  - Colored **icon tiles** for stats and categories (each with its own hue).
  - **Progress bars** for completion tracking.
  - **Pill-shaped status badges**.

---

## 3. Design Tokens

### 3.1 Colors (approximate values sampled from the reference)

```css
:root {
  /* Brand */
  --navy-900: #0B2A5B;   /* header/sidebar base */
  --navy-800: #11347A;
  --navy-700: #1B4B9B;   /* gradient mid-tone */
  --navy-btn: #14295B;   /* dark primary buttons (e.g. "Upload Document") */
  --orange-500: #F7861E; /* primary accent */
  --orange-600: #EA6A0A; /* accent hover/active gradient end */
  --orange-100: #FFF1E0; /* light orange tint */

  /* Surfaces */
  --bg-canvas: #F3F6FB;  /* page background (very light blue-gray) */
  --bg-card: #FFFFFF;
  --border: #E3E8F0;
  --row-hover: #F7F9FC;

  /* Text */
  --text-primary: #12213F;
  --text-secondary: #5B6B86;
  --text-muted: #8A97AD;
  --text-on-dark: #FFFFFF;

  /* Status */
  --success-bg: #D8F3DC;  --success-text: #1E7A3C;  --success-bar: #12A150;
  --warning-bg: #FFF1CC;  --warning-text: #C77700;  --warning-bar: #F7861E;
  --danger-bg:  #FDE2E2;  --danger-text:  #C62828;
  --info-bg:    #DCEBFF;  --info-text:    #1D5FD1;

  /* Icon tile colors */
  --tile-blue:   #1E6BE6;
  --tile-green:  #19A55A;
  --tile-orange: #F7861E;
  --tile-red:    #E5383B;
  --tile-purple: #7B3FE4;
  --tile-yellow: #F4B400;
  --tile-slate:  #6B7C99;
}
```

### 3.2 Typography
- **Font family:** `Inter` (fallbacks: `Poppins`, `Segoe UI`, `system-ui`, sans-serif). Headings may use `Poppins`/`Inter` semi-bold.
- **Header title** ("CITY COUNCIL OFFICE"): uppercase, bold, ~28px, letter-spacing ~0.5px, white.
- **Header subtitle** ("LOCAL GOVERNMENT UNIT OF OZAMIZ CITY"): uppercase, regular, ~16px, white.
- **System title** ("HUMAN RESOURCE" / "201 FILES MANAGEMENT SYSTEM"): uppercase, navy, bold for line 1 (~26px), medium for line 2 (~22px). Tagline in small italic (~12px).
- **Greeting** ("Good day,"): ~18px regular. **User name:** ~28px bold. Job title ~18px medium. Unit ~16px muted.
- **Card titles** ("My 201 File", "Document Categories", "Recent Activity"): ~20px bold, `--text-primary`.
- **Card subtitles:** ~13px, `--text-secondary`.
- **Table header:** 13px semi-bold. **Table body:** 13px regular.
- **Stat numbers:** ~36px bold. Stat label ~15px semi-bold. Stat sublabel ~12px muted.

### 3.3 Radius, Shadow, Spacing
- Card radius: **16px**. Button radius: **8–10px**. Pill badge radius: **999px**. Icon tile radius: **12–14px**.
- Card shadow: `0 4px 16px rgba(15, 40, 90, 0.08)`; border `1px solid var(--border)`.
- Base spacing unit: 8px. Card padding: 20–24px. Gap between cards: 16–20px.

---

## 4. Global Layout

```
┌──────────────────────────────────────────────────────────────────────────┐
│  TOP HEADER BAR (navy gradient + City Hall photo + orange swoosh)        │
│  [Seal] CITY COUNCIL OFFICE …            HUMAN RESOURCE …   🔔  [User ▾] │
├─────────────┬────────────────────────────────────────────────────────────┤
│  SIDEBAR    │  CONTENT AREA (light canvas)                               │
│  (navy)     │                                                            │
│  nav items  │  Welcome/profile card                                      │
│             │  4 stat cards                                              │
│  City Hall  │  [My 201 File table]         [Document Categories list]    │
│  photo +    │  [Recent Activity table]     [Need Assistance? card]       │
│  footer     │                                                            │
└─────────────┴────────────────────────────────────────────────────────────┘
```

- **Header height:** ~120px (full width, above both sidebar and content).
- **Sidebar width:** ~260px, fixed, full height below header.
- **Content area:** fluid, padding ~16–20px, 2-column grid for the lower sections (left ≈ 60–65%, right ≈ 35–40%).
- **Responsive:** below ~1024px collapse sidebar to icons/drawer; stack the 2-column sections into one column; stat cards become 2×2 then 1 column.

---

## 5. Component Specifications

### 5.1 Top Header Bar
- **Background:** left side deep navy with a **faded City Hall photo** (`city-hall.jpeg`, ~25–35% opacity, navy overlay); right side **white/very light** with the same building faintly visible, separated by a **diagonal orange swoosh** (curved band, orange-500 → orange-600) running from bottom-center up to the top-right of the navy zone.
- **Left block:** Official **Seal** (≈ 100px circle, with a thin white ring) + two-line text:
  - Line 1: `CITY COUNCIL OFFICE` (bold, white)
  - Line 2: `LOCAL GOVERNMENT UNIT OF OZAMIZ CITY` (regular, white)
- **Right block (on light area):**
  - `HUMAN RESOURCE` / `201 FILES MANAGEMENT SYSTEM` (navy), with italic tagline `SECURE RECORDS. ORGANIZED PEOPLE. BETTER SERVICE.`
  - **Notification bell** in a white circular button with a small red dot badge.
  - **User chip:** white pill with navy avatar circle (person silhouette), name text (e.g. "Staff User" / "Administrator"), and a chevron-down dropdown.
- For the **admin** version, replace "Staff User" with "Administrator" and keep the same structure.

### 5.2 Sidebar
- **Background:** vertical navy gradient (`--navy-900` → `--navy-700`).
- **Nav items:** icon (left) + label, ~16px, white text, height ~48–52px, padding-x 20px, radius 10px, margin-x 10px.
- **Active item:** solid **orange gradient** pill (`--orange-500` → `--orange-600`), white text/icon, soft glow shadow.
- **Hover:** white overlay at ~10% opacity.
- **Bottom of sidebar:** a **City Hall photo** (masked with navy gradient overlay) with a diagonal **orange swoosh** across it, and overlaid centered text:
  - `CITY COUNCIL OFFICE` / `OZAMIZ CITY` (bold white)
  - Footer micro-text: `PEOPLE • SERVICE • GOOD GOVERNANCE` (tiny uppercase, letter-spaced, white).
- **Nav items (staff/user view in the reference):** Dashboard, My 201 File, Search Document, Document Categories, Document Requests, Reports, Settings.
- **Nav items (admin view — map the existing system's menu, keep these):** Dashboard, User Management, Employees, File Categories, Offices, Salary Grades. Use outline icons (home/grid, users, folder/people, layers, building, coins) in the same style.
- Remove the old "V1.27.0 • AUTO-UPDATE" footer from the sidebar's main area or keep it as a very small muted text under the City Hall footer.

### 5.3 Welcome / Profile Card (top of content)
- White card, full content width, radius 16px, height ~150px.
- **Left:** circular avatar (navy silhouette on light blue-gray bg, ~100px).
- **Middle:** "Good day," → **Full name** (bold, large) → Position/Role → Unit/Department (muted).
- A thin **vertical divider**, then a mini info grid: `Employee ID`, `Department`, `Employment Status` (label muted/small, value dark/medium) with a **green pill** badge for "Permanent".
- **Right:** City Hall photo fading into white (left fade), orange swoosh, and an italic quote: *"Organized Records for a More Efficient Public Service."* with a short orange underline bar.
- **Admin version:** replace the profile info with: `Welcome back, Administrator`, subtitle "Your filing structure and access controls are ready to manage.", and two buttons: **Manage Categories** (orange or outlined) and **User Management** (outlined/white). Keep the City Hall photo/swoosh on the right and the "ASENSO OZAMIZ" small label.

### 5.4 Stat Cards (row of 4)
- 4 equal white cards, radius 16px, padding 16–20px, horizontal layout: **colored rounded-square icon tile** (≈ 76px) on the left + text on the right.
- Text: big number (36px bold), label (15px semi-bold), sublabel (12px muted).
- Reference cards:
  1. Blue tile, document icon — **6** · My Documents · "Uploaded in my 201 File"
  2. Green tile, check-circle icon — **5** · Complete Categories · "Out of 7 required categories"
  3. Orange tile, clock icon — **1** · For Updating · "Document needs to be updated"
  4. Red tile, document-minus icon — **0** · Pending Requests · "No pending document requests"
- **Admin version (3–4 cards):** `26 Employee Records` (blue/navy tile, person icon), `8 File Categories` (orange tile, document icon), `38 Subcategories` (purple or green tile, layers icon). Optionally add a 4th: "Offices" count or "Pending Requests".

### 5.5 "My 201 File" Table Card (left, large)
- **Header row:** title `My 201 File` + subtitle "View and manage the documents in your personal 201 file." On the right, a **dark navy button** with a plus icon: `+ Upload Document`.
- **Tabs:** `All Documents` (active: navy text, light-blue tinted background, **orange underline**), `Recent Documents`, `For Updating` (inactive: orange/blue text, no fill).
- **Table columns:** `#`, `Document Name`, `Category`, `Date Uploaded`, `Status`, `Action`.
- **Table header row:** light gray-blue background (`#F1F4F9`), semi-bold text.
- **Rows:** white, 1px bottom border, ~44px height, hover tint.
- **Status badges (pills):** `Complete` → green bg/green text; `For Updating` → amber bg/orange text.
- **Action column:** two icon buttons — **eye** (view, blue) and **download** (blue).
- Keep the same column pattern when applying to Employees, File Categories, etc. tables in the admin view.

### 5.6 "Document Categories" Card (right)
- Title `Document Categories` with a `View All` link (blue, top-right).
- List of category rows: **colored folder icon tile** (small rounded square, ~34px; colors rotate: blue, orange, green, purple, red, yellow, slate) + category name + `x / y` count on the right + **thin progress bar** under the name + chevron `›` at the far right.
- Progress bar: 6px high, rounded, track `#E6EBF2`; fill **green** when complete, **orange** when partial (e.g. 1/2).
- Reference categories:
  - A. Personal Data Sheet and Work Experience — 3/3
  - B. Appointment and Other HR Actions — 4/4
  - C. Performance Rating — 2/2
  - D. Learning and Development — 3/3
  - E. Leave Documents — 1/2 (orange bar, 50%)
  - F. Awards and Citations — 1/1
  - G. Administrative Cases — 1/1
- **Admin version (Filing Structure):** use the same rows/tiles for the existing 8 categories (Personal Information, Appointment and Employment Documents, Qualifications and Eligibility, Medical and Clearance Documents, Performance Records, Awards and Recognition, Disciplinary and Administrative Records, Other Personnel Documents) showing `N subcategories` instead of progress. Use a 2-column card grid for these if space allows, with the folder-icon tile styling above.

### 5.7 "Recent Activity" Card (bottom-left)
- Title `Recent Activity` + `View All` link (blue).
- Table columns: `Date & Time`, `Activity`, `Details`.
- Each row starts with a **small circular icon** (green = uploaded, blue = viewed, blue = downloaded, orange = profile updated) followed by date/time text.
- Header row: light gray-blue background.
- Example rows: "Document uploaded — Training Certificate (L&D)", "Document viewed — Performance Rating (2023)", "Document downloaded — Service Record", "Profile updated — Contact Information".

### 5.8 "Need Assistance?" Card (bottom-right)
- Light blue gradient card (`#EAF3FF` → `#F7FAFF`), radius 16px.
- **Left:** friendly illustration of a female HR staff (flat vector style, navy blazer, holding a folder), with faint document watermark in the background.
- **Right:** heading `Need Assistance?`, text "For document-related concerns, please coordinate with the HR Unit.", and a **dark navy button** with a document icon: `Send a Document Request`.
- If no illustration is available, use a flat help/support icon or leave a soft document-icon watermark.

---

## 6. Interaction & Behavior Notes
- Buttons: 150ms ease transition; hover darkens by ~6% and lifts shadow slightly.
- Table rows: hover background `--row-hover`; eye/download icons turn darker blue on hover with tooltip.
- Tabs: active tab has orange 3px underline; switching filters the table without a page reload where possible.
- Progress bars animate their width on first load (400–600ms ease-out).
- Notification bell: red dot only when unread items exist.
- Keyboard focus rings: 2px `--orange-500` outline offset 2px (accessibility).
- Maintain WCAG AA contrast: white text on navy/orange only at ≥ 16px or bold.

---

## 7. Other Screens to Restyle (apply same system)
Apply the same header, sidebar, cards, tables, badges, buttons, and spacing to the remaining existing pages:
- **User Management:** table card with avatar, name, role pill, status pill, actions (edit/delete icons). Primary button `+ Add User` (dark navy).
- **Employees:** table/list card with search bar and filters (rounded input, 40px height, search icon), employee status pills (green Permanent, blue Casual/Contractual, etc.), view-201 action.
- **File Categories:** category rows with folder icon tiles, subcategory count, expand/collapse chevron, edit/delete actions.
- **Offices:** table/card grid with office name, head, employee count.
- **Salary Grades:** clean table with grade, step columns, amount (right-aligned, tabular numerals).
- **Login page (recommended):** split layout — left navy panel with City Hall photo + seal + "Asenso Ozamiz" logo + slogan; right white card with form fields and orange primary button.
- **Forms/Modals:** white card, 16px radius, navy title, orange primary action, gray secondary action, inputs with 1px `--border`, 10px radius, orange focus ring.

---

## 8. Implementation Guidance for the AI
1. **Do not break existing logic.** Reuse current components/routes; only change styles, markup structure, and add missing UI pieces.
2. Centralize tokens from section 3 as CSS variables (or Tailwind theme extension: `navy`, `orange`, `canvas`, etc.).
3. Build reusable components: `AppHeader`, `Sidebar`, `NavItem`, `ProfileCard`, `StatCard`, `DataTable`, `StatusBadge`, `CategoryRow`, `ProgressBar`, `ActivityTable`, `AssistCard`, `PrimaryButton`, `OutlineButton`.
4. Use an icon set with outline style (e.g. Lucide / Heroicons / Phosphor). Icons inside colored tiles are **white**.
5. Create the diagonal orange swoosh as an **inline SVG** or CSS `clip-path` shape (curved band, 2-stop orange gradient) and reuse it in header, sidebar footer, and profile card.
6. Load the City Hall photo with `object-fit: cover`, apply gradient overlays via CSS pseudo-elements.
7. Use CSS Grid for layout: sidebar (`260px`) + content (`1fr`); content lower section `grid-template-columns: 1.7fr 1fr`.
8. Ensure the layout works from 1280px wide up; provide a responsive fallback as described in section 4.
9. Replace the current dark top title bar/dashboard hero (dark navy block with monospace labels) with the new header + profile/welcome card pattern. Remove monospace/uppercase micro-labels like `HRRMS / REGISTRY OVERVIEW`; use a normal breadcrumb in muted text instead (e.g. `Dashboard`).
10. Keep text content, labels, and numbers dynamic (data-bound); the sample values in this document are only for visual reference.

---

## 9. Quick Prompt (for pasting into an AI coding tool)

> Redesign my HRRMS (City Council Office, LGU Ozamiz) UI to match the attached reference dashboard. Follow `HRRMS_DESIGN_SPEC.md` exactly: navy gradient header with the Ozamiz seal, City Hall photo overlay and orange diagonal swoosh; navy sidebar with orange active pill and City Hall photo footer; light-gray canvas with white rounded cards; profile/welcome card; 4 colored-icon stat cards; document table with tabs, status pills and view/download actions; category list with colored folder tiles and progress bars; recent-activity table; "Need Assistance?" card. Use the provided assets (seal, Asenso Ozamiz logo, City Hall photo). Keep all existing functionality and data bindings intact.
