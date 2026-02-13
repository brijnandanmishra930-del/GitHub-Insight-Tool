import { z } from "zod";
import {
  insertGithubAnalysisSchema,
  githubAnalyses,
  type GithubAnalysis,
} from "./schema";

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
  serviceUnavailable: z.object({
    message: z.string(),
  }),
};

const githubAnalysisSchema = z.custom<GithubAnalysis>();

export const api = {
  github: {
    analyses: {
      list: {
        method: "GET" as const,
        path: "/api/github/analyses" as const,
        input: z
          .object({
            limit: z.coerce.number().int().min(1).max(50).optional(),
          })
          .optional(),
        responses: {
          200: z.array(githubAnalysisSchema),
        },
      },
      get: {
        method: "GET" as const,
        path: "/api/github/analyses/:id" as const,
        responses: {
          200: githubAnalysisSchema,
          404: errorSchemas.notFound,
        },
      },
      create: {
        method: "POST" as const,
        path: "/api/github/analyses" as const,
        input: z
          .object({
            profileUrl: z.string().min(1),
          })
          .superRefine((val, ctx) => {
            try {
              const u = new URL(val.profileUrl);
              if (u.hostname !== "github.com") {
                ctx.addIssue({
                  code: z.ZodIssueCode.custom,
                  message: "Please enter a github.com profile URL",
                  path: ["profileUrl"],
                });
              }
            } catch {
              ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: "Please enter a valid URL",
                path: ["profileUrl"],
              });
            }
          }),
        responses: {
          201: githubAnalysisSchema,
          400: errorSchemas.validation,
          503: errorSchemas.serviceUnavailable,
        },
      },
      // Raw repo snapshots for drilldown charts/tables
      repos: {
        method: "GET" as const,
        path: "/api/github/analyses/:id/repos" as const,
        responses: {
          200: z.array(z.unknown()),
          404: errorSchemas.notFound,
        },
      },
    },
  },
} as const;

export function buildUrl(
  path: string,
  params?: Record<string, string | number>
): string {
  let url = path;
  if (params) {
    for (const [key, value] of Object.entries(params)) {
      url = url.replace(`:${key}`, String(value));
    }
  }
  return url;
}

export type GithubAnalysesListResponse = z.infer<
  typeof api.github.analyses.list.responses[200]
>;
export type GithubAnalysisResponse = z.infer<
  typeof api.github.analyses.get.responses[200]
>;
export type CreateGithubAnalysisInput = z.infer<
  typeof api.github.analyses.create.input
>;
export type ValidationError = z.infer<typeof errorSchemas.validation>;
export type NotFoundError = z.infer<typeof errorSchemas.notFound>;
export type InternalError = z.infer<typeof errorSchemas.internal>;
