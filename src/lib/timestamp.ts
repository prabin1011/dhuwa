export type TimestampLike =
  | Date
  | string
  | number
  | {
      toDate?: () => Date;
      seconds?: number;
      nanoseconds?: number;
    }
  | null
  | undefined;

export function timestampToDate(value: TimestampLike): Date | null {
  if (!value) return null;

  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }

  if (typeof value === 'string' || typeof value === 'number') {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? null : date;
  }

  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  if (typeof value.seconds === 'number') {
    const date = new Date(value.seconds * 1000 + Math.floor((value.nanoseconds ?? 0) / 1_000_000));
    return Number.isNaN(date.getTime()) ? null : date;
  }

  return null;
}
