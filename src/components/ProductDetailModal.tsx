"use client";

import { AnimatePresence, motion } from "framer-motion";
import { ArrowLeft, CreditCard, Image as ImageIcon, Mail, MapPin, MessageCircle, Phone, Send, ShieldCheck, ShoppingBag, Star, Trash2, User, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import type { Product } from "@/data/mockData";
import { useEscapeKey } from "@/hooks/useEscapeKey";

export interface ProductDetailModalProps extends Readonly<{
  readonly product: Product | null;
  readonly onClose: () => void;
  readonly onDeleteItem: (itemId: string, sellerEmail: string) => Promise<void>;
  readonly onPurchased: () => Promise<void>;
}> {}

export function ProductDetailModal({ product, onClose, onDeleteItem, onPurchased }: ProductDetailModalProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isContactFormOpen, setIsContactFormOpen] = useState(false);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [buyerMessage, setBuyerMessage] = useState("");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [contactSuccess, setContactSuccess] = useState<string | null>(null);
  const [contactError, setContactError] = useState<string | null>(null);
  const [isBuyFormOpen, setIsBuyFormOpen] = useState(false);
  const [transactionBuyerName, setTransactionBuyerName] = useState("");
  const [transactionBuyerEmail, setTransactionBuyerEmail] = useState("");
  const [transactionBuyerPhone, setTransactionBuyerPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("Cash");
  const [isBuying, setIsBuying] = useState(false);
  const [buySuccess, setBuySuccess] = useState<string | null>(null);
  const [buyError, setBuyError] = useState<string | null>(null);
  const [isReviewFormOpen, setIsReviewFormOpen] = useState(false);
  const [reviewerName, setReviewerName] = useState("");
  const [reviewerEmail, setReviewerEmail] = useState("");
  const [reviewerPhone, setReviewerPhone] = useState("");
  const [reviewRating, setReviewRating] = useState("5");
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewSuccess, setReviewSuccess] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [sellerRatingText, setSellerRatingText] = useState("");
  const [sellerEmailConfirm, setSellerEmailConfirm] = useState("");
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteError, setDeleteError] = useState<string | null>(null);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    setActiveIndex(0);
    setIsContactFormOpen(false);
    setBuyerName("");
    setBuyerEmail("");
    setBuyerPhone("");
    setBuyerMessage("");
    setIsSendingMessage(false);
    setContactSuccess(null);
    setContactError(null);
    setIsBuyFormOpen(false);
    setTransactionBuyerName("");
    setTransactionBuyerEmail("");
    setTransactionBuyerPhone("");
    setPaymentMethod("Cash");
    setIsBuying(false);
    setBuySuccess(null);
    setBuyError(null);
    setIsReviewFormOpen(false);
    setReviewerName("");
    setReviewerEmail("");
    setReviewerPhone("");
    setReviewRating("5");
    setReviewComment("");
    setIsSubmittingReview(false);
    setReviewSuccess(null);
    setReviewError(null);
    setSellerRatingText(product?.sellerRating ?? "");
    setSellerEmailConfirm("");
    setDeleteError(null);
    setIsDeleting(false);
  }, [product]);

  useEffect(() => {
    if (!product) {
      if (scrollContainerRef.current) {
        scrollContainerRef.current.scrollTo({ top: 0 });
      }
      return;
    }

    const animationFrameId = window.requestAnimationFrame(() => {
      const container = scrollContainerRef.current;
      if (!container) {
        return;
      }

      container.scrollTo({ top: container.scrollHeight, behavior: "smooth" });
    });

    return () => {
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [product]);

  useEscapeKey(() => {
    if (product) {
      onClose();
    }
  });

  const activeImage = useMemo(() => product?.images[activeIndex] ?? null, [activeIndex, product]);

  if (!product) {
    return null;
  }

  const canDelete = sellerEmailConfirm.trim().toLowerCase() === product.sellerEmail.trim().toLowerCase();

  const handleSubmitReview = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    try {
      setIsSubmittingReview(true);
      setReviewError(null);
      setReviewSuccess(null);

      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: product.id,
          reviewerName,
          reviewerEmail,
          reviewerPhone,
          rating: Number(reviewRating),
          comment: reviewComment,
        }),
      });

      const payload = (await response.json()) as Readonly<{
        error?: string;
        sellerRating?: number;
        sellerReviewCount?: number;
      }>;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to submit review.");
      }

      const rating = Number(payload.sellerRating ?? 0);
      const count = Number(payload.sellerReviewCount ?? 0);
      if (rating > 0 && count > 0) {
        setSellerRatingText(`${rating.toFixed(1)} (${count} review${count === 1 ? "" : "s"})`);
      }

      setReviewSuccess("Review submitted successfully.");
      setReviewComment("");
      setReviewerPhone("");
    } catch (error) {
      setReviewError(error instanceof Error ? error.message : "Failed to submit review.");
    } finally {
      setIsSubmittingReview(false);
    }
  };

  const handleSendMessage = async (): Promise<void> => {
    try {
      setIsSendingMessage(true);
      setContactError(null);
      setContactSuccess(null);

      const response = await fetch("/api/messages", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: product.id,
          buyerName,
          buyerEmail,
          buyerPhone,
          message: buyerMessage,
        }),
      });

      const payload = (await response.json()) as Readonly<{ error?: string; sellerName?: string }>;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to send message.");
      }

      setContactSuccess(`Your message was sent to ${payload.sellerName ?? product.sellerName}.`);
      setBuyerMessage("");
      setBuyerPhone("");
    } catch (error) {
      setContactError(error instanceof Error ? error.message : "Failed to send message.");
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleSendMessageSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
    await handleSendMessage();
  };

  const handleDelete = async (): Promise<void> => {
    try {
      setIsDeleting(true);
      setDeleteError(null);
      await onDeleteItem(product.id, sellerEmailConfirm);
    } catch (error) {
      setDeleteError(error instanceof Error ? error.message : "Failed to delete item.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleBuySubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();

    try {
      setIsBuying(true);
      setBuyError(null);
      setBuySuccess(null);

      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId: product.id,
          buyerName: transactionBuyerName,
          buyerEmail: transactionBuyerEmail,
          buyerPhone: transactionBuyerPhone,
          paymentMethod,
        }),
      });

      const payload = (await response.json()) as Readonly<{
        error?: string;
        transaction?: Readonly<{ transactionId?: number }>;
      }>;

      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to complete purchase.");
      }

      setBuySuccess(`Transaction #${payload.transaction?.transactionId ?? ""} completed successfully.`.trim());
      setTransactionBuyerPhone("");
      await onPurchased();
      onClose();
    } catch (error) {
      setBuyError(error instanceof Error ? error.message : "Failed to complete purchase.");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[70] flex items-end justify-center bg-graphite-950/80 p-4 backdrop-blur-xl sm:items-center sm:p-6"
      >
        <motion.div
          initial={{ opacity: 0, y: 36, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 24, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 220, damping: 24 }}
          className="relative w-full max-w-6xl overflow-hidden rounded-[2rem] border border-white/10 bg-graphite-900 shadow-glass max-h-[calc(100vh-2rem)]"
        >
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(78,141,255,0.16),transparent_30%),radial-gradient(circle_at_left_bottom,rgba(155,124,255,0.16),transparent_28%)]" />

          <div ref={scrollContainerRef} className="relative grid max-h-[calc(100vh-2rem)] gap-0 overflow-y-auto lg:grid-cols-[1.15fr_0.85fr]">
            <div className="border-b border-white/10 p-4 sm:p-6 lg:border-b-0 lg:border-r">
              <div className="flex items-center justify-between">
                <button
                  type="button"
                  data-cursor="hover"
                  onClick={onClose}
                  className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/6 px-4 py-2 text-sm text-white/76 transition-colors hover:bg-white/10"
                >
                  <ArrowLeft className="h-4 w-4" />
                  Back
                </button>

                <button
                  type="button"
                  data-cursor="hover"
                  onClick={onClose}
                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-white/10 bg-white/6 text-white/76 transition-colors hover:bg-white/10"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="mt-5 overflow-hidden rounded-[1.8rem] border border-white/10 bg-graphite-850">
                {activeImage ? <img src={activeImage} alt={product.title} className="h-[420px] w-full object-cover" /> : null}
              </div>

              <div className="mt-4 grid grid-cols-3 gap-3">
                {product.images.map((image, index) => (
                  <button
                    key={`${product.id}-${index}`}
                    type="button"
                    data-cursor="hover"
                    onClick={() => setActiveIndex(index)}
                    className={`overflow-hidden rounded-[1.25rem] border transition-all duration-300 ${
                      activeIndex === index ? "border-neon-blue/50 shadow-glow" : "border-white/10 hover:border-white/20"
                    }`}
                  >
                    <img src={image} alt={`${product.title} preview ${index + 1}`} className="h-28 w-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-6 p-5 sm:p-6 lg:p-8">
              <div>
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.22em] text-white/44">
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1">{product.category}</span>
                  {product.featured ? <span className="rounded-full border border-neon-mint/25 bg-neon-mint/12 px-3 py-1 text-neon-mint">Featured</span> : null}
                </div>

                <h2 className="mt-4 text-3xl font-black tracking-[-0.06em] text-white sm:text-4xl">{product.title}</h2>
                <div className="mt-3 flex items-center gap-3">
                  <p className="text-4xl font-black tracking-[-0.06em] text-white">{product.price}</p>
                  <span className="rounded-full border border-white/10 bg-white/6 px-3 py-1 text-sm text-white/70">{product.condition}</span>
                </div>
              </div>

              <p className="text-base leading-8 text-white/70">{product.description}</p>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">Seller</p>
                  <div className="mt-3 flex items-center gap-3">
                    {product.sellerImage ? (
                      <img src={product.sellerImage} alt={product.sellerName} className="h-12 w-12 rounded-2xl border border-white/10 object-cover" />
                    ) : (
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-neon-blue to-neon-purple text-sm font-black text-white">
                        {product.sellerName.slice(0, 1)}
                      </div>
                    )}
                    <div>
                      <p className="text-lg font-semibold text-white">{product.sellerHandle}</p>
                      <p className="text-sm text-white/55">{product.sellerDorm}</p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                  <p className="text-xs uppercase tracking-[0.24em] text-white/40">Campus safe handoff</p>
                  <div className="mt-3 flex items-center gap-3 text-white/78">
                    <ShieldCheck className="h-5 w-5 text-neon-mint" />
                    Masked seller info and public pickup points only
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center gap-2 text-white/72">
                    <MapPin className="h-4 w-4 text-white/40" />
                    {product.location}
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-white/72">
                    <ImageIcon className="h-4 w-4 text-white/40" />
                    {product.images.length} gallery images
                  </div>
                </div>

                <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                  <div className="flex items-center gap-2 text-white/72">
                    <Star className="h-4 w-4 text-neon-blue" />
                    {sellerRatingText || product.sellerRating}
                  </div>
                  <p className="mt-3 text-sm text-white/54">Posted {product.postedAt}</p>

                  <button
                    type="button"
                    onClick={() => setIsReviewFormOpen((current) => !current)}
                    className="mt-4 inline-flex items-center rounded-full border border-white/10 bg-white/8 px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em] text-white/84 transition-colors hover:bg-white/12"
                  >
                    {isReviewFormOpen ? "Hide review" : "Review seller"}
                  </button>

                  <AnimatePresence initial={false}>
                    {isReviewFormOpen ? (
                      <motion.form
                        initial={{ opacity: 0, y: 12, height: 0 }}
                        animate={{ opacity: 1, y: 0, height: "auto" }}
                        exit={{ opacity: 0, y: 12, height: 0 }}
                        transition={{ duration: 0.22 }}
                        onSubmit={(event) => {
                          void handleSubmitReview(event);
                        }}
                        className="mt-4 space-y-3 overflow-hidden"
                      >
                        <input
                          value={reviewerName}
                          onChange={(event) => setReviewerName(event.target.value)}
                          placeholder="Your name"
                          className="w-full rounded-xl border border-white/10 bg-graphite-850 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                        />

                        <input
                          value={reviewerEmail}
                          onChange={(event) => setReviewerEmail(event.target.value)}
                          placeholder="Your email"
                          type="email"
                          className="w-full rounded-xl border border-white/10 bg-graphite-850 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                        />

                        <input
                          value={reviewerPhone}
                          onChange={(event) => setReviewerPhone(event.target.value)}
                          placeholder="Phone (optional)"
                          className="w-full rounded-xl border border-white/10 bg-graphite-850 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                        />

                        <select
                          value={reviewRating}
                          onChange={(event) => setReviewRating(event.target.value)}
                          className="w-full rounded-xl border border-white/10 bg-graphite-850 px-3 py-2 text-sm text-white outline-none focus:border-neon-blue/50"
                        >
                          <option value="5" className="bg-graphite-900 text-white">5 - Excellent</option>
                          <option value="4" className="bg-graphite-900 text-white">4 - Very good</option>
                          <option value="3" className="bg-graphite-900 text-white">3 - Good</option>
                          <option value="2" className="bg-graphite-900 text-white">2 - Fair</option>
                          <option value="1" className="bg-graphite-900 text-white">1 - Poor</option>
                        </select>

                        <textarea
                          value={reviewComment}
                          onChange={(event) => setReviewComment(event.target.value)}
                          rows={3}
                          placeholder="Write your review"
                          className="w-full rounded-xl border border-white/10 bg-graphite-850 px-3 py-2 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                        />

                        <button
                          type="submit"
                          disabled={isSubmittingReview || !reviewerName.trim() || !reviewerEmail.trim()}
                          className="inline-flex w-full items-center justify-center rounded-xl border border-white/10 bg-white/10 px-3 py-2 text-sm font-semibold text-white transition-colors hover:bg-white/14 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          {isSubmittingReview ? "Submitting..." : "Submit review"}
                        </button>

                        {reviewSuccess ? <p className="text-sm text-neon-mint">{reviewSuccess}</p> : null}
                        {reviewError ? <p className="text-sm text-rose-200">{reviewError}</p> : null}
                      </motion.form>
                    ) : null}
                  </AnimatePresence>
                </div>
              </div>

              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                <button
                  type="button"
                  data-cursor="hover"
                  onClick={() => setIsBuyFormOpen((current) => !current)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon-mint via-neon-blue to-neon-purple px-5 py-4 text-base font-semibold text-white shadow-glow transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <ShoppingBag className="h-4 w-4" />
                  {isBuyFormOpen ? "Hide buy form" : "Buy Item"}
                </button>

                <AnimatePresence initial={false}>
                  {isBuyFormOpen ? (
                    <motion.form
                      initial={{ opacity: 0, y: 16, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: 12, height: 0 }}
                      transition={{ duration: 0.22 }}
                      onSubmit={(event) => {
                        void handleBuySubmit(event);
                      }}
                      className="mt-4 space-y-3 overflow-hidden"
                    >
                      <input
                        value={transactionBuyerName}
                        onChange={(event) => setTransactionBuyerName(event.target.value)}
                        placeholder="Buyer name"
                        className="w-full rounded-2xl border border-white/10 bg-graphite-850 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                      />

                      <input
                        value={transactionBuyerEmail}
                        onChange={(event) => setTransactionBuyerEmail(event.target.value)}
                        placeholder="Buyer email"
                        type="email"
                        className="w-full rounded-2xl border border-white/10 bg-graphite-850 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                      />

                      <input
                        value={transactionBuyerPhone}
                        onChange={(event) => setTransactionBuyerPhone(event.target.value)}
                        placeholder="Buyer phone (optional)"
                        className="w-full rounded-2xl border border-white/10 bg-graphite-850 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                      />

                      <label className="space-y-2 text-sm text-white/68">
                        <span className="inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/38">
                          <CreditCard className="h-3.5 w-3.5" />
                          Payment method
                        </span>
                        <select
                          value={paymentMethod}
                          onChange={(event) => setPaymentMethod(event.target.value)}
                          className="w-full rounded-2xl border border-white/10 bg-graphite-850 px-4 py-3 text-sm text-white outline-none focus:border-neon-blue/50"
                        >
                          <option value="Cash" className="bg-graphite-900 text-white">Cash</option>
                          <option value="UPI" className="bg-graphite-900 text-white">UPI</option>
                          <option value="Card" className="bg-graphite-900 text-white">Card</option>
                          <option value="Bank Transfer" className="bg-graphite-900 text-white">Bank Transfer</option>
                        </select>
                      </label>

                      <button
                        type="submit"
                        disabled={isBuying || !transactionBuyerName.trim() || !transactionBuyerEmail.trim()}
                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {isBuying ? "Processing purchase..." : "Confirm purchase"}
                      </button>

                      {buySuccess ? <p className="text-sm text-neon-mint">{buySuccess}</p> : null}
                      {buyError ? <p className="text-sm text-rose-200">{buyError}</p> : null}
                    </motion.form>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                <button
                  type="button"
                  data-cursor="hover"
                  onClick={() => setIsContactFormOpen((current) => !current)}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-neon-blue via-neon-purple to-neon-pink px-5 py-4 text-base font-semibold text-white shadow-glow transition-transform duration-300 hover:-translate-y-0.5"
                >
                  <MessageCircle className="h-4 w-4" />
                  {isContactFormOpen ? "Hide contact form" : "Contact Seller"}
                </button>

                <AnimatePresence initial={false}>
                  {isContactFormOpen ? (
                    <motion.div
                      initial={{ opacity: 0, y: 16, height: 0 }}
                      animate={{ opacity: 1, y: 0, height: "auto" }}
                      exit={{ opacity: 0, y: 12, height: 0 }}
                      transition={{ duration: 0.22 }}
                      className="mt-4 overflow-hidden"
                    >
                      <form className="space-y-3" onSubmit={handleSendMessageSubmit}>
                        <p className="text-sm leading-6 text-white/58">
                          Send a direct message to {product.sellerName}. This will be saved in the marketplace messages table.
                        </p>

                        <div className="grid gap-3 sm:grid-cols-2">
                          <label className="space-y-2 text-sm text-white/68">
                            <span className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/38">
                              <User className="h-3.5 w-3.5" />
                              Your name
                            </span>
                            <input
                              value={buyerName}
                              onChange={(event) => setBuyerName(event.target.value)}
                              placeholder="Enter your name"
                              className="w-full rounded-2xl border border-white/10 bg-graphite-850 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                            />
                          </label>

                          <label className="space-y-2 text-sm text-white/68">
                            <span className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/38">
                              <Mail className="h-3.5 w-3.5" />
                              Email
                            </span>
                            <input
                              value={buyerEmail}
                              onChange={(event) => setBuyerEmail(event.target.value)}
                              placeholder="you@example.com"
                              type="email"
                              className="w-full rounded-2xl border border-white/10 bg-graphite-850 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                            />
                          </label>
                        </div>

                        <label className="space-y-2 text-sm text-white/68">
                          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/38">
                            <Phone className="h-3.5 w-3.5" />
                            Phone number
                          </span>
                          <input
                            value={buyerPhone}
                            onChange={(event) => setBuyerPhone(event.target.value)}
                            placeholder="Optional phone number"
                            className="w-full rounded-2xl border border-white/10 bg-graphite-850 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                          />
                        </label>

                        <label className="space-y-2 text-sm text-white/68">
                          <span className="flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-white/38">
                            <MessageCircle className="h-3.5 w-3.5" />
                            Message
                          </span>
                          <textarea
                            value={buyerMessage}
                            onChange={(event) => setBuyerMessage(event.target.value)}
                            rows={4}
                            placeholder="Ask about the item, pickup, or availability"
                            className="w-full rounded-2xl border border-white/10 bg-graphite-850 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-neon-blue/50"
                          />
                        </label>

                        <button
                          type="submit"
                          disabled={isSendingMessage || !buyerName.trim() || !buyerEmail.trim() || !buyerMessage.trim()}
                          className="inline-flex w-full items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/8 px-5 py-3 text-sm font-semibold text-white transition-colors hover:bg-white/12 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          <Send className="h-4 w-4" />
                          {isSendingMessage ? "Sending message..." : "Send message"}
                        </button>

                        {contactSuccess ? <p className="text-sm text-neon-mint">{contactSuccess}</p> : null}
                        {contactError ? <p className="text-sm text-rose-200">{contactError}</p> : null}
                      </form>
                    </motion.div>
                  ) : null}
                </AnimatePresence>
              </div>

              <div className="rounded-[1.35rem] border border-white/10 bg-white/6 p-4">
                <p className="text-xs uppercase tracking-[0.24em] text-white/40">Delete item</p>
                <p className="mt-2 text-sm leading-6 text-white/58">Enter the seller email to remove this listing and its uploaded photos.</p>

                <div className="mt-4 flex flex-col gap-3 sm:flex-row">
                  <input
                    value={sellerEmailConfirm}
                    onChange={(event) => setSellerEmailConfirm(event.target.value)}
                    placeholder="Confirm seller email"
                    className="w-full rounded-2xl border border-white/10 bg-graphite-850 px-4 py-3 text-sm text-white outline-none placeholder:text-white/30 focus:border-rose-400/50"
                  />

                  <button
                    type="button"
                    onClick={() => void handleDelete()}
                    disabled={!canDelete || isDeleting}
                    className="inline-flex items-center justify-center gap-2 rounded-2xl border border-rose-400/20 bg-rose-500/10 px-5 py-3 text-sm font-semibold text-rose-100 transition-colors hover:bg-rose-500/16 disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    <Trash2 className="h-4 w-4" />
                    {isDeleting ? "Deleting..." : "Delete item"}
                  </button>
                </div>

                {deleteError ? <p className="mt-3 text-sm text-rose-200">{deleteError}</p> : null}
              </div>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}