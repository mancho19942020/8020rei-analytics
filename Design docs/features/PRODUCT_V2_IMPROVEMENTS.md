# Product Tab v2 - Improvements Backlog

**Created:** 2026-02-17
**Status:** PLANNING
**Priority:** High - Data is connected but presentation needs refinement before user adoption

---

## Context

The Product tab (Client Domains + Product Projects) is live with real BigQuery data from `bigquery-467404`. All 10 widgets render data, but the current version (v1) is a functional MVP. This document tracks the improvements needed to make the data **actionable and useful** for Daily Huddles and team decision-making.

---

## Client Domains Improvements

### 1. Domain Activity Overview (KPI Cards)
- [ ] Replace mock sparklines with real historical data points
- [ ] Add trend indicators for appointments and deals (currently only domains, properties, leads, revenue have trends)
- [ ] Add percentage context (e.g., "45% of total revenue")
- [ ] Color-code cards by performance range

### 2. Domain Leaderboard
- [ ] Add conversion columns: Lead-to-Property ratio, Appointment-to-Lead %, Deal-to-Appointment %
- [ ] Color-code revenue cells (high/medium/low performers)
- [ ] Add a mini trend indicator per domain (up/down/flat)
- [ ] Make rows clickable for domain detail drill-down

### 3. Domain Activity Trend (Chart)
- [ ] Allow showing both metrics simultaneously (properties + domains)
- [ ] Add a moving average line for trend clarity
- [ ] Add daily/weekly aggregation toggle
- [ ] Show average reference line

### 4. Revenue by Domain (Bar Chart)
- [ ] Add percentage-of-total annotation on each bar
- [ ] Add previous period comparison (side-by-side bars)
- [ ] Highlight top 3 and bottom 3 performers with distinct styling

### 5. Flagged Domains
- [ ] Add severity level column with color coding (critical/warning/info)
- [ ] Add "days since flagged" column for urgency context
- [ ] Add status column (New / Acknowledged / Resolved)

---

## Product Projects Improvements

### 6. Project Status Overview (KPI Cards)
- [ ] Replace mock sparklines with real historical data
- [ ] Show percentages alongside counts (% on track, % delayed)
- [ ] Add severity context for delayed projects (avg days overdue)
- [ ] Make cards clickable to filter the Projects Table below

### 7. Projects Table
- [ ] Add priority column with P0/P1/P2 color badges
- [ ] Color-code rows by risk level (overdue + low progress = red)
- [ ] Add "days until due" for non-delayed items
- [ ] Add estimated completion date based on current velocity
- [ ] Show a quick filter for "Only delayed projects"

### 8. Bug Tracking
- [ ] Add bug origins breakdown as donut/pie chart (currently data exists but not visualized)
- [ ] Show average resolution time metric
- [ ] Add severity distribution visualization
- [ ] Add "bugs created vs bugs closed" comparison line
- [ ] Show escape rate: customer-found bugs vs internally-found

### 9. Team Workload
- [ ] Add completion percentage bar per assignee (completed/total)
- [ ] Show average days overdue for delayed tasks (not just count)
- [ ] Add task type breakdown (Bugs vs Features vs Maintenance)
- [ ] Utilization rate indicator (green/yellow/red)
- [ ] Suggest workload rebalancing when imbalanced

### 10. Delivery Timeline
- [ ] Color-code entire row by risk (overdue + unresolved = red)
- [ ] Add "Status" column: Delivered, At Risk, In Progress
- [ ] Show "days remaining" countdown for items still in progress
- [ ] Add velocity trend: are we delivering faster or slower over time?
- [ ] Group by sprint/release for milestone view

---

## Cross-Cutting Improvements

### Data Quality
- [ ] Handle partial API failures gracefully (if one query fails, show the rest)
- [ ] Add empty state messaging for each widget when no data matches filters
- [ ] Validate BigQuery response shapes match TypeScript types

### Visual Polish
- [ ] Ensure all number formatting is consistent (currency, percentages, counts)
- [ ] Add loading skeletons that match widget layouts
- [ ] Verify dark mode rendering on all 10 widgets
- [ ] Ensure responsive behavior on smaller screens

### Interactivity
- [ ] Widget-to-widget filtering (click a domain in leaderboard to filter other widgets)
- [ ] Add date range comparison mode (this period vs previous)
- [ ] Add a "refresh" button per widget (not just global)

---

## Implementation Priority

| Priority | Items | Rationale |
|----------|-------|-----------|
| **P0 - Must Fix** | Mock sparklines, number formatting, dark mode | These are visually broken or misleading |
| **P1 - High Value** | Conversion ratios, bug origins chart, completion %, severity colors | Make data actionable for decisions |
| **P2 - Nice to Have** | Drill-down, velocity trends, workload rebalancing | Advanced analytics features |

---

*This backlog will be refined as users provide feedback on what data is most valuable for Daily Huddles.*
