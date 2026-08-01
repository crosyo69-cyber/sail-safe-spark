import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { emailQueueService } from "@/services/email-queue.service";
import { unwrap } from "@/services/_shared/result";

export const emailQueueKeys = {
  all: ["email-queue"] as const,
  logs: (hours: number) => [...emailQueueKeys.all, "logs", hours] as const,
};

export const useEmailQueue = () => {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: emailQueueKeys.all });

  return {
    service: emailQueueService,
    invalidate,

    useLogs: (hours: number, autoRefresh = false) =>
      useQuery({
        queryKey: emailQueueKeys.logs(hours),
        queryFn: async () => unwrap(await emailQueueService.listLogs(hours)) ?? [],
        refetchInterval: autoRefresh ? 15000 : false,
      }),

    useRetryDlq: () =>
      useMutation({
        mutationFn: async (vars: {
          messageId: string;
          queue: "auth_emails" | "transactional_emails";
        }) => unwrap(await emailQueueService.retryDlq(vars.messageId, vars.queue)),
      }),
  };
};