"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ChevronDown, Search } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { categories } from "@/data/mockData";

export interface NavbarProps extends Readonly<{
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly selectedCategory: string;
  readonly onCategoryChange: (value: string) => void;
}> {}

export function Navbar({ searchValue, onSearchChange, selectedCategory, onCategoryChange }: NavbarProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header className="fixed inset-x-0 top-0 z-50 px-4 pt-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl rounded-[1.6rem] border border-white/10 bg-white/7 shadow-glass backdrop-blur-2xl">
        <div className="flex flex-col gap-4 px-4 py-4 lg:flex-row lg:items-center lg:justify-between lg:px-6">
          <div className="flex items-center justify-between gap-4">
            <button type="button" data-cursor="hover" className="group inline-flex items-center gap-3 text-left">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple text-sm font-black text-white shadow-glow">CO</span>
              <span>
                <span className="block text-sm uppercase tracking-[0.28em] text-white/42">Campus marketplace</span>
                <span className="block text-lg font-bold tracking-[-0.04em] text-white">Campus Olx</span>
              </span>
            </button>

            <button
              type="button"
              data-cursor="hover"
              onClick={() => setIsOpen((previous) => !previous)}
              className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 lg:hidden"
            >
              Categories
              <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-3 lg:flex-row lg:items-center lg:justify-center">
            <div className="relative w-full max-w-xl">
              <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-white/42" />
              <input
                aria-label="Navbar search"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search listings"
                className="w-full rounded-full border border-white/10 bg-graphite-850/70 py-3 pl-11 pr-4 text-sm text-white placeholder:text-white/36 outline-none transition-all duration-300 focus:border-neon-blue/40 focus:bg-graphite-850"
              />
            </div>

            <div className="hidden items-center gap-2 lg:flex">
              <Link
                href="/inbox"
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                Inbox
              </Link>

              <button
                type="button"
                data-cursor="hover"
                onClick={() => setIsOpen((previous) => !previous)}
                className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-3 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/10"
              >
                Categories
                <ChevronDown className={`h-4 w-4 transition-transform duration-300 ${isOpen ? "rotate-180" : ""}`} />
              </button>
            </div>
          </div>
        </div>

        <AnimatePresence>
          {isOpen ? (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.25 }}
              className="overflow-hidden border-t border-white/10 px-4 pb-4 lg:px-6"
            >
              <div className="pt-4">
                <Link
                  href="/inbox"
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-medium text-white/80 transition-colors hover:border-white/20 hover:bg-white/10"
                >
                  Inbox
                </Link>
              </div>

              <div className="flex flex-wrap gap-2 pt-4">
                {categories.map((category) => {
                  const isActive = selectedCategory === category.value;
                  return (
                    <button
                      key={category.value}
                      type="button"
                      data-cursor="hover"
                      onClick={() => onCategoryChange(category.value)}
                      className={`rounded-full px-4 py-2 text-sm transition-all duration-300 ${
                        isActive
                          ? "bg-white text-graphite-950"
                          : "border border-white/10 bg-white/5 text-white/72 hover:border-neon-blue/35 hover:bg-neon-blue/12 hover:text-white"
                      }`}
                    >
                      {category.label}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </header>
  );
}