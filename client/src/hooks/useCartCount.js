import { useEffect, useState } from "react";
import { api } from "../services/api";

export default function useCartCount(enabled, userId) {
  const [snapshot, setSnapshot] = useState({
    userId: null,
    count: null,
  });

  useEffect(() => {
    if (!enabled || !userId) return;

    let active = true;
    let latestRequest = 0;

    async function refresh() {
      const requestId = ++latestRequest;

      try {
        const response = await api("/cart");

        const count = response.data.items.reduce(
          (total, item) => total + Number(item.quantity),
          0,
        );

        if (active && requestId === latestRequest) {
          setSnapshot({ userId, count });
        }
      } catch {
        if (active && requestId === latestRequest) {
          setSnapshot({ userId, count: null });
        }
      }
    }

    window.addEventListener("cart-changed", refresh);
    window.addEventListener("focus", refresh);

    refresh();

    return () => {
      active = false;
      window.removeEventListener("cart-changed", refresh);
      window.removeEventListener("focus", refresh);
    };
  }, [enabled, userId]);

  if (!enabled || !userId) return 0;

  return snapshot.userId === userId
    ? snapshot.count
    : null;
}