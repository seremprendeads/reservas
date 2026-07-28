interface CalendarEventParams {
  title: string;
  date: string;
  time: string;
  durationMinutes?: number;
  description?: string;
  location?: string;
}

export function buildGoogleCalendarUrl(event: CalendarEventParams): string {
  const { title, date, time, durationMinutes = 60, description = '', location = '' } = event;

  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);

  const start = new Date(y, m - 1, d, h, min);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const fmt = (dt: Date) => {
    return dt.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  };

  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    dates: `${fmt(start)}/${fmt(end)}`,
    details: description,
    location: location,
  });

  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

export function buildICSFile(event: CalendarEventParams): void {
  const { title, date, time, durationMinutes = 60, description = '', location = '' } = event;

  const [y, m, d] = date.split('-').map(Number);
  const [h, min] = time.split(':').map(Number);

  const start = new Date(y, m - 1, d, h, min);
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000);

  const fmtICS = (dt: Date): string => {
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${dt.getFullYear()}${pad(dt.getMonth() + 1)}${pad(dt.getDate())}T${pad(dt.getHours())}${pad(dt.getMinutes())}${pad(dt.getSeconds())}`;
  };

  const now = new Date();
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@bookingbio`;

  const ics = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//BookingBio//Reserva//ES',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:${uid}`,
    `DTSTART:${fmtICS(start)}`,
    `DTEND:${fmtICS(end)}`,
    `SUMMARY:${escapeICS(title)}`,
    `DESCRIPTION:${escapeICS(description)}`,
    location ? `LOCATION:${escapeICS(location)}` : '',
    `DTSTAMP:${fmtICS(now)}`,
    'STATUS:CONFIRMED',
    'END:VEVENT',
    'END:VCALENDAR',
  ]
    .filter(Boolean)
    .join('\r\n');

  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${title.replace(/[^a-zA-Z0-9]/g, '_')}.ics`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function escapeICS(text: string): string {
  return text
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\n/g, '\\n');
}

export function buildGoogleCalendarUrlForEmail(
  event: CalendarEventParams,
  siteUrl: string
): string {
  return buildGoogleCalendarUrl(event);
}
