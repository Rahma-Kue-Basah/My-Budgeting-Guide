const currencyFormatter = new Intl.NumberFormat("id-ID", {
  style: "currency",
  currency: "IDR",
  maximumFractionDigits: 0,
});

const compactNumberFormatter = new Intl.NumberFormat("id-ID", {
  notation: "compact",
  maximumFractionDigits: 1,
});

const shortDateFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const shortMonthYearFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "short",
  year: "2-digit",
});

const fullMonthYearFormatter = new Intl.DateTimeFormat("id-ID", {
  month: "long",
  year: "numeric",
});

const dayMonthFormatter = new Intl.DateTimeFormat("id-ID", {
  day: "2-digit",
  month: "short",
});

export function formatCurrency(value: number | null) {
  if (value === null) {
    return "-";
  }

  return currencyFormatter.format(value);
}

export function formatCompactNumber(value: number) {
  return compactNumberFormatter.format(value);
}

export function formatDate(value: string) {
  return shortDateFormatter.format(new Date(value));
}

export function formatShortMonthLabel(value: string) {
  return shortMonthYearFormatter.format(new Date(value));
}

export function formatMonthLabel(value: string) {
  const [year, month] = value.split("-");

  return fullMonthYearFormatter.format(
    new Date(Number(year), Number(month) - 1, 1),
  );
}

export function formatDayMonthLabel(value: string) {
  return dayMonthFormatter.format(new Date(value));
}

export function formatFileSize(size: number) {
  if (size < 1024) {
    return `${size} B`;
  }

  if (size < 1024 * 1024) {
    return `${(size / 1024).toFixed(1)} KB`;
  }

  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function formatShortDateTime(value: string) {
  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

export function formatRelativeTime(value: string) {
  const now = Date.now();
  const date = new Date(value).getTime();
  const diffMinutes = Math.max(1, Math.round((now - date) / 60000));

  if (diffMinutes < 60) {
    return `${diffMinutes} menit lalu`;
  }

  const diffHours = Math.round(diffMinutes / 60);
  if (diffHours < 24) {
    return `${diffHours} jam lalu`;
  }

  const diffDays = Math.round(diffHours / 24);
  return `${diffDays} hari lalu`;
}

export function formatStatementPeriod(value: string | null) {
  if (!value) {
    return "Tidak terdeteksi";
  }

  return value;
}
