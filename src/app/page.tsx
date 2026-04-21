"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useState } from "react";
import { HeroSection } from "@/components/HeroSection";
import { Navbar } from "@/components/Navbar";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetailModal } from "@/components/ProductDetailModal";
import { SellItemModal } from "@/components/SellItemModal";
import type { Product } from "@/data/mockData";

type ProductsApiResponse = Readonly<{
  products?: readonly Product[];
  trendingCategory?: string | null;
  error?: string;
}>;

export default function HomePage() {
  const refreshIntervalMs = 5500;
  const heroRotateIntervalMs = 5000;
  const [searchValue, setSearchValue] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [savedProducts, setSavedProducts] = useState<readonly string[]>([]);
  const [products, setProducts] = useState<readonly Product[]>([]);
  const [featuredProductId, setFeaturedProductId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isSellModalOpen, setIsSellModalOpen] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);
  const [trendingCategory, setTrendingCategory] = useState<string | null>(null);

  const loadProducts = useCallback(async (showSpinner: boolean): Promise<void> => {
    const abortController = new AbortController();

    try {
      if (showSpinner) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }

      setLoadError(null);

      const response = await fetch("/api/products", {
        cache: "no-store",
        signal: abortController.signal,
      });

      const payload = (await response.json()) as ProductsApiResponse;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load products.");
      }

      setProducts(payload.products ?? []);
      setTrendingCategory(payload.trendingCategory ?? null);
      setLastUpdatedAt(new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    } catch (error) {
      if (abortController.signal.aborted) {
        return;
      }

      if (showSpinner) {
        setProducts([]);
      }
      setLoadError(error instanceof Error ? error.message : "Failed to load products.");
    } finally {
      if (showSpinner) {
        setIsLoading(false);
      } else {
        setIsRefreshing(false);
      }
    }
  }, []);

  useEffect(() => {
    void loadProducts(true);

    const intervalId = window.setInterval(() => {
      void loadProducts(false);
    }, refreshIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [loadProducts]);

  useEffect(() => {
    if (products.length === 0) {
      setFeaturedProductId(null);
      return;
    }

    const pickRandomProductId = (currentId: string | null): string => {
      if (products.length === 1) {
        return products[0].id;
      }

      const currentProduct = currentId ? products.find((product) => product.id === currentId) : null;
      const differentSellerProducts = currentProduct
        ? products.filter((product) => product.id !== currentId && product.sellerHandle !== currentProduct.sellerHandle)
        : [];

      const otherProducts = products.filter((product) => product.id !== currentId);
      const pool = differentSellerProducts.length > 0 ? differentSellerProducts : otherProducts.length > 0 ? otherProducts : products;
      const randomIndex = Math.floor(Math.random() * pool.length);
      return pool[randomIndex].id;
    };

    setFeaturedProductId((currentId) => {
      if (currentId && products.some((product) => product.id === currentId)) {
        return currentId;
      }

      return pickRandomProductId(null);
    });

    const intervalId = window.setInterval(() => {
      setFeaturedProductId((currentId) => pickRandomProductId(currentId));
    }, heroRotateIntervalMs);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalize = (value: string): string => value.trim().toLowerCase().replace(/\s+/g, " ");
    const normalizedQuery = normalize(searchValue);

    return products.filter((product) => {
      const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
      const normalizedTitle = normalize(product.title);
      const normalizedProductCategory = normalize(product.category);
      const matchesSearch =
        normalizedQuery.length === 0 ||
        normalizedTitle.includes(normalizedQuery) ||
        normalizedProductCategory.includes(normalizedQuery);

      return matchesCategory && matchesSearch;
    });
  }, [products, searchValue, selectedCategory]);

  const featuredProduct = useMemo(() => {
    if (products.length === 0) {
      return null;
    }

    if (!featuredProductId) {
      return products[0];
    }

    return products.find((product) => product.id === featuredProductId) ?? products[0];
  }, [featuredProductId, products]);

  const toggleSavedProduct = (productId: string): void => {
    setSavedProducts((current) =>
      current.includes(productId) ? current.filter((savedId) => savedId !== productId) : [...current, productId],
    );
  };

  const handleDeleteItem = async (itemId: string, sellerEmail: string): Promise<void> => {
    const response = await fetch("/api/products", {
      method: "DELETE",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ itemId, sellerEmail }),
    });

    const payload = (await response.json()) as ProductsApiResponse;

    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to delete item.");
    }

    setSelectedProduct(null);
    await loadProducts(false);
  };

  return (
    <main className="min-h-screen bg-hero-radial">
      <Navbar
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        selectedCategory={selectedCategory}
        onCategoryChange={setSelectedCategory}
      />

      <HeroSection
        searchValue={searchValue}
        onSearchChange={setSearchValue}
        onQuickFilterSelect={(value) => {
          if (value === "trending") {
            setSelectedCategory(trendingCategory ?? "all");
            setSearchValue("");
            return;
          }

          setSelectedCategory(value);
          setSearchValue("");
        }}
        featuredProduct={featuredProduct}
        trendingCategory={trendingCategory}
      />

      <section className="px-4 pb-24 pt-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.24em] text-white/40">Latest on campus</p>
              <h2 className="mt-2 text-3xl font-black tracking-[-0.05em] text-white">
                {isLoading ? "Loading live listings..." : `${filteredProducts.length} curated listings`}
              </h2>
              <p className="mt-2 text-sm text-white/45">Buy items now and add your own sale listing with photos. New listings sync automatically.</p>
            </div>

            <div className="flex flex-col gap-2 text-sm text-white/52 sm:items-end">
              <div className="flex flex-wrap gap-2 sm:justify-end">
                <button type="button" onClick={() => setIsSellModalOpen(true)} className="rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm font-semibold text-white/78 hover:bg-white/10">
                  Sell an Item
                </button>
              </div>
            </div>
          </div>

          {loadError ? (
            <div className="mb-6 rounded-[1.5rem] border border-rose-400/20 bg-rose-500/10 px-5 py-4 text-sm text-rose-100">
              {loadError}
            </div>
          ) : null}

          <motion.div layout className="grid gap-5 md:grid-cols-2 xl:grid-cols-3" transition={{ layout: { duration: 0.35, ease: "easeInOut" } }}>
            <AnimatePresence mode="popLayout">
              {filteredProducts.map((product) => (
                <motion.div key={product.id} layout initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 18 }} transition={{ duration: 0.24 }}>
                  <ProductCard
                    product={product}
                    isSaved={savedProducts.includes(product.id)}
                    onOpen={setSelectedProduct}
                    onToggleSave={toggleSavedProduct}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>

          {!isLoading && filteredProducts.length === 0 ? (
            <div className="mt-10 rounded-[2rem] border border-white/10 bg-white/6 p-10 text-center text-white/68 backdrop-blur-xl">
              {loadError ? "No listings could be loaded from MySQL." : "No listings match the current filters."}
            </div>
          ) : null}
        </div>
      </section>

      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
        onDeleteItem={handleDeleteItem}
        onPurchased={async () => {
          await loadProducts(false);
        }}
      />
      <SellItemModal
        isOpen={isSellModalOpen}
        onClose={() => setIsSellModalOpen(false)}
        onCreated={() => {
          void loadProducts(false);
        }}
      />
    </main>
  );
}