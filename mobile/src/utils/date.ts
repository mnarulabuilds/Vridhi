import { formatDistanceToNow } from 'date-fns/formatDistanceToNow';

export function relativeDate(
  date: Date | string,
) {
  return formatDistanceToNow(
    new Date(date),
    {
      addSuffix: true,
    },
  );
}