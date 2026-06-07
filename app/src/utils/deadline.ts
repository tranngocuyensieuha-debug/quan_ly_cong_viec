import type { DeadlineStatus } from '../types';

function parseLocalDate(dateString: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function getDaysRemaining(deadline: string): number {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const deadlineDate = parseLocalDate(deadline);
  deadlineDate.setHours(0, 0, 0, 0);

  const diffMs = deadlineDate.getTime() - today.getTime();
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

export function getDeadlineStatus(deadline: string): DeadlineStatus {
  const daysRemaining = getDaysRemaining(deadline);

  if (daysRemaining < 0) return 'overdue';
  if (daysRemaining <= 3) return 'warning';
  return 'normal';
}

export function formatDate(dateString: string): string {
  return parseLocalDate(dateString).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });
}
