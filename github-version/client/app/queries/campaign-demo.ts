import { useMutation, useQueryClient } from "@tanstack/react-query";
import { campaignDemoApi } from "~/services/campaign-demo";
import { queryKeys } from "./keys";

/** Loads the nine sample campaign emails into a mailbox; repeating it adds nothing. */
export function useSeedCampaignSamples() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (mailboxId: string) => campaignDemoApi.seedSamples(mailboxId),
    onSuccess: (_data, mailboxId) => Promise.all([
      queryClient.invalidateQueries({ queryKey: ["emails", mailboxId] }),
      queryClient.invalidateQueries({ queryKey: queryKeys.folders.list(mailboxId) }),
    ]),
  });
}
