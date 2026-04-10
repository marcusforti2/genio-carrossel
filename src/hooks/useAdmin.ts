import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export const useAdmin = () => {
  const { user, loading: authLoading } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [checked, setChecked] = useState(false);
  const lastUserId = useRef<string | null>(null);

  useEffect(() => {
    if (authLoading) return;

    if (!user) {
      setIsAdmin(false);
      setChecked(true);
      lastUserId.current = null;
      return;
    }

    // Don't re-check if same user
    if (lastUserId.current === user.id && checked) return;

    lastUserId.current = user.id;
    setChecked(false);

    const check = async () => {
      const { data } = await supabase.rpc("has_role", {
        _user_id: user.id,
        _role: "admin",
      });
      setIsAdmin(data === true);
      setChecked(true);
    };

    check();
  }, [user, authLoading]);

  return { isAdmin, loading: authLoading || !checked };
};
