import type { CalendarEvent } from "./types";

const year = new Date().getFullYear();
const month = String(new Date().getMonth() + 1).padStart(2, "0");
const d = (day: number) => `${year}-${month}-${String(day).padStart(2, "0")}`;

const dt = (day: number, time: string, tz = "+00:00") =>
  `${year}-${month}-${String(day).padStart(2, "0")}T${time}:00${tz}`;

export const mockEvents: CalendarEvent[] = [
  // ── Multi-day: spans Mon→Fri (week-long sprint) ───────────────────────
  {
    id: "span-001",
    date: d(3),
    endDate: d(7),
    label: "Sprint 22",
    color: "#3B8BD4",
    priority: 3,
    data: {
      team: "Engineering",
      points: "42 estimated",
      status: "in progress",
    },
  },

  // ── Multi-day: crosses a row boundary (e.g. Thu→Tue next week) ────────
  {
    id: "span-002",
    date: d(9),
    endDate: d(13),
    label: "Design conference",
    color: "#9B59B6",
    priority: 2,
    data: {
      location: "San Francisco",
      attendees: "8 team members",
    },
  },

  // ── Multi-day: short 2-day event ──────────────────────────────────────
  {
    id: "span-003",
    date: d(15),
    endDate: d(16),
    label: "Hackathon",
    color: "#E67E22",
    priority: 2,
    data: {
      theme: "AI tooling",
      venue: "Main office",
      prizes: "3 awarded",
    },
  },

  // ── Multi-day: long span (almost 2 weeks) ─────────────────────────────
  {
    id: "span-004",
    date: d(18),
    endDate: d(28),
    label: "Q2 planning cycle",
    color: "#1D9E75",
    priority: 1,
    data: {
      owner: "Product",
      deliverable: "Roadmap v3",
      stakeholders: "Exec + leads",
    },
  },

  // ── Day 3 — single-day event (coexists with span-001 track) ──────────
  {
    id: "evt-001",
    date: d(3),
    label: "Team standup",
    color: "#E8593C",
    priority: 1,
    data: {
      time: "09:00 AM",
      duration: "15 min",
      organizer: "Sarah K.",
      location: "Zoom",
    },
    onClick: (e) => console.log("clicked", e.id),
  },

  // ── Day 5 — two single-day events ────────────────────────────────────
  {
    id: "evt-002",
    date: d(5),
    label: "Deploy v2.1",
    color: "#1D9E75",
    priority: 2,
    data: {
      environment: "production",
      version: "2.1.0",
      owner: "DevOps",
      status: "scheduled",
    },
  },
  {
    id: "evt-003",
    date: d(5),
    label: "QA review",
    color: "#E8593C",
    priority: 1,
    data: {
      assignee: "Mike R.",
      tickets: "14 open",
      sprint: "Sprint 22",
    },
  },

  // ── Day 8 — overflow test (4 events stacked with a span passing through)
  {
    id: "evt-004",
    date: d(8),
    label: "Design sync",
    color: "#9B59B6",
    priority: 4,
    data: {
      time: "10:00 AM",
      attendees: "5",
      figma: "link attached",
    },
  },
  {
    id: "evt-005",
    date: dt(8, "15:00"),
    timezone: "UTC",
    label: "Budget review",
    color: "#E67E22",
    priority: 3,
    data: {
      quarter: "Q2",
      presenter: "Finance team",
      room: "Board room A",
    },
  },
  {
    id: "evt-006",
    date: d(8),
    label: "1:1 with Alex",
    color: "#3B8BD4",
    priority: 2,
    data: {
      time: "2:00 PM",
      duration: "30 min",
      notes: "Career growth discussion",
    },
  },
  {
    id: "evt-007",
    date: d(8),
    label: "Infra cost audit",
    color: "#E8593C",
    priority: 1,
    data: {
      tool: "AWS Cost Explorer",
      assignee: "Priya M.",
    },
  },

  // ── Day 12 ────────────────────────────────────────────────────────────
  {
    id: "evt-008",
    date: d(12),
    label: "Public holiday",
    color: "#95A5A6",
    data: {
      note: "Office closed",
    },
  },

  // ── Day 20 ────────────────────────────────────────────────────────────
  {
    id: "evt-016",
    date: d(20),
    label: "Release cutoff",
    color: "#E8593C",
    priority: 2,
    data: {
      version: "2.2.0-rc1",
      owner: "Platform team",
      blocker: "none",
    },
  },
  {
    id: "evt-017",
    date: dt(20, "08:30", "+05:30"),
    timezone: "Asia/Colombo",
    label: "User interviews",
    color: "#9B59B6",
    priority: 1,
    data: {
      participants: "3 users",
      researcher: "Dana W.",
      time: "2:00 PM IST",
      tool: "Maze",
    },
  },
];
