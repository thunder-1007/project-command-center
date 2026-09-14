import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Plus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useRole } from "@/lib/session";
import { KANBAN_COLUMNS, SDLC_STAGES, PRIORITIES, PHASE_STATUSES, priorityClass } from "@/lib/board";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/board")({
  head: () => ({
    meta: [
      { title: "Board — Formiva Mission Control" },
      { name: "description", content: "Kanban, SDLC and waterfall views of every Formiva CaseFlow task." },
      { property: "og:title", content: "Board — Formiva Mission Control" },
      { property: "og:description", content: "Kanban, SDLC and waterfall views of every task." },
    ],
  }),
  component: Board;
});

function Board() {
  return null;
}
