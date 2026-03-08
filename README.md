# Omanye — Global Health Platform

> *"Omanye"* means **unity** in the Akan language of West Africa — reflecting our belief that improving global health requires all of humanity working together.

Omanye is a modern web platform dedicated to improving health outcomes for every person, in every nation. It connects health advocates, researchers, policymakers, and communities to drive equitable health outcomes across the world.

## Features

- **Home / Landing Page** — Hero section with mission statement, global health stats, and initiative highlights
- **Global Health Initiatives** — Deep-dive into 6 key program areas (UHC, Infectious Disease, Maternal Health, Mental Health, Nutrition, Climate & Health)
- **Disease Surveillance** — Global overview of infectious disease trends with alert levels and methodology
- **Health Resources** — Curated library of reports, guides, datasets, and toolkits from WHO, UNICEF, IHME, and more
- **About** — Mission, vision, values, leadership team, and organizational timeline

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | React 19 + Vite 7 |
| Styling | Tailwind CSS v4 |
| Routing | React Router v7 |
| Build | Vite |
| Linting | ESLint |

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

## Project Structure

```
src/
├── components/
│   ├── Header.jsx      # Sticky navigation header with mobile menu
│   └── Footer.jsx      # Footer with links, partners, and contact
├── pages/
│   ├── Home.jsx        # Landing page
│   ├── Initiatives.jsx # Health initiatives detail page
│   ├── Surveillance.jsx# Disease surveillance page
│   ├── Resources.jsx   # Health resources library
│   └── About.jsx       # About page with team and timeline
├── data/
│   └── healthData.js   # Centralized data for stats, initiatives, diseases, resources
├── App.jsx             # Router and layout
├── main.jsx            # Entry point
└── index.css           # Tailwind imports
```

## Data Sources

All statistics and data presented on this platform are sourced from:
- [World Health Organization (WHO)](https://www.who.int)
- [UNICEF](https://www.unicef.org)
- [Institute for Health Metrics and Evaluation (IHME)](https://www.healthdata.org)
- [Our World in Data](https://ourworldindata.org)
- [Global Health Security Index](https://www.ghsindex.org)
