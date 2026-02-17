# Dungeon Delver

A full-stack web application for exploring and managing D&D fantasy campaign content, including modules, chapters, and library references (items, spells, monsters, abilities, NPCs, factions, and traps).

## Overview

Dungeon Delver is organized as a monorepo with a React frontend, Express backend, and a structured data layer for fantasy game content. The application allows users to browse through campaign modules, read chapters, and reference game entities through an interactive interface.

## Project Structure

```
dungeon-delver/
├── backend/               # Express API server (TypeScript)
│   ├── src/
│   │   ├── index.ts      # Application entry point
│   │   ├── routes/       # API route handlers
│   │   │   ├── modules.ts
│   │   │   └── library.ts
│   │   └── services/     # Business logic
│   │       └── fileService.ts
│   ├── package.json
│   └── tsconfig.json
├── frontend/              # React SPA (TypeScript + Vite)
│   ├── src/
│   │   ├── main.tsx      # React DOM entry point
│   │   ├── App.tsx       # Main app component
│   │   ├── api/          # API client services
│   │   ├── components/   # Reusable React components
│   │   ├── pages/        # Page components
│   │   └── assets/       # Static resources
│   ├── package.json
│   └── vite.config.ts
├── data/                  # Game content library
│   ├── library/           # Reference entities
│   │   ├── abilities/
│   │   ├── factions/
│   │   ├── items/
│   │   ├── monsters/
│   │   ├── npcs/
│   │   ├── spells/
│   │   └── traps/
│   └── modules/           # Campaign modules
│       └── dungeon_of_the_mad_mage/
│           ├── module.json
│           ├── chapters/
│           ├── rooms/
│           ├── assets/
│           └── images/
└── shared/                # Shared types and utilities

```

## Tech Stack

### Backend
- **Framework**: Express.js 5.2
- **Language**: TypeScript 5.9
- **Validation**: Zod 4.3
- **CORS**: Enabled for frontend integration

### Frontend
- **Library**: React 19.2 with React Router 7.13
- **Build Tool**: Vite 7.3
- **Language**: TypeScript 5.9
- **Linting**: ESLint

### Data Format
- JSON-based content files for all game entities and campaign modules

## Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn

### Installation

1. **Clone the repository** (if applicable)
   ```bash
   cd dungeon-delver
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   npm install
   ```

3. **Install frontend dependencies**
   ```bash
   cd ../frontend
   npm install
   ```

## Running the Application

### Development Mode

**Terminal 1 - Start the backend server:**
```bash
cd backend
npm run dev
```
Server runs on `http://localhost:3000` (or configured port)

**Terminal 2 - Start the frontend development server:**
```bash
cd frontend
npm run dev
```
Frontend runs on `http://localhost:5173` (default Vite port)

### Building for Production

**Backend:**
```bash
cd backend
npm run build
```

**Frontend:**
```bash
cd frontend
npm run build
npm run preview  # Preview production build locally
```

## API Endpoints

### Health Check
- `GET /` - Returns API status

### Modules Routes
- `GET /api/modules` - List all campaign modules

### Library Routes
- `GET /api/library` - Access library entities (items, spells, monsters, etc.)

## Features

- **Module Browser**: Browse available D&D campaign modules
- **Chapter Navigation**: Read through campaign chapters with rich content
- **Reference Panel**: Click on entity references to view details (items, spells, monsters, NPCs, abilities, factions, traps)
- **Static Assets**: Serve campaign images and module assets
- **CORS Support**: Configured for local and remote frontend development

## Development Commands

### Frontend
- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run lint` - Run ESLint

### Backend
- `npm run dev` - Start with auto-reload using ts-node-dev
- `npm run build` - Compile TypeScript to JavaScript

## Data Organization

The `data/` directory contains all game content:

- **Library**: Reference entities used throughout campaigns
  - `abilities/` - Character abilities and features
  - `items/` - Equipment, loot, and consumables
  - `monsters/` - Creature statistics and descriptions
  - `npcs/` - Non-player characters
  - `spells/` - Spell definitions
  - `factions/` - Organizations and groups
  - `traps/` - Dungeon hazards and obstacles

- **Modules**: Full campaign content organized by module
  - Each module has chapters, rooms, and associated assets

## Contributing

Guidelines for contributing to Dungeon Delver (add as needed):
- Follow the existing file structure
- Use TypeScript for type safety
- Validate data files against expected schemas

## License

ISC