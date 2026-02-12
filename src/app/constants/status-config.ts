import { StatusConfig } from '../models/work-order.model';

/**
 * Status configuration for work order pills (in forms, dropdowns, etc.)
 */
export const STATUS_PILL_CONFIG: StatusConfig[] = [
  { value: 'open', label: 'Open', textColor: 'var(--status-open-text)', bgColor: 'var(--status-open-pill-bg)', borderColor: 'var(--status-open-pill-border)' },
  { value: 'in-progress', label: 'In Progress', textColor: 'var(--status-in-progress-text)', bgColor: 'var(--status-in-progress-pill-bg)', borderColor: 'var(--status-in-progress-pill-border)' },
  { value: 'complete', label: 'Complete', textColor: 'var(--status-complete-text)', bgColor: 'var(--status-complete-pill-bg)', borderColor: 'var(--status-complete-pill-border)' },
  { value: 'blocked', label: 'Blocked', textColor: 'var(--status-blocked-text)', bgColor: 'var(--status-blocked-pill-bg)', borderColor: 'var(--status-blocked-pill-border)' }
];

/**
 * Status configuration for work order bars (timeline visualization)
 */
export const STATUS_BAR_CONFIG: StatusConfig[] = [
  { value: 'open', label: 'Open', textColor: 'var(--status-open-text)', bgColor: 'var(--status-open-bar-bg)', borderColor: 'var(--status-open-bar-border)' },
  { value: 'in-progress', label: 'In Progress', textColor: 'var(--status-in-progress-text)', bgColor: 'var(--status-in-progress-bar-bg)', borderColor: 'var(--status-in-progress-bar-border)' },
  { value: 'complete', label: 'Complete', textColor: 'var(--status-complete-text)', bgColor: 'var(--status-complete-bar-bg)', borderColor: 'var(--status-complete-bar-border)' },
  { value: 'blocked', label: 'Blocked', textColor: 'var(--status-blocked-text)', bgColor: 'var(--status-blocked-bar-bg)', borderColor: 'var(--status-blocked-bar-border)' }
];
