export const ownerDashboardData = {
  owner: {
    name: "James Whitfield",
    company: "Whitfield Properties",
    initials: "JW",
  },

  overview: {
    date: "Wednesday, June 10, 2026",
    activeTenders: 9,
  },

  stats: [
    {
      title: "Total Tenders",
      value: "24",
      note: "+3 this month",
      icon: "bi-file-earmark-text",
      color: "blue",
    },
    {
      title: "Active Tenders",
      value: "9",
      note: "4 need attention",
      icon: "bi-graph-up-arrow",
      color: "green",
    },
    {
      title: "Submitted Bids",
      value: "142",
      note: "16 this week",
      icon: "bi-people",
      color: "purple",
    },
    {
      title: "AI Risk Flags",
      value: "3",
      note: "1 high priority",
      icon: "bi-exclamation-triangle",
      color: "red",
    },
  ],

  insights: [
    {
      type: "warning",
      text: "Suspiciously low bid detected on Eastfield Tower Complex — 34% below market average.",
      action: "Review bid →",
    },
    {
      type: "info",
      text: "3 contractors have improved their trust scores by >10 points this quarter.",
      action: "View details →",
    },
    {
      type: "success",
      text: "Al Noor Medical Center evaluation is 92% complete. Ready for shortlisting.",
      action: "Proceed →",
    },
  ],

  tenders: [
    {
      id: "T-2024-089",
      name: "Eastfield Tower Complex",
      status: "Active",
      bids: 12,
      budget: "$8.4M",
      deadline: "Jun 28, 2026",
      risk: "Low",
    },
    {
      id: "T-2024-090",
      name: "Al Noor Medical Center Expansion",
      status: "Under Review",
      bids: 8,
      budget: "$3.2M",
      deadline: "Jul 5, 2026",
      risk: "Med",
    },
    {
      id: "T-2024-091",
      name: "Marina Bridge Refurbishment",
      status: "Active",
      bids: 5,
      budget: "$1.8M",
      deadline: "Jul 12, 2026",
      risk: "Low",
    },
    {
      id: "T-2024-092",
      name: "Riverside Commercial Park",
      status: "Draft",
      bids: 0,
      budget: "$12.0M",
      deadline: "Aug 1, 2026",
      risk: "—",
    },
    {
      id: "T-2024-093",
      name: "Central Station Retrofit",
      status: "Awarded",
      bids: 14,
      budget: "$5.5M",
      deadline: "May 30, 2026",
      risk: "Low",
    },
  ],
};