# Development Guide

This guide assumes you have already completed the steps in the [Deployment Guide](deployment.md) and have the application running locally.

---

## Program Specifications

### Languages & Frameworks

| Layer | Technology |
|---|---|
| Frontend | **React 19** (JavaScript/JSX) |
| Routing | React Router v6 |
| Styling | **Tailwind CSS 3** with Autoprefixer |
| Icons | React Icons |
| Backend / Database | **Supabase** (PostgreSQL, Auth, Edge Functions) |
| Containerization | Docker (Node 18 Alpine build → Nginx Alpine serve) |

### Build Tooling

The project uses **Create React App (react-scripts v5)** as its build system. No custom webpack or Vite configuration is required.

| npm Script | Purpose |
|---|---|
| `npm start` | Starts the development server on `http://localhost:3000` |
| `npm run build` | Creates an optimized production build in the `build/` folder |
| `ctrl + c` | Stops the development server |

### Dependencies

All project dependencies are declared in [`package.json`](https://github.com/ShidemantleJ/CS495FinalProject-OCCDatabase/blob/main/package.json) in the repository root.

- **Runtime dependencies** – `dependencies` section (React, Supabase JS client, DOMPurify, etc.)
- **Dev dependencies** – `devDependencies` section (Playwright, Tailwind CSS, Autoprefixer)

Install or update all dependencies with:

```bash
npm install
```

Resolve dependency conflicts with:

```bash
npm audit fix
```

### Environment Variables

The application requires a `.env` file in the project root with at minimum:

| Variable | Purpose |
|---|---|
| `REACT_APP_SUPABASE_URL` | Your Supabase project URL |
| `REACT_APP_SUPABASE_ANON_KEY` | Supabase anonymous/public API key |

Additional variables used for testing are described in the [Automated Testing](#automated-testing) section below.

---

## How to Make Changes

1. **Create a branch** off of `develop` for your feature or fix.
2. **Install dependencies** if you haven't recently: `npm install`
3. **Start the dev server**: `npm start` — the app hot-reloads on file changes.
4. **Edit source files** under the `src/` directory:
    - **Pages** live in `src/pages/` (one file per route, e.g. `home.jsx`, `church.jsx`).
    - **Reusable components** live in `src/components/` (e.g. `navbar.jsx`, `ChurchDropdown.jsx`).
    - **API helpers** live in `src/api/` (e.g. `supabaseAPI.js`).
    - **React context providers** live in `src/contexts/`.
    - **Utility / helper functions** live in `src/utils/`.
    - **Custom hooks** live in `src/hooks/`.
    - **Supabase client setup** is in `src/supabaseClient.js`.
5. **Run tests** before pushing (see [Automated Testing](#automated-testing)).
6. **Open a Pull Request** into `develop`. GitHub Actions will automatically run the Playwright test suite and CodeQL security analysis on your PR.

### Docker (optional)

You can build and run a production-like container locally:

```
# Build and start with Docker Compose (serves on http://localhost:3000)
docker compose up --build
```

---

## Backlog and Bugs

The project backlog and bug tracker live on **Jira**:

> **Jira Board:** [OCC Database Backlog](https://cs495seniordesign.atlassian.net/jira/software/projects/SCRUM/boards/1/backlog)

### Unfinished Tasks

| Ticket | Description |
|---|---|
| SCRUM-13 | Self-host Supabase and webserver on AWS |
| SCRUM-14 | Plot all churches in database with OSM/Google Maps |
| SCRUM-15 | Select churches with Google Maps/OSM instead of manual entry |
| SCRUM-35 | Investigate PostGIS for location services |
| SCRUM-54 | Create dropoff location table for storing location codes |
| SCRUM-63 | Create page to add/remove dropoff locations from the table |
| SCRUM-87 | UI update on 'my profile' page |
| SCRUM-111 | Replace text box for 'How can we support your OCC ministry' in mobile interface with the 'resources requested' field |

### Known Major Issues

<!-- Add or remove items from this list as the project evolves -->

- **Supabase free-tier limitations** – The project currently runs on a free Supabase instance. A future migration to a paid tier or self-hosted Supabase may be necessary as data and usage grow.
- **React 19 ecosystem compatibility** – The project uses React 19, which is still relatively new. Some third-party libraries may lag behind with full React 19 support; watch for deprecation warnings after dependency updates.
- **Create React App maintenance** – CRA (react-scripts) is no longer actively maintained upstream. A future migration to **Vite** or another modern build tool should be planned.

---

## Style Expectations

### General Conventions

- **JavaScript / JSX** – The project uses plain JavaScript (no TypeScript in application code). JSX files use the `.jsx` extension for pages and components; pure-JS files use `.js`.
- **Functional components only** – All React components should be written as functional components using hooks (`useState`, `useEffect`, `useContext`, etc.). Do not introduce class components.
- **File naming** – Page files and component files use **camelCase** (e.g. `editChurch.jsx`, `navbar.jsx`).

### CSS / Tailwind

- Styling is done with **Tailwind CSS utility classes** applied directly in JSX. The Tailwind config is in `tailwind.config.js`.
- Avoid writing custom CSS unless absolutely necessary. If you must, place it in `src/App.css` or `src/index.css`.

### Linting

The project extends the **react-app** and **react-app/jest** ESLint presets (configured in `package.json` under `eslintConfig`). Run the linter with:

```bash
npx eslint src/
```

### Security

- User-generated HTML content must be sanitized with **DOMPurify** before rendering.
- Never commit `.env` files or secrets to the repository.

---

## Automated Testing

### Overview

The project has one main layer of automated testing:

| Type | Framework | Location |
|---|---|---|
| End-to-End (E2E) tests | **Playwright** | `tests/` directory |

### CI / CD (GitHub Actions)

Two workflows run automatically on pushes and pull requests:

1. **Playwright Tests** (`.github/workflows/playwright.yml`) — Installs dependencies, installs browser engines, runs the full E2E suite, and uploads the HTML report as a build artifact. Triggered on pushes/PRs to `main`, `master`, and `develop`.
2. **CodeQL Analysis** (`.github/workflows/codeql.yml`) — Performs security and code-quality scanning on JavaScript/TypeScript. Runs on pushes to `develop` and on a weekly schedule.

### Running Tests Locally

For detailed instructions on running tests locally, see the [Testing](testing.md) guide.

### Test File Locations

| File | Coverage Area |
|---|---|
| `tests/church_management.spec.js` | Adding and verifying churches |
| `tests/edit_church.spec.js` | Editing church information |
| `tests/home_filters.spec.js` | Home page filtering functionality |
| `tests/individuals.spec.js` | Individual records management |
| `tests/profile.spec.js` | User profile operations |
| `tests/team_members.spec.js` | Team member management |
| `tests/auth.setup.js` | Shared authentication helper used by all specs |

### Browser Coverage

Playwright is configured to run tests against **Chromium**, **Firefox**, and **WebKit** (Safari). See `playwright.config.js` for the full configuration.