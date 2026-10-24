"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { soundManager } from "@/lib/audio-alerts";
import type { DashboardOrderWithItems } from "@/lib/orders/memory-store";
import type { OrderStatus, PaymentStatus } from "@/lib/supabase/database.types";
import { toast } from "sonner";

export type ConnectionStatus = "connected" | "reconnecting" | "polling";

interface UseLiveOrdersOptions {
  restaurantId: string;
  statusFilter?: string;
  enableAudioChime?: boolean;
}

export function useLiveOrders({
  restaurantId,
  statusFilter = "all",
  enableAudioChime = true,
}: UseLiveOrdersOptions) {
  const [orders, setOrders] = useState<DashboardOrderWithItems[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>("reconnecting");
  const [isAudioUnlocked, setIsAudioUnlocked] = useState<boolean>(soundManager.getUnlocked());
  const [actionLock, setActionLock] = useState<Set<string>>(new Set());

  const previousCountRef = useRef<number>(0);
  const isFirstLoadRef = useRef<boolean>(true);

  // Unlocks Web Audio API on click
  const unlockAudio = useCallback(() => {
    const success = soundManager.unlock();
    setIsAudioUnlocked(soundManager.getUnlocked());
    if (success) {
      soundManager.playNewOrderChime();
      toast.success("Sound Alerts Active", {
        description: "Kitchen chimes unlocked for incoming table orders.",
      });
    }
  }, []);

  // Fetch orders via HTTP endpoint (used on initial load and by the 25s polling fallback)
  const fetchOrders = useCallback(
    async (isBackgroundPoll = false) => {
      try {
        const url = `/api/v1/dashboard/orders?restaurantId=${restaurantId}${
          statusFilter !== "all" ? `&status=${statusFilter}` : ""
        }`;
        const res = await fetch(url, { cache: "no-store" });
        const data = await res.json();

        if (res.ok && data.success && Array.isArray(data.orders)) {
          const newOrders: DashboardOrderWithItems[] = data.orders;

          // If a new order arrived compared to last poll, ring the kitchen chime!
          if (
            !isFirstLoadRef.current &&
            enableAudioChime &&
            newOrders.length > previousCountRef.current
          ) {
            soundManager.playNewOrderChime();
            const newest = newOrders[0];
            toast.info(`New Order: ${newest.order_number}`, {
              description: `${newest.tableLabel} • ${newest.items.length} items`,
            });
          }

          previousCountRef.current = newOrders.length;
          isFirstLoadRef.current = false;
          setOrders(newOrders);
          setConnectionStatus("connected");
        } else {
          setConnectionStatus("reconnecting");
        }
      } catch {
        setConnectionStatus("reconnecting");
      } finally {
        if (!isBackgroundPoll) {
          setLoading(false);
        }
      }
    },
    [restaurantId, statusFilter, enableAudioChime]
  );

  // 1. Initial Load & 25-Second Polling Fallback (Bangladesh Network Resilience)
  useEffect(() => {
    fetchOrders(false);

    const pollingInterval = setInterval(() => {
      fetchOrders(true);
    }, 25000); // 25s polling

    return () => clearInterval(pollingInterval);
  }, [fetchOrders]);

  // 2. Supabase Realtime Subscription
  useEffect(() => {
    let channel: ReturnType<typeof supabase.channel> | null = null;
    const supabase = createClient();

    try {
      channel = supabase
        .channel(`tenant-orders-${restaurantId}`)
        .on(
          "postgres_changes",
          {
            event: "*",
            schema: "public",
            table: "orders",
            filter: `restaurant_id=eq.${restaurantId}`,
          },
          () => {
            // When any order row changes or inserts, fetch latest state and play chime
            fetchOrders(true);
          }
        )
        .subscribe((status) => {
          if (status === "SUBSCRIBED") {
            setConnectionStatus("connected");
          } else if (status === "CLOSED" || status === "CHANNEL_ERROR") {
            setConnectionStatus("reconnecting");
          }
        });
    } catch {
      setConnectionStatus("polling");
    }

    return () => {
      if (channel) {
        supabase.removeChannel(channel);
      }
    };
  }, [restaurantId, fetchOrders]);

  // Single-tap status advancement with optimistic update & double-click lock
  const updateOrderStatus = useCallback(
    async (
      orderId: string,
      nextStatus: OrderStatus,
      extra?: {
        paymentStatus?: PaymentStatus;
        cancellationReason?: string;
      }
    ) => {
      // Double-click lock guard
      if (actionLock.has(orderId)) return;

      setActionLock((prev) => new Set(prev).add(orderId));

      // 1. Optimistic local update
      setOrders((prev) =>
        prev
          .map((o) => {
            if (o.id === orderId) {
              return {
                ...o,
                status: nextStatus,
                ...(extra?.paymentStatus ? { payment_status: extra.paymentStatus } : {}),
              };
            }
            return o;
          })
          .filter((o) => {
            // If the updated order was marked served or cancelled, remove it from active KDS columns
            if (o.id === orderId && (nextStatus === "served" || nextStatus === "cancelled")) {
              return false;
            }
            return true;
          })
      );

      // Sound bell feedback on ready
      if (nextStatus === "ready") {
        soundManager.playOrderReadyBell();
      }

      // 2. Server mutation
      try {
        const res = await fetch(`/api/v1/dashboard/orders/${orderId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            status: nextStatus,
            paymentStatus: extra?.paymentStatus,
            cancellationReason: extra?.cancellationReason,
          }),
        });

        const data = await res.json();
        if (!res.ok || !data.success) {
          throw new Error(data.error || "Update failed");
        }
      } catch {
        toast.error("Failed to sync status with server. Reverting...");
        // Revert by re-fetching
        fetchOrders(true);
      } finally {
        // Release double-click lock after 600ms
        setTimeout(() => {
          setActionLock((prev) => {
            const next = new Set(prev);
            next.delete(orderId);
            return next;
          });
        }, 600);
      }
    },
    [actionLock, fetchOrders]
  );

  return {
    orders,
    loading,
    connectionStatus,
    isAudioUnlocked,
    unlockAudio,
    updateOrderStatus,
    actionLock,
    refetch: () => fetchOrders(false),
  };
}
