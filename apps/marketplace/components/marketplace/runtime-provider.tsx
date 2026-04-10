"use client";

import {
  createContext,
  startTransition,
  useContext,
  useDeferredValue,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  MarketplaceOrderFeedItem,
  MarketplaceRealtimePayload,
  MarketplaceShellCartItem,
  MarketplaceShellState,
} from "@/lib/marketplace/types";
import { buildSharedAccountLoginUrl } from "@/lib/marketplace/shared-account";
import {
  stashMarketplacePostAuthIntent,
  takeMarketplacePostAuthIntent,
} from "@/lib/marketplace/post-auth-intent";
import { getBrowserSupabaseOptional } from "@/lib/supabase/browser";

export type ToastTone = "success" | "error" | "info";

type ToastItem = {
  id: string;
  title: string;
  body?: string;
  tone: ToastTone;
};

type AddToCartInput = {
  productSlug: string;
  title: string;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  image: string | null;
  vendorSlug: string | null;
  vendorName: string | null;
  trustBadges: string[];
  inventoryOwnerType: "company" | "vendor";
  deliveryNote: string;
};

type MarketplaceRuntimeContextValue = {
  shell: MarketplaceShellState;
  cartOpen: boolean;
  cartBusy: boolean;
  pendingWishlistSlugs: string[];
  pendingFollowSlugs: string[];
  pendingCartSlugs: string[];
  toasts: ToastItem[];
  openCart: () => void;
  closeCart: () => void;
  dismissToast: (id: string) => void;
  pushToast: (title: string, tone: ToastTone, body?: string) => void;
  refreshShell: (silent?: boolean) => Promise<void>;
  addToCart: (input: AddToCartInput, quantity?: number) => Promise<boolean>;
  updateCartQuantity: (itemId: string, quantity: number) => Promise<void>;
  removeCartItem: (itemId: string) => Promise<void>;
  toggleWishlist: (productSlug: string) => Promise<void>;
  toggleFollow: (vendorSlug: string) => Promise<void>;
  isWishlisted: (productSlug: string) => boolean;
  isFollowing: (vendorSlug: string) => boolean;
};

const MarketplaceRuntimeContext = createContext<MarketplaceRuntimeContextValue | null>(null);

function makeToast(title: string, tone: ToastTone, body?: string): ToastItem {
  return {
    id: crypto.randomUUID(),
    title,
    body,
    tone,
  };
}

function mergeOptimisticCartItem(
  items: MarketplaceShellCartItem[],
  input: AddToCartInput,
  quantity: number
) {
  const existing = items.find((item) => item.productSlug === input.productSlug);
  if (existing) {
    return items.map((item) =>
      item.productSlug === input.productSlug
        ? {
            ...item,
            quantity: item.quantity + quantity,
          }
        : item
    );
  }

  return [
    {
      id: `optimistic-${input.productSlug}`,
      productSlug: input.productSlug,
      title: input.title,
      vendorSlug: input.vendorSlug,
      vendorName: input.vendorName,
      quantity,
      price: input.price,
      compareAtPrice: input.compareAtPrice,
      currency: input.currency,
      image: input.image,
      trustBadges: input.trustBadges,
      inventoryOwnerType: input.inventoryOwnerType,
      deliveryNote: input.deliveryNote,
    },
    ...items,
  ];
}

function goToSharedAccountLogin(nextPath: string) {
  window.location.href = buildSharedAccountLoginUrl(nextPath, window.location.origin);
}

function readCookie(name: string) {
  const match = document.cookie
    .split("; ")
    .find((entry) => entry.startsWith(`${name}=`));
  return match ? decodeURIComponent(match.split("=").slice(1).join("=")) : null;
}

function ensureGuestCartToken() {
  const existing = readCookie("marketplace_cart_token");
  if (existing) return existing;

  return crypto.randomUUID();
}

export function MarketplaceRuntimeProvider({
  initialShell,
  children,
}: {
  initialShell: MarketplaceShellState;
  children: React.ReactNode;
}) {
  const [shell, setShell] = useState(initialShell);
  const [cartOpen, setCartOpen] = useState(false);
  const [cartBusy, setCartBusy] = useState(false);
  const [pendingWishlistSlugs, setPendingWishlistSlugs] = useState<string[]>([]);
  const [pendingFollowSlugs, setPendingFollowSlugs] = useState<string[]>([]);
  const [pendingCartSlugs, setPendingCartSlugs] = useState<string[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const broadcastRef = useRef<BroadcastChannel | null>(null);
  const refreshShellRef = useRef<(silent?: boolean) => Promise<void>>(async () => undefined);
  const postAuthResumeRef = useRef(false);
  /** Synchronous guard so double-clicks cannot enqueue overlapping POST /api/cart calls. */
  const cartRequestSlugsRef = useRef<Set<string>>(new Set());

  function pushToast(title: string, tone: ToastTone, body?: string) {
    const toast = makeToast(title, tone, body);
    setToasts((current) => [...current, toast].slice(-4));
    window.setTimeout(() => {
      setToasts((current) => current.filter((item) => item.id !== toast.id));
    }, 3200);
  }

  async function refreshShell(silent = false) {
    try {
      const response = await fetch("/api/shell", {
        method: "GET",
        cache: "no-store",
      });

      if (!response.ok) {
        if (!silent) {
          pushToast("Marketplace state could not refresh.", "error");
        }
        return;
      }

      const nextShell = (await response.json()) as MarketplaceShellState;
      startTransition(() => {
        setShell(nextShell);
      });
    } catch {
      if (!silent) {
        pushToast("Marketplace state could not refresh.", "error");
      }
    }
  }

  refreshShellRef.current = refreshShell;

  useEffect(() => {
    startTransition(() => {
      void refreshShellRef.current(true);
    });
  }, []);

  useEffect(() => {
    if (typeof BroadcastChannel === "undefined") {
      return;
    }

    const channel = new BroadcastChannel("marketplace-runtime");
    broadcastRef.current = channel;
    channel.onmessage = (event) => {
      const payload = event.data as MarketplaceRealtimePayload | undefined;
      if (payload?.type) {
        startTransition(() => {
          void refreshShellRef.current(true);
        });
      }
    };

    return () => {
      channel.close();
      broadcastRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (!shell.viewer.userId) return;

    const supabase = getBrowserSupabaseOptional();
    if (!supabase) return;
    const refresh = () => {
      startTransition(() => {
        void refreshShellRef.current(true);
      });
    };

    const channel = supabase
      .channel(`marketplace-user-${shell.viewer.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_wishlists",
          filter: `user_id=eq.${shell.viewer.userId}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_vendor_follows",
          filter: `user_id=eq.${shell.viewer.userId}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_user_notifications",
          filter: `user_id=eq.${shell.viewer.userId}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_orders",
          filter: `user_id=eq.${shell.viewer.userId}`,
        },
        refresh
      )
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_vendor_applications",
          filter: `user_id=eq.${shell.viewer.userId}`,
        },
        refresh
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [shell.viewer.userId]);

  function emitCrossTabRefresh(type: MarketplaceRealtimePayload["type"], entityId: string) {
    broadcastRef.current?.postMessage({
      type,
      entityId,
      timestamp: new Date().toISOString(),
    } satisfies MarketplaceRealtimePayload);
  }

  useEffect(() => {
    if (!shell.viewer.signedIn || !shell.viewer.userId) {
      postAuthResumeRef.current = false;
      return;
    }
    if (postAuthResumeRef.current) return;
    const intent = takeMarketplacePostAuthIntent();
    if (!intent) return;
    postAuthResumeRef.current = true;

    const resume = async () => {
      if (intent.action === "wishlist") {
        setPendingWishlistSlugs((current) => [...current, intent.productSlug]);
        try {
          const response = await fetch("/api/wishlist", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ productSlug: intent.productSlug }),
          });
          if (response.ok) {
            const payload = (await response.json()) as { shell: MarketplaceShellState; active: boolean };
            startTransition(() => setShell(payload.shell));
            pushToast(payload.active ? "Saved to wishlist" : "Removed from wishlist", "success");
            emitCrossTabRefresh("wishlist", intent.productSlug);
          } else if (response.status === 401) {
            stashMarketplacePostAuthIntent({ action: "wishlist", productSlug: intent.productSlug });
            goToSharedAccountLogin(`${window.location.pathname}${window.location.search}`);
          }
        } finally {
          setPendingWishlistSlugs((current) => current.filter((slug) => slug !== intent.productSlug));
        }
        return;
      }

      setPendingFollowSlugs((current) => [...current, intent.vendorSlug]);
      try {
        const response = await fetch("/api/follows", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ vendorSlug: intent.vendorSlug }),
        });
        if (response.ok) {
          const payload = (await response.json()) as { shell: MarketplaceShellState; active: boolean };
          startTransition(() => setShell(payload.shell));
          pushToast(payload.active ? "Store followed" : "Store unfollowed", "success");
          emitCrossTabRefresh("follow", intent.vendorSlug);
        } else if (response.status === 401) {
          stashMarketplacePostAuthIntent({ action: "follow", vendorSlug: intent.vendorSlug });
          goToSharedAccountLogin(`${window.location.pathname}${window.location.search}`);
        }
      } finally {
        setPendingFollowSlugs((current) => current.filter((slug) => slug !== intent.vendorSlug));
      }
    };

    void resume();
  }, [shell.viewer.signedIn, shell.viewer.userId]);

  async function addToCart(input: AddToCartInput, quantity = 1) {
    if (cartRequestSlugsRef.current.has(input.productSlug)) {
      return false;
    }
    cartRequestSlugsRef.current.add(input.productSlug);

    const previous = shell;
    const sessionToken = !shell.viewer.signedIn ? ensureGuestCartToken() : null;
    setPendingCartSlugs((current) => [...current, input.productSlug]);
    setCartOpen(true);
    setShell((current) => {
      const items = mergeOptimisticCartItem(current.cart.items, input, quantity);
      const count = items.reduce((sum, item) => sum + item.quantity, 0);
      const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
      return {
        ...current,
        cart: {
          items,
          count,
          subtotal,
        },
      };
    });

    try {
      const response = await fetch("/api/cart", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          productSlug: input.productSlug,
          quantity,
          sessionToken,
        }),
      });

      if (!response.ok) {
        throw new Error("Cart update failed.");
      }

      const payload = (await response.json()) as { shell: MarketplaceShellState };
      setShell(payload.shell);
      pushToast("Added to cart", "success", input.title);
      emitCrossTabRefresh("cart", input.productSlug);
      return true;
    } catch {
      setShell(previous);
      pushToast("Could not add that item.", "error");
      return false;
    } finally {
      cartRequestSlugsRef.current.delete(input.productSlug);
      setPendingCartSlugs((current) => current.filter((slug) => slug !== input.productSlug));
    }
  }

  async function updateCartQuantity(itemId: string, quantity: number) {
    const previous = shell;
    setCartBusy(true);
    setShell((current) => {
      const items =
        quantity <= 0
          ? current.cart.items.filter((item) => item.id !== itemId)
          : current.cart.items.map((item) =>
              item.id === itemId
                ? {
                    ...item,
                    quantity,
                  }
                : item
            );

      return {
        ...current,
        cart: {
          items,
          count: items.reduce((sum, item) => sum + item.quantity, 0),
          subtotal: items.reduce((sum, item) => sum + item.price * item.quantity, 0),
        },
      };
    });

    try {
      const response = await fetch("/api/cart", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          itemId,
          quantity,
        }),
      });

      if (!response.ok) throw new Error("Cart patch failed.");
      const payload = (await response.json()) as { shell: MarketplaceShellState };
      setShell(payload.shell);
      emitCrossTabRefresh("cart", itemId);
    } catch {
      setShell(previous);
      pushToast("Cart update failed.", "error");
    } finally {
      setCartBusy(false);
    }
  }

  async function removeCartItem(itemId: string) {
    await updateCartQuantity(itemId, 0);
  }

  async function toggleWishlist(productSlug: string) {
    if (!shell.viewer.signedIn) {
      stashMarketplacePostAuthIntent({ action: "wishlist", productSlug });
      goToSharedAccountLogin(`${window.location.pathname}${window.location.search}`);
      return;
    }

    const previous = shell;
    const isActive = previous.wishlistSlugs.includes(productSlug);
    setPendingWishlistSlugs((current) => [...current, productSlug]);
    setShell((current) => ({
      ...current,
      wishlistSlugs: isActive
        ? current.wishlistSlugs.filter((slug) => slug !== productSlug)
        : [...current.wishlistSlugs, productSlug],
    }));

    try {
      const response = await fetch("/api/wishlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ productSlug }),
      });

      if (response.status === 401) {
        stashMarketplacePostAuthIntent({ action: "wishlist", productSlug });
        goToSharedAccountLogin(`${window.location.pathname}${window.location.search}`);
        return;
      }

      if (!response.ok) throw new Error("Wishlist toggle failed.");
      const payload = (await response.json()) as { shell: MarketplaceShellState; active: boolean };
      setShell(payload.shell);
      pushToast(payload.active ? "Saved to wishlist" : "Removed from wishlist", "success");
      emitCrossTabRefresh("wishlist", productSlug);
    } catch {
      setShell(previous);
      pushToast("Wishlist update failed.", "error");
    } finally {
      setPendingWishlistSlugs((current) => current.filter((slug) => slug !== productSlug));
    }
  }

  async function toggleFollow(vendorSlug: string) {
    if (!shell.viewer.signedIn) {
      stashMarketplacePostAuthIntent({ action: "follow", vendorSlug });
      goToSharedAccountLogin(`${window.location.pathname}${window.location.search}`);
      return;
    }

    const previous = shell;
    const isActive = previous.followedVendorSlugs.includes(vendorSlug);
    setPendingFollowSlugs((current) => [...current, vendorSlug]);
    setShell((current) => ({
      ...current,
      followedVendorSlugs: isActive
        ? current.followedVendorSlugs.filter((slug) => slug !== vendorSlug)
        : [...current.followedVendorSlugs, vendorSlug],
    }));

    try {
      const response = await fetch("/api/follows", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ vendorSlug }),
      });

      if (response.status === 401) {
        stashMarketplacePostAuthIntent({ action: "follow", vendorSlug });
        goToSharedAccountLogin(`${window.location.pathname}${window.location.search}`);
        return;
      }

      if (!response.ok) throw new Error("Follow toggle failed.");
      const payload = (await response.json()) as { shell: MarketplaceShellState; active: boolean };
      setShell(payload.shell);
      pushToast(payload.active ? "Store followed" : "Store unfollowed", "success");
      emitCrossTabRefresh("follow", vendorSlug);
    } catch {
      setShell(previous);
      pushToast("Store follow update failed.", "error");
    } finally {
      setPendingFollowSlugs((current) => current.filter((slug) => slug !== vendorSlug));
    }
  }

  function dismissToast(id: string) {
    setToasts((current) => current.filter((item) => item.id !== id));
  }

  return (
    <MarketplaceRuntimeContext.Provider
      value={{
        shell,
        cartOpen,
        cartBusy,
        pendingWishlistSlugs,
        pendingFollowSlugs,
        pendingCartSlugs,
        toasts,
        openCart: () => setCartOpen(true),
        closeCart: () => setCartOpen(false),
        dismissToast,
        pushToast,
        refreshShell,
        addToCart,
        updateCartQuantity,
        removeCartItem,
        toggleWishlist,
        toggleFollow,
        isWishlisted: (productSlug) => shell.wishlistSlugs.includes(productSlug),
        isFollowing: (vendorSlug) => shell.followedVendorSlugs.includes(vendorSlug),
      }}
    >
      {children}
    </MarketplaceRuntimeContext.Provider>
  );
}

export function useMarketplaceRuntime() {
  const context = useContext(MarketplaceRuntimeContext);
  if (!context) {
    throw new Error("MarketplaceRuntimeProvider is missing.");
  }

  return context;
}

export function useMarketplaceCart() {
  const runtime = useMarketplaceRuntime();
  return {
    cart: runtime.shell.cart,
    cartOpen: runtime.cartOpen,
    cartBusy: runtime.cartBusy,
    pendingCartSlugs: runtime.pendingCartSlugs,
    openCart: runtime.openCart,
    closeCart: runtime.closeCart,
    addToCart: runtime.addToCart,
    updateCartQuantity: runtime.updateCartQuantity,
    removeCartItem: runtime.removeCartItem,
  };
}

export function useMarketplaceWishlist() {
  const runtime = useMarketplaceRuntime();
  return {
    wishlistSlugs: runtime.shell.wishlistSlugs,
    pendingWishlistSlugs: runtime.pendingWishlistSlugs,
    toggleWishlist: runtime.toggleWishlist,
    isWishlisted: runtime.isWishlisted,
  };
}

export function useMarketplaceFollows() {
  const runtime = useMarketplaceRuntime();
  return {
    followedVendorSlugs: runtime.shell.followedVendorSlugs,
    pendingFollowSlugs: runtime.pendingFollowSlugs,
    toggleFollow: runtime.toggleFollow,
    isFollowing: runtime.isFollowing,
  };
}

export function useMarketplaceNotifications() {
  const runtime = useMarketplaceRuntime();
  return {
    unreadNotificationCount: runtime.shell.unreadNotificationCount,
    refreshNotifications: () => runtime.refreshShell(true),
  };
}

export function useMarketplaceSearch<
  TItem extends {
    slug: string;
  },
>({
  initialItems,
  initialQuery,
}: {
  initialItems: TItem[];
  initialQuery: URLSearchParams;
}) {
  const [items, setItems] = useState(initialItems);
  const [queryString, setQueryString] = useState(initialQuery.toString());
  const [loading, setLoading] = useState(false);
  const deferredQuery = useDeferredValue(queryString);

  useEffect(() => {
    let active = true;

    async function run() {
      setLoading(true);
      try {
        const response = await fetch(`/api/products?${deferredQuery}`, {
          cache: "no-store",
        });
        if (!response.ok) return;
        const payload = (await response.json()) as { items: TItem[] };
        if (active) setItems(payload.items);
      } finally {
        if (active) setLoading(false);
      }
    }

    void run();

    return () => {
      active = false;
    };
  }, [deferredQuery]);

  return {
    items,
    loading,
    queryString,
    setQueryString,
  };
}

export function useMarketplaceOrderFeed(initialItems: MarketplaceOrderFeedItem[] = []) {
  const runtime = useMarketplaceRuntime();
  const [items, setItems] = useState(initialItems);

  useEffect(() => {
    if (!runtime.shell.viewer.userId) return;

    const supabase = getBrowserSupabaseOptional();
    if (!supabase) return;
    const channel = supabase
      .channel(`marketplace-orders-${runtime.shell.viewer.userId}`)
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "marketplace_orders",
          filter: `user_id=eq.${runtime.shell.viewer.userId}`,
        },
        () => {
          try {
            void fetch("/api/orders?view=feed", { cache: "no-store" }).then(async (response) => {
              if (!response.ok) return;
              const payload = (await response.json()) as { items: MarketplaceOrderFeedItem[] };
              setItems(payload.items);
            });
          } catch {
            // keep the previous feed
          }
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [runtime.shell.viewer.userId]);

  return {
    items,
  };
}
