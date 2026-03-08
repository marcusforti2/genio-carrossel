import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const REQUIRED_FIELDS = [
  "display_name",
  "handle",
  "avatar_url",
  "niche",
  "target_audience",
  "tone_of_voice",
  "value_proposition",
] as const;

export const useProfileComplete = () => {
  const { user } = useAuth();
  const [isComplete, setIsComplete] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const check = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select(REQUIRED_FIELDS.join(","))
        .eq("user_id", user.id)
        .maybeSingle();

      if (error || !data) {
        setIsComplete(false);
      } else {
        const allFilled = REQUIRED_FIELDS.every(
          (f) => typeof data[f] === "string" && (data[f] as string).trim().length > 0
        );
        setIsComplete(allFilled);
      }
      setLoading(false);
    };

    check();
  }, [user]);

  return { isComplete, loading };
};
