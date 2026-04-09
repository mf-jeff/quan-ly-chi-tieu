# Dashboard UI Implementation Plan

**Date:** 2026-04-09
**Status:** In Progress

## Overview
Build a modern, responsive expense tracker dashboard with Vietnamese locale support (VND).

## Tech Stack
- Next.js 16.2.3 + React 19 + TypeScript
- Tailwind CSS v4 (inline theme)
- Recharts (charts)
- Lucide React (icons)
- Date-fns (date formatting)
- Zustand (state - future)

## Phases

### Phase 1: Foundation `[In Progress]`
- Color theme + globals.css update
- Utility functions (VND formatter, mock data)
- [Details](phase-01-foundation.md)

### Phase 2: Layout `[Pending]`
- Sidebar navigation + mobile header
- Responsive shell
- [Details](phase-02-layout.md)

### Phase 3: Dashboard Components `[Pending]`
- Summary cards (total, income, expense, balance)
- Spending trend chart (area chart)
- Category breakdown (donut chart)
- Recent transactions list
- Budget progress bars
- [Details](phase-03-components.md)

### Phase 4: Assembly & Polish `[Pending]`
- Compose dashboard page
- Responsive testing
- Type checking
- [Details](phase-04-assembly.md)

## File Structure
```
src/
  app/
    layout.tsx          (updated)
    page.tsx            (dashboard)
    globals.css         (updated theme)
  components/
    layout/
      Sidebar.tsx
      MobileHeader.tsx
    dashboard/
      SummaryCards.tsx
      SpendingChart.tsx
      CategoryBreakdown.tsx
      RecentTransactions.tsx
      BudgetProgress.tsx
  lib/
    utils.ts
    mock-data.ts
    types.ts
```
