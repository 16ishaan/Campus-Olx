"use client";

import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import type { Product } from "@/data/mockData";
import { quickFilters } from "@/data/mockData";

export interface HeroSectionProps extends Readonly<{
  readonly searchValue: string;
  readonly onSearchChange: (value: string) => void;
  readonly onQuickFilterSelect: (value: string) => void;
  readonly featuredProduct?: Product | null;
  readonly trendingCategory?: string | null;
}> {}

export function HeroSection({ searchValue, onSearchChange, onQuickFilterSelect, featuredProduct, trendingCategory }: HeroSectionProps) {
  const hasLivePreview = Boolean(featuredProduct);
  return (
    <section className="relative overflow-hidden px-4 pt-28 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="grid items-center gap-12 lg:grid-cols-[1.2fr_0.8fr]">
          <motion.div
            initial="hidden"
            animate="show"
            variants={{
              hidden: {},
              show: { transition: { staggerChildren: 0.12, delayChildren: 0.1 } },
            }}
            className="relative z-10"
          >
            <motion.span
              variants={{ hidden: { opacity: 0, y: 16 }, show: { opacity: 1, y: 0 } }}
              className="mb-5 inline-flex rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs font-medium uppercase tracking-[0.24em] text-white/70 backdrop-blur-xl"
            >
              Campus marketplace reimagined
            </motion.span>

            <motion.h1
              variants={{ hidden: { opacity: 0, y: 24 }, show: { opacity: 1, y: 0 } }}
              className="max-w-4xl text-5xl font-black tracking-[-0.06em] text-white sm:text-6xl lg:text-7xl"
            >
              Buy and sell in campus
            </motion.h1>

            <motion.p
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              className="mt-6 max-w-2xl text-base leading-7 text-white/68 sm:text-lg"
            >
              Discover textbooks, laptops, dorm essentials, and student-made finds in a premium marketplace that feels alive.
            </motion.p>

            <motion.div
              variants={{ hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } }}
              className="mt-8 flex max-w-2xl items-center gap-3 rounded-[1.5rem] border border-white/10 bg-white/6 p-2.5 backdrop-blur-2xl"
            >
              <Search className="ml-3 h-5 w-5 text-white/50" />
              <input
                aria-label="Search marketplace"
                value={searchValue}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Search textbooks, electronics, or dorm gear"
                className="w-full bg-transparent px-2 py-3 text-sm text-white placeholder:text-white/35 focus:outline-none sm:text-base"
              />
              <button
                type="button"
                data-cursor="hover"
                className="group inline-flex items-center gap-2 rounded-2xl bg-white px-5 py-3 text-sm font-semibold text-graphite-950 transition-transform duration-300 hover:-translate-y-0.5 hover:bg-white/95"
              >
                Explore
                <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
              </button>
            </motion.div>

            <motion.div variants={{ hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } }} className="mt-6 flex flex-wrap gap-3">
              {quickFilters.map((filter) => (
                <button
                  key={filter.value}
                  type="button"
                  data-cursor="hover"
                  onClick={() => onQuickFilterSelect(filter.value)}
                  className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/76 transition-all duration-300 hover:border-neon-blue/40 hover:bg-neon-blue/14 hover:text-white"
                >
                  {filter.value === "trending" && trendingCategory ? `Trending · ${trendingCategory}` : filter.label}
                </button>
              ))}
            </motion.div>
          </motion.div>

          <div className="relative flex min-h-[540px] items-center justify-center">
            <motion.div
              aria-hidden="true"
              animate={{ y: [0, -10, 0], rotate: [0, 1.5, 0] }}
              transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
              className="absolute inset-x-10 top-8 h-80 rounded-[2rem] bg-gradient-to-br from-neon-blue/22 via-neon-purple/16 to-transparent blur-3xl"
            />
            <motion.div
              animate={{ y: [0, -14, 0] }}
              transition={{ duration: 7, repeat: Infinity, ease: "easeInOut" }}
              className="relative w-full max-w-md rounded-[2rem] border border-white/12 bg-white/7 p-4 shadow-glass backdrop-blur-2xl"
            >
              <div className="rounded-[1.6rem] border border-white/10 bg-graphite-850/90 p-5">
                {hasLivePreview && featuredProduct ? (
                  <>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-white/55">Live campus listing</p>
                        <h2 className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-white">{featuredProduct.title}</h2>
                      </div>
                      <span className="rounded-full border border-neon-mint/25 bg-neon-mint/12 px-3 py-1 text-xs font-semibold text-neon-mint">
                        {featuredProduct.featured ? "Featured" : featuredProduct.condition}
                      </span>
                    </div>

                    <div className="mt-6 grid gap-3 sm:grid-cols-[1.1fr_0.9fr]">
                      <div className="overflow-hidden rounded-[1.5rem] border border-white/10 bg-gradient-to-br from-white/12 to-white/5 p-4">
                        <div className="relative flex h-full min-h-56 flex-col justify-between overflow-hidden rounded-[1.2rem] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(78,141,255,0.4),transparent_44%),linear-gradient(160deg,rgba(255,255,255,0.08),rgba(255,255,255,0.03))] p-4">
                          <img src={featuredProduct.images[0]} alt={featuredProduct.title} className="absolute inset-0 h-full w-full object-cover opacity-35 mix-blend-screen" />
                          <div className="relative z-10 flex h-full flex-col justify-between">
                            <span className="w-fit rounded-full bg-white/12 px-3 py-1 text-xs text-white/72">{featuredProduct.postedAt}</span>
                            <div>
                              <p className="text-3xl font-black tracking-[-0.05em] text-white">{featuredProduct.price}</p>
                              <p className="mt-1 text-sm text-white/56">{featuredProduct.title}</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="grid gap-3">
                        <div className="rounded-[1.35rem] border border-white/10 bg-white/7 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/42">Seller</p>
                          <p className="mt-2 text-lg font-semibold text-white">{featuredProduct.sellerHandle}</p>
                          <p className="text-sm text-white/55">
                            {featuredProduct.sellerPhone ? `Phone ${featuredProduct.sellerPhone}` : "Phone not provided"} • {featuredProduct.sellerRating}
                          </p>
                        </div>
                        <div className="rounded-[1.35rem] border border-white/10 bg-white/7 p-4">
                          <p className="text-xs uppercase tracking-[0.2em] text-white/42">Pickup</p>
                          <p className="mt-2 text-lg font-semibold text-white">{featuredProduct.location}</p>
                          <p className="text-sm text-white/55">Safe campus handoff</p>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-[1.35rem] border border-white/10 bg-white/7 p-6 text-center">
                    <p className="text-sm uppercase tracking-[0.2em] text-white/42">Live campus listing</p>
                    <p className="mt-3 text-lg font-semibold text-white">No live listings available right now</p>
                    <p className="mt-2 text-sm text-white/55">Publish a new item to see real-time data here.</p>
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}