export const TASK_STATUSES = ['new', 'triaged', 'assigned', 'in_progress', 'waiting_client', 'waiting_internal', 'done', 'closed', 'blocked'];
export const CLIENT_STATUSES = ['active', 'paused', 'closed'];
export const TASK_TYPES = ['request', 'issue', 'draft', 'task', 'project'];
export const TASK_PRIORITIES = ['low', 'normal', 'high', 'urgent'];
export const USAGE_STATUSES = ['ok', 'error', 'blocked'];

export function isTerminalTaskStatus(status) {
  return status === 'done' || status === 'closed';
}
