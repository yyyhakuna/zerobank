# ZeroBank Monorepo

This repository contains the frontend and backend for the ZeroBank project.

## Structure

- `frontend`: React + Vite frontend application.
- `backend`: NestJS backend application.

## Getting Started

### Prerequisites

- Node.js
- pnpm

### Installation

```bash
pnpm install
```

### Running the Project

You can run both frontend and backend concurrently:

```bash
pnpm dev
```

Or run them individually:

```bash
pnpm dev:frontend
pnpm dev:backend
```

## Scripts

- `pnpm dev`: Start both frontend and backend in development mode.
- `pnpm build`: Build both projects.
- `pnpm test`: Run tests for both projects.
