import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_LIMIT = 15;

export const useCarouselLimit = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [totalLimit, setTotalLimit] = useState(DEFAULT_LIMIT);
  const [loading, setLoading] = useState(true);
  const [limitReached, setLimitReached] = useState(false);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);

    const [projectRes, creditsRes] = await Promise.all([
      supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id),
      supabase
        .from("user_credits")
        .select("total_limit")
        .eq("user_id", user.id)
        .maybeSingle(),
    ]);

    const c = projectRes.count ?? 0;
    const limit = creditsRes.data?.total_limit ?? DEFAULT_LIMIT;

    setCount(c);
    setTotalLimit(limit);
    setLimitReached(c >= limit);
    setLoading(false);
  }, [user]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const remaining = Math.max(0, totalLimit - count);

  return { count, remaining, limitReached, loading, FREE_LIMIT: totalLimit, refresh: fetchData };
};
