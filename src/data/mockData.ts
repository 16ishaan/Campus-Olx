export interface Product {
  readonly id: string;
  readonly title: string;
  readonly category: string;
  readonly price: string;
  readonly postedAt: string;
  readonly description: string;
  readonly condition: string;
  readonly sellerName: string;
  readonly sellerHandle: string;
  readonly sellerEmail: string;
  readonly sellerPhone?: string;
  readonly sellerDorm: string;
  readonly sellerRating: string;
  readonly location: string;
  readonly images: readonly string[];
  readonly sellerImage?: string;
  readonly featured?: boolean;
}

export interface CategoryOption {
  readonly label: string;
  readonly value: string;
}

export interface QuickFilter {
  readonly label: string;
  readonly value: string;
}

const createGradientImage = (label: string, colorA: string, colorB: string, accent: string): string => {
  const svg = `
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600" fill="none">
      <defs>
        <linearGradient id="bg" x1="0" x2="1" y1="0" y2="1">
          <stop offset="0%" stop-color="${colorA}" />
          <stop offset="100%" stop-color="${colorB}" />
        </linearGradient>
        <radialGradient id="glow" cx="50%" cy="35%" r="65%">
          <stop offset="0%" stop-color="${accent}" stop-opacity="0.9" />
          <stop offset="100%" stop-color="${accent}" stop-opacity="0" />
        </radialGradient>
      </defs>
      <rect width="800" height="600" rx="44" fill="url(#bg)" />
      <circle cx="630" cy="140" r="180" fill="url(#glow)" />
      <circle cx="190" cy="470" r="230" fill="url(#glow)" opacity="0.55" />
      <rect x="88" y="92" width="624" height="416" rx="32" fill="rgba(255,255,255,0.08)" stroke="rgba(255,255,255,0.16)" />
      <text x="110" y="174" fill="white" font-family="Arial, sans-serif" font-size="42" font-weight="700">${label}</text>
      <text x="110" y="224" fill="rgba(255,255,255,0.78)" font-family="Arial, sans-serif" font-size="20">Campus-ready placeholder image</text>
    </svg>
  `;

  return `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(svg)}`;
};

export const categories: readonly CategoryOption[] = [
  { label: "All", value: "all" },
  { label: "Electronics", value: "Electronics" },
  { label: "Books", value: "Books" },
  { label: "Furniture", value: "Furniture" },
  { label: "Clothing", value: "Clothing" },
  { label: "Sports", value: "Sports" },
  { label: "Vehicles", value: "Vehicles" },
  { label: "Stationery", value: "Stationery" },
  { label: "Appliances", value: "Appliances" },
  { label: "Accessories", value: "Accessories" },
  { label: "Others", value: "Others" },
];

export const quickFilters: readonly QuickFilter[] = [
  { label: "Trending", value: "trending" },
  { label: "Electronics", value: "Electronics" },
  { label: "Books", value: "Books" },
  { label: "Furniture", value: "Furniture" },
  { label: "Clothing", value: "Clothing" },
  { label: "Sports", value: "Sports" },
  { label: "Vehicles", value: "Vehicles" },
];

export const products: readonly Product[] = [
  {
    id: "1",
    title: "MacBook Air M2 - 16GB",
    category: "Electronics",
    price: "$1,020",
    postedAt: "12 min ago",
    description: "Lightly used MacBook Air with a bright display, silent keyboard, and a battery that still clears a full day of classes.",
    condition: "Like new",
    sellerName: "Aarav S.",
    sellerHandle: "@aarav.tech",
    sellerEmail: "aarav.tech@campus.olx",
    sellerDorm: "North Hall",
    sellerRating: "4.9",
    location: "Engineering Block",
    featured: true,
    images: [
      createGradientImage("MacBook Air", "#172034", "#0d1220", "#4e8dff"),
      createGradientImage("Performance View", "#1a132c", "#0b0d12", "#9b7cff"),
      createGradientImage("Campus-Ready", "#14231f", "#0b0d12", "#5cf4c0"),
    ],
  },
  {
    id: "2",
    title: "Organic Chemistry Notes Bundle",
    category: "Books",
    price: "$18",
    postedAt: "34 min ago",
    description: "Scanned, indexed, and highlighted notes from the last semester. Ideal for fast revision before midterms.",
    condition: "Used",
    sellerName: "Mira K.",
    sellerHandle: "@mira.studies",
    sellerEmail: "mira.studies@campus.olx",
    sellerDorm: "East Block",
    sellerRating: "4.8",
    location: "Library Lobby",
    images: [
      createGradientImage("Notes Bundle", "#2a1f12", "#0b0d12", "#ffb357"),
      createGradientImage("Revision Pack", "#23233a", "#0b0d12", "#ff67d3"),
      createGradientImage("Exam Prep", "#111f2d", "#0b0d12", "#44e3ff"),
    ],
  },
  {
    id: "3",
    title: "Noise Cancelling Headphones",
    category: "Electronics",
    price: "$120",
    postedAt: "1 hour ago",
    description: "Comfortable over-ear headphones with deep bass and enough battery to carry you through every lecture block.",
    condition: "Good",
    sellerName: "Kabir R.",
    sellerHandle: "@kabir.audio",
    sellerEmail: "kabir.audio@campus.olx",
    sellerDorm: "West Hall",
    sellerRating: "4.7",
    location: "Student Center",
    images: [
      createGradientImage("Headphones", "#1a1530", "#0b0d12", "#9b7cff"),
      createGradientImage("Audio Gear", "#10252e", "#0b0d12", "#44e3ff"),
      createGradientImage("Portable Sound", "#1d1419", "#0b0d12", "#ff67d3"),
    ],
  },
  {
    id: "4",
    title: "Mini Fridge for Dorm Rooms",
    category: "Appliances",
    price: "$75",
    postedAt: "2 hours ago",
    description: "Compact fridge with adjustable shelves and a clean finish. Great for snacks, drinks, and late-night survival.",
    condition: "Excellent",
    sellerName: "Nina P.",
    sellerHandle: "@nina.dorms",
    sellerEmail: "nina.dorms@campus.olx",
    sellerDorm: "South Quad",
    sellerRating: "5.0",
    location: "Dorm Row B",
    images: [
      createGradientImage("Mini Fridge", "#132028", "#0b0d12", "#5cf4c0"),
      createGradientImage("Dorm Upgrade", "#251b2f", "#0b0d12", "#9b7cff"),
      createGradientImage("Storage", "#152b37", "#0b0d12", "#4e8dff"),
    ],
  },
  {
    id: "5",
    title: "Mechanical Keyboard - Hot Swappable",
    category: "Accessories",
    price: "$88",
    postedAt: "2 hours ago",
    description: "Clicky, tactile, and tuned for long coding sessions or note-taking marathons. Includes cable and keycap set.",
    condition: "Like new",
    sellerName: "Ishan T.",
    sellerHandle: "@ishan.builds",
    sellerEmail: "ishan.builds@campus.olx",
    sellerDorm: "Tech House",
    sellerRating: "4.8",
    location: "Innovation Lab",
    featured: true,
    images: [
      createGradientImage("Keyboard", "#1d1323", "#0b0d12", "#ff67d3"),
      createGradientImage("Hot Swap", "#161d31", "#0b0d12", "#4e8dff"),
      createGradientImage("Desk Setup", "#14231f", "#0b0d12", "#5cf4c0"),
    ],
  },
  {
    id: "6",
    title: "Calculator + Formula Sheets",
    category: "Stationery",
    price: "$25",
    postedAt: "4 hours ago",
    description: "Exam-safe bundle with a graphing calculator, formula sheets, and laminated quick-reference cards.",
    condition: "Good",
    sellerName: "Rhea D.",
    sellerHandle: "@rhea.examready",
    sellerEmail: "rhea.examready@campus.olx",
    sellerDorm: "Central Apartments",
    sellerRating: "4.6",
    location: "Math Department",
    images: [
      createGradientImage("Calculator", "#19222a", "#0b0d12", "#44e3ff"),
      createGradientImage("Formula Sheet", "#231a16", "#0b0d12", "#ffb357"),
      createGradientImage("Study Kit", "#1b1630", "#0b0d12", "#9b7cff"),
    ],
  },
];