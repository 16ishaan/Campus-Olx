"use client";

import { motion } from "framer-motion";
import { Bookmark, Clock4, MapPin } from "lucide-react";
import { cn } from "@/lib/cn";
import type { Product } from "@/data/mockData";

export interface ProductCardProps extends Readonly<{
  readonly product: Product;
  readonly isSaved: boolean;
  readonly onOpen: (product: Product) => void;
  readonly onToggleSave: (productId: string) => void;
}> {}

export function ProductCard({ product, isSaved, onOpen, onToggleSave }: ProductCardProps) {
  return (
    <motion.article
      data-cursor="hover"
      onClick={() => onOpen(product)}
      whileHover={{ y: -8, rotateX: 6, rotateY: -6, scale: 1.01 }}
      transition={{ type: "spring", stiffness: 260, damping: 20 }}
      className="group relative cursor-pointer overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/6 shadow-glass backdrop-blur-xl"
      style={{ transformStyle: "preserve-3d" }}
    >
      <div className="relative aspect-[4/3] overflow-hidden">
        <img
          src={product.images[0]}
          alt={product.title}
          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-graphite-950/90 via-graphite-950/25 to-transparent" />

        <button
          type="button"
          data-cursor="hover"
          aria-label={isSaved ? `Remove ${product.title} from saved` : `Save ${product.title}`}
          onClick={(event) => {
            event.stopPropagation();
            onToggleSave(product.id);
          }}
          className={cn(
            "absolute right-4 top-4 inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/12 backdrop-blur-xl transition-all duration-300",
            isSaved ? "bg-white text-graphite-950 shadow-glow" : "bg-white/10 text-white hover:bg-white/18",
          )}
        >
          <Bookmark className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} />
        </button>

        <div className="absolute bottom-0 left-0 right-0 p-5">
          <div className="flex items-center gap-2 text-xs font-medium text-white/70">
            <Clock4 className="h-3.5 w-3.5" />
            {product.postedAt}
          </div>
          <h3 className="mt-2 text-xl font-semibold tracking-[-0.04em] text-white">{product.title}</h3>
        </div>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-center justify-between gap-4">
          <div>
            <p className="text-2xl font-black tracking-[-0.04em] text-white">{product.price}</p>
            <p className="text-sm text-white/50">{product.condition}</p>
          </div>
          <span className="rounded-full border border-neon-blue/20 bg-neon-blue/12 px-3 py-1 text-xs font-semibold text-neon-blue">{product.category}</span>
        </div>

        <div className="flex items-center justify-between gap-3 text-sm text-white/62">
          <div className="flex items-center gap-2">
            <MapPin className="h-4 w-4 text-white/38" />
            <span>{product.location}</span>
          </div>
          <span className="rounded-full border border-white/10 bg-white/5 px-3 py-1">{product.sellerRating} rating</span>
        </div>
      </div>
    </motion.article>
  );
}