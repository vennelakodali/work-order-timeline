# Work Order Schedule Timeline

## Quick Start

```bash
# Install dependencies
npm install

# Run the development server
ng serve
```

Navigate to `http://localhost:4200/`

## Tech Stack

| Library | Purpose |
|---------|---------|
| **Angular 19** | Framework (standalone components, strict TypeScript) |
| **@ng-select/ng-select** | Status dropdown in create/edit panel |
| **@ng-bootstrap/ng-bootstrap** | Date pickers (ngb-datepicker) |
| **Angular Reactive Forms** | FormGroup / FormControl with custom validators |
| **Bootstrap 5.3** | UI framework for responsive design |
| **@popperjs/core** | Tooltip positioning engine |
| **UUID** | Unique identifier generation for work orders |
| **SCSS** | Styling with CSS custom properties (design tokens) |
| **Circular Std** | Font family (loaded from Naologic CDN) |

## Architecture

```
src/app/
  ├── models/              # TypeScript interfaces
  │   ├── work-center.model.ts   # WorkCenter interface
  │   ├── work-order.model.ts    # WorkOrder interface with status types
  │   └── index.ts               # Barrel export for models
  ├── services/
  │   └── work-order.service.ts   # CRUD, overlap detection, localStorage persistence
  ├── components/
  │   ├── timeline/               # Main timeline grid
  │   │   ├── timeline.component.*
  │   │   └── timeline-hover-button.component.*  # Floating "+" button for new orders
  │   ├── timeline-header/        # Zoom controls and "Today" button
  │   ├── work-order-bar/         # Individual work order bar with status badge & menu
  │   └── slide-panel/            # Create/Edit form with validation
  ├── ui/                  # Reusable UI components
  │   ├── dropdown/        # Three-dot action menu component
  │   └── pill/            # Status badge component (Open, In Progress, Complete, Blocked)
  ├── constants/
  │   └── status-config.ts        # Status definitions with colors and labels
  ├── data/
  │   └── sample-data.ts          # Initial work centers and work orders
  └── utils/               # Pure utility functions
      ├── date-conversions.ts     # Date string formatting helpers
      ├── overlap-detection.ts    # Check for work order conflicts
      ├── timeline-columns.ts     # Generate date columns for grid
      └── timeline-positioning.ts # Pixel positioning calculations
```

**Key design decisions:**
- **Date-to-pixel mapping**: Linear interpolation using utilities in `timeline-positioning.ts` for accurate bar placement and today indicator.
- **Modular utilities**: Date handling, positioning, and column generation are separated into focused, testable functions.
- **Reusable UI components**: Dropdown and pill components provide consistent styling across the app.
- **Design tokens**: Extracted from Sketch file and stored as CSS custom properties in `styles.scss`.
- **Timeline** component as the key orchestrator for the application including managing positions, hovers, etc. 

## Features Implemented

### Core (Required)
✅ Timeline grid with **Day / Week / Month / Hour** zoom levels
✅ Work order bars with **status badges** (Open, In Progress, Complete, Blocked)
✅ **Create panel** (slides from right, pre-fills start date from click position)
✅ **Edit panel** (same panel, pre-populated with existing data)
✅ **Three-dot actions menu** with Edit and Delete options
✅ **Overlap detection** with error message: non exclusive check (</> as opposed to >=/<=).
✅ **Reactive Forms** with required fields and date range validation
✅ **Current day indicator** (vertical line)
✅ **Horizontal scroll** with fixed left panel
✅ **Row hover** highlighting
✅ **5 work centers** and **9 work orders** covering all 4 statuses

### Bonus
✅ **localStorage persistence**: create/edit/delete persists across refreshes
✅ **Smooth animations**: there should be decent amount of smooth animations, not extensive. slide in and slide out work well on the side panel
✅ **Keyboard navigation** — decent amount of navigation via keyboard exists. ng dropdowns however are notorous for not letting tab throughs, I didn't dig too much into it for now. 
✅ **"Today" button** — centers the viewport on today's date
✅ **Tooltip on bar hover** — shows name, status, and date range
✅ **Design tokens** from Sketch — exact colors, typography, spacing; should mostly match. 
✅ **Unit tests** for high risk areas (courtesy of claude) since I was running out of time.

## Sample Data

| Work Center | Orders | Statuses |
|-------------|--------|----------|
| Genesis Hardware | Centrix Ltd, Apex Dynamics | Complete, Open |
| Rodrigues Electrics | Rodrigues Electrics | In Progress |
| Konsulting Inc | Konsulting Inc, Complex Systems | In Progress, In Progress |
| McMarrow Distribution | McMarrow Distribution, Summit Logistics | Blocked, Open |
| Spartan Manufacturing | Titan Forge, Nova Assembly | Complete, Open |

## Assumptions and Choices

- Side panel width has been qssumed to be a fixed 591px per the design spec as opposed to fitting content. 
- Renamed some tokens like text-2 as text-title.
- I currently added date picker and ng-select overrides to styles.scss but I’d do separate components for date picker with input in real life, that I can then use in my forms directly.  Ng-select overrides are fine, but I’d scope them separately. Also I didn’t see a sketch file for date picker, so did some basic styling. Also the month arrows on the date picker don't currently work, but left it as is due to time constraints.
- Open state’s work order bar background and border info unavailable.
- Hover button is a little interesting phenomenon, may be there’s a better way to do it, but left is as is, as a future improvement/spike. 
- I didn't see a specific design for the date picker in sketch, so left it as is. 
- Form validation is in place, with an error message, no extensive UI styling for errors. 
- Side panel width has been qssumed to be a fixed 591px per the design spec as opposed to fitting content. 
- Renamed some tokens like text-2 as text-title.
- I currently added date picker and ng-select overrides to styles.scss but I’d do separate components for date picker with input in real life, that I can then use in my forms directly.  Ng-select overrides are fine, but I’d scope them separately. Also I didn’t see a sketch file for date picker, so did some basic styling. Also the month arrows on the date picker don't currently work, but left it as is due to time constraints.
- Open state’s work order bar background and border info unavailable.
- Hover button is a little interesting phenomenon, may be there’s a better way to do it, but left is as is, as a future improvement/spike. 
- I didn't see a specific design for the date picker in sketch, so left it as is. 
- Form validation is in place, with an error message, no extensive UI styling for errors. 
- The Sketch design shows the form field order as: Work Order Name, Status, End date, Start date (end date appears before start date). This was followed to match the design, even though the spec document lists them in a different order.
- The sketch design shows 'hour' granularity in the timescale as opposed to the design doc. I decided to match the skectch design.
- No localization added (except for date picker), all strings are hardcoded

## AI Prompts

- saved in a separate file called AI_PROMPTS