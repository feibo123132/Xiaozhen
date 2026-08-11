export const EVENT_STATUSES = ['draft', 'active', 'ended', 'archived'] as const;
export const WORRY_STATUSES = ['draft', 'published', 'archived'] as const;
export type EventStatus = (typeof EVENT_STATUSES)[number];
export type WorryStatus = (typeof WORRY_STATUSES)[number];

const eventTransitions: Record<EventStatus, EventStatus[]> = { draft: ['active', 'archived'], active: ['ended'], ended: ['archived'], archived: [] };
const worryTransitions: Record<WorryStatus, WorryStatus[]> = { draft: ['published', 'archived'], published: ['archived'], archived: [] };

export function canTransitionEvent(from: string, to: EventStatus) {
  return EVENT_STATUSES.includes(from as EventStatus) && eventTransitions[from as EventStatus].includes(to);
}

export function canTransitionWorry(from: string, to: WorryStatus) {
  return WORRY_STATUSES.includes(from as WorryStatus) && worryTransitions[from as WorryStatus].includes(to);
}
