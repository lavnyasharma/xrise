import { api, unwrap } from './axios';

export interface DraftReplyResult {
  draft: string;
}

export interface SummariseResult {
  summary: string;
  suggestedPriority: string;
}

export const draftReply = (ticketId: string): Promise<DraftReplyResult> =>
  api.post(`/ai/${ticketId}/draft-reply`).then(unwrap<DraftReplyResult>);

export const summariseTicket = (ticketId: string): Promise<SummariseResult> =>
  api.post(`/ai/${ticketId}/summarise`).then(unwrap<SummariseResult>);
