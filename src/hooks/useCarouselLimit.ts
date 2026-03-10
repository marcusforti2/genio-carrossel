import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const FREE_LIMIT = 15;

export const useCarouselLimit = () => {
  const { user } = useAuth();
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [limitReached, setLimitReached] = useState(false);

  useEffect(() => {
    if (!user) return;

    const fetchCount = async () => {
      setLoading(true);
      const { count: total, error } = await supabase
        .from("projects")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id);

      const c = total ?? 0;
      setCount(c);
      setLimitReached(c >= FREE_LIMIT);
      setLoading(false);
    };

    fetchCount();
  }, [user]);

  const remaining = Math.max(0, FREE_LIMIT - count);

  return { count, remaining, limitReached, loading, FREE_LIMIT };
};
