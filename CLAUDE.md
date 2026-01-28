# bros-and-bills

## Development Commands
```bash
bun dev          # Start development server (Turbopack)
bun build        # Production build
bun start        # Start production server
bun lint         # Run ESLint
```

## Tech Stack
- **Framework**: Next.js 16.1.6 (App Router)
- **React**: 19.2.3 with React Compiler enabled
- **Language**: TypeScript 5
- **Styling**: Tailwind CSS 4
- **Package Manager**: Bun

## Project Structure
```
src/
├── app/           # App Router pages and layouts
│   ├── layout.tsx # Root layout
│   ├── page.tsx   # Home page
│   └── globals.css
```

## Configuration
- Path alias: `@/*` maps to `./src/*`
- React Compiler enabled in `next.config.ts` for automatic optimizations
- Turbopack used for development builds
