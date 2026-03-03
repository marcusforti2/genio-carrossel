import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { CarouselData } from "@/types/carousel";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

export type SaveStatus = "idle" | "saving" | "saved" | "error";

export interface Project {
  id: string;
  title: string;
  data: CarouselData;
  created_at: string;
  updated_at: string;
}

export function useProjectAutosave(carousel: CarouselData, caption: string) {
  const { user } = useAuth();
  const [projectId, setProjectId] = useState<string | null>(null);
  const [projectTitle, setProjectTitle] = useState("Sem título");
  const [saveStatus, setSaveStatus] = useState<SaveStatus>("idle");
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedRef = useRef<string>("");

  const serialize = useCallback(() => {
    return JSON.stringify({ ...carousel, _caption: caption });
  }, [carousel, caption]);

  // Autosave with 3s debounce
  useEffect(() => {
    if (!user) return;
    const current = serialize();
    if (current === lastSavedRef.current) return;

    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      setSaveStatus("saving");
      try {
        const payload = { ...carousel, _caption: caption } as any;
        if (projectId) {
          const { error } = await supabase
            .from("projects")
            .update({ data: payload, title: projectTitle } as any)
            .eq("id", projectId);
          if (error) throw error;
        } else {
          const { data, error } = await supabase
            .from("projects")
            .insert({ user_id: user.id, title: projectTitle, data: payload } as any)
            .select("id")
            .single();
          if (error) throw error;
          if (data) setProjectId((data as any).id);
        }
        lastSavedRef.current = current;
        setSaveStatus("saved");
      } catch (e) {
        console.error("Autosave error:", e);
        setSaveStatus("error");
      }
    }, 3000);

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [carousel, caption, projectId, projectTitle, user, serialize]);

  const loadProject = useCallback((project: Project) => {
    setProjectId(project.id);
    setProjectTitle(project.title);
    lastSavedRef.current = JSON.stringify(project.data);
    setSaveStatus("saved");
    return project.data;
  }, []);

  const newProject = useCallback(() => {
    setProjectId(null);
    setProjectTitle("Sem título");
    lastSavedRef.current = "";
    setSaveStatus("idle");
  }, []);

  return {
    projectId,
    projectTitle,
    setProjectTitle,
    saveStatus,
    loadProject,
    newProject,
  };
}
