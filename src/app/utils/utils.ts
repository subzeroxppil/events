export function getRelativeTime(date: Date | string): string {
  const now = new Date();
  const targetDate = date instanceof Date ? date : new Date(date);
  const diffInSeconds = Math.floor(
    (now.getTime() - targetDate.getTime()) / 1000
  );

  const intervals: { unit: string; seconds: number }[] = [
    { unit: "year", seconds: 31536000 },
    { unit: "month", seconds: 2592000 },
    { unit: "week", seconds: 604800 },
    { unit: "day", seconds: 86400 },
    { unit: "hour", seconds: 3600 },
    { unit: "minute", seconds: 60 },
  ];

  for (const interval of intervals) {
    const count = Math.floor(diffInSeconds / interval.seconds);
    if (count > 0) {
      const plural = count === 1 ? "" : "s";
      return `${count} ${interval.unit}${plural} ago`;
    }
  }

  return "1 minute ago";
}
