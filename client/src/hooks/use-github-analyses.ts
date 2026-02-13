import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, buildUrl } from "@shared/routes";
import type {
  CreateGithubAnalysisInput,
  GithubAnalysesListResponse,
  GithubAnalysisResponse,
} from "@shared/routes";
import { z } from "zod";

function parseWithLogging<T>(schema: z.ZodSchema<T>, data: unknown, label: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod] ${label} validation failed:`, result.error.format());
    throw result.error;
  }
  return result.data;
}

export function useGithubAnalyses(limit?: number) {
  const url =
    typeof limit === "number"
      ? `${api.github.analyses.list.path}?${new URLSearchParams({ limit: String(limit) }).toString()}`
      : api.github.analyses.list.path;

  return useQuery<GithubAnalysesListResponse>({
    queryKey: [api.github.analyses.list.path, { limit: limit ?? null }],
    queryFn: async () => {
      const res = await fetch(url, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch analyses");
      const json = await res.json();
      return parseWithLogging(api.github.analyses.list.responses[200], json, "github.analyses.list");
    },
  });
}

export function useGithubAnalysis(id: string) {
  return useQuery<GithubAnalysisResponse | null>({
    queryKey: [api.github.analyses.get.path, id],
    queryFn: async () => {
      const url = buildUrl(api.github.analyses.get.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch analysis");
      const json = await res.json();
      return parseWithLogging(api.github.analyses.get.responses[200], json, "github.analyses.get");
    },
  });
}

export function useGithubRepos(id: string) {
  return useQuery<unknown[] | null>({
    queryKey: [api.github.analyses.repos.path, id],
    queryFn: async () => {
      const url = buildUrl(api.github.analyses.repos.path, { id });
      const res = await fetch(url, { credentials: "include" });
      if (res.status === 404) return null;
      if (!res.ok) throw new Error("Failed to fetch repo snapshots");
      const json = await res.json();
      return parseWithLogging(api.github.analyses.repos.responses[200], json, "github.analyses.repos");
    },
  });
}

export function useCreateGithubAnalysis() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateGithubAnalysisInput) => {
      const validated = api.github.analyses.create.input.parse(input);

      const res = await fetch(api.github.analyses.create.path, {
        method: api.github.analyses.create.method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(validated),
        credentials: "include",
      });

      if (!res.ok) {
        if (res.status === 400) {
          const errJson = await res.json().catch(() => null);
          const parsed = parseWithLogging(api.github.analyses.create.responses[400], errJson, "github.analyses.create.400");
          throw new Error(parsed.field ? `${parsed.field}: ${parsed.message}` : parsed.message);
        }
        if (res.status === 503) {
          const errJson = await res.json().catch(() => null);
          const parsed = parseWithLogging(api.github.analyses.create.responses[503], errJson, "github.analyses.create.503");
          const e = new Error(parsed.message);
          (e as any).status = 503;
          throw e;
        }
        const text = await res.text().catch(() => "");
        throw new Error(text || "Failed to create analysis");
      }

      const json = await res.json();
      return parseWithLogging(api.github.analyses.create.responses[201], json, "github.analyses.create.201");
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [api.github.analyses.list.path] });
    },
  });
}
