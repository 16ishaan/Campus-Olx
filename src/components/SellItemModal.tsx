"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Upload, X } from "lucide-react";
import { useMemo, useState } from "react";

export interface SellItemModalProps extends Readonly<{
  readonly isOpen: boolean;
  readonly onClose: () => void;
  readonly onCreated: () => void;
}> {}

const categoryOptions = [
  { label: "Electronics", value: "1" },
  { label: "Books", value: "2" },
  { label: "Furniture", value: "3" },
  { label: "Clothing", value: "4" },
  { label: "Sports", value: "5" },
  { label: "Vehicles", value: "6" },
  { label: "Stationery", value: "7" },
  { label: "Appliances", value: "8" },
  { label: "Accessories", value: "9" },
  { label: "Others", value: "10" },
] as const;

export function SellItemModal({ isOpen, onClose, onCreated }: SellItemModalProps) {
  const [title, setTitle] = useState("");
  const [price, setPrice] = useState("");
  const [categoryId, setCategoryId] = useState("1");
  const [conditionStatus, setConditionStatus] = useState("Good");
  const [sellerName, setSellerName] = useState("");
  const [sellerEmail, setSellerEmail] = useState("");
  const [sellerPhone, setSellerPhone] = useState("");
  const [itemPhotos, setItemPhotos] = useState<readonly File[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const previewSummary = useMemo(() => {
    return `${itemPhotos.length} item photo${itemPhotos.length === 1 ? "" : "s"}`;
  }, [itemPhotos.length]);

  const resetForm = (): void => {
    setTitle("");
    setPrice("");
    setCategoryId("1");
    setConditionStatus("Good");
    setSellerName("");
    setSellerEmail("");
    setSellerPhone("");
    setItemPhotos([]);
    setErrorMessage(null);
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    if (itemPhotos.length === 0) {
      setErrorMessage("Please add at least one item photo.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      formData.append("title", title);
      formData.append("price", price);
      formData.append("categoryId", categoryId);
      formData.append("conditionStatus", conditionStatus);
      formData.append("sellerName", sellerName);
      formData.append("sellerEmail", sellerEmail);
      formData.append("sellerPhone", sellerPhone);

      for (const photo of itemPhotos) {
        formData.append("photos", photo);
      }

      const response = await fetch("/api/products", {
        method: "POST",
        body: formData,
      });

      const payload = (await response.json()) as Readonly<{ error?: string }>;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to create listing.");
      }

      resetForm();
      onCreated();
      onClose();
    } catch (submitError) {
      setErrorMessage(submitError instanceof Error ? submitError.message : "Failed to create listing.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[80] flex items-end justify-center bg-graphite-950/80 p-4 backdrop-blur-xl sm:items-center sm:p-6"
        >
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 220, damping: 24 }}
            className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-graphite-900 shadow-glass"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(78,141,255,0.16),transparent_25%),radial-gradient(circle_at_left_bottom,rgba(92,244,192,0.12),transparent_22%)]" />

            <form onSubmit={handleSubmit} className="relative space-y-6 p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.22em] text-white/42">Sell item</p>
                  <h2 className="mt-2 text-3xl font-black tracking-[-0.06em] text-white">Post a live listing</h2>
                  <p className="mt-2 text-sm leading-6 text-white/58">Add your item, attach photos, and it appears on the marketplace as soon as it’s saved.</p>
                </div>

                <button
                  type="button"
                  data-cursor="hover"
                  onClick={onClose}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/76 transition-colors hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              {errorMessage ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-500/10 px-4 py-3 text-sm text-rose-100">{errorMessage}</div>
              ) : null}

              <div className="grid gap-4 md:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/70">Title</span>
                  <input value={title} onChange={(event) => setTitle(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-neon-blue/40" placeholder="Laptop, notebook, chair..." />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/70">Price</span>
                  <input value={price} onChange={(event) => setPrice(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-neon-blue/40" placeholder="500.00" />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/70">Category</span>
                  <select value={categoryId} onChange={(event) => setCategoryId(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none focus:border-neon-blue/40">
                    {categoryOptions.map((category) => (
                      <option key={category.value} value={category.value} className="bg-graphite-900 text-white">
                        {category.label}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/70">Condition</span>
                  <select value={conditionStatus} onChange={(event) => setConditionStatus(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none focus:border-neon-blue/40">
                    {["New", "Like new", "Good", "Used", "Fair"].map((condition) => (
                      <option key={condition} value={condition} className="bg-graphite-900 text-white">
                        {condition}
                      </option>
                    ))}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/70">Seller name</span>
                  <input value={sellerName} onChange={(event) => setSellerName(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-neon-blue/40" placeholder="Your name" />
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-white/70">Email</span>
                  <input type="email" value={sellerEmail} onChange={(event) => setSellerEmail(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-neon-blue/40" placeholder="you@campus.com" />
                </label>

                <label className="space-y-2 md:col-span-2">
                  <span className="text-sm font-medium text-white/70">Phone</span>
                  <input value={sellerPhone} onChange={(event) => setSellerPhone(event.target.value)} className="w-full rounded-2xl border border-white/10 bg-white/6 px-4 py-3 text-white outline-none placeholder:text-white/30 focus:border-neon-blue/40" placeholder="Contact number" />
                </label>
              </div>

              <div className="grid gap-4 md:grid-cols-1">
                <label className="rounded-[1.5rem] border border-dashed border-white/15 bg-white/4 p-4 transition-colors hover:border-neon-blue/35">
                  <span className="flex items-center gap-2 text-sm font-medium text-white/72">
                    <Upload className="h-4 w-4" />
                    Item photos
                  </span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(event) => setItemPhotos(Array.from(event.target.files ?? []))}
                    className="mt-3 block w-full text-sm text-white/62 file:mr-4 file:rounded-full file:border-0 file:bg-white file:px-4 file:py-2 file:text-sm file:font-semibold file:text-graphite-950"
                  />
                </label>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <p className="text-sm text-white/48">{previewSummary}</p>

                <div className="flex gap-3">
                  <button type="button" onClick={onClose} className="rounded-full border border-white/10 bg-white/6 px-5 py-3 text-sm font-semibold text-white/74 hover:bg-white/10">
                    Cancel
                  </button>
                  <button type="submit" disabled={isSubmitting} className="rounded-full bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink px-5 py-3 text-sm font-semibold text-white shadow-glow disabled:cursor-not-allowed disabled:opacity-60">
                    {isSubmitting ? "Publishing..." : "Publish item"}
                  </button>
                </div>
              </div>
            </form>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}