# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Country Connector is a React 19 + TypeScript SPA built with Vite. Currently in early development (scaffolded from Vite template).

## Commands

- **Dev server:** `pnpm dev`
- **Build:** `pnpm build` (runs `tsc -b && vite build`)
- **Lint:** `pnpm lint` (ESLint with TypeScript + React plugins)
- **Preview production build:** `pnpm preview`

## Architecture

- **Entry point:** `index.html` → `src/main.tsx` → `src/App.tsx`
- **React Compiler** is enabled via babel-plugin-react-compiler in `vite.config.ts`
- TypeScript strict mode is on; unused locals and parameters are errors
- ESLint uses flat config format (`eslint.config.js`)
- Package manager is **pnpm**
