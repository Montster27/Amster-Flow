# ArmsterFlow - Lean Canvas Wizard

An interactive Next.js application for building a Lean Canvas business model step by step.

## Features

- Step-by-step wizard interface for creating a Lean Canvas
- Auto-save to browser localStorage
- Export to JSON and text formats
- TypeScript for type safety
- Tailwind CSS with shadcn/ui components
- Progress tracking
- Responsive design

## Getting Started

1. Install dependencies:
```bash
npm install
```

2. Run the development server:
```bash
npm run dev
```

3. Open [http://localhost:3000](http://localhost:3000) in your browser

## Project Structure

```
ArmsterFlow/
├── app/
│   ├── components/
│   │   ├── ui/           # shadcn/ui components
│   │   └── lean-canvas-wizard.tsx
│   ├── lib/
│   │   └── utils.ts
│   ├── globals.css
│   ├── layout.tsx
│   └── page.tsx
├── next.config.js
├── tailwind.config.js
├── tsconfig.json
└── package.json
```

## Technologies

- Next.js 14 (App Router)
- React 18
- TypeScript
- Tailwind CSS
- Radix UI
- shadcn/ui
- Lucide Icons

## License

MIT
