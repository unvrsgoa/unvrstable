import { useMemo, useState } from "react";

interface DateCalendarProps {
  value: string;
  onChange: (value: string) => void;
  compact?: boolean;
}

function parseDate(value: string) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, (month || 1) - 1, day || 1);
}

function formatDate(date: Date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function startOfMonth(date: Date) {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, amount: number) {
  return new Date(date.getFullYear(), date.getMonth() + amount, 1);
}

function isSameDay(a: Date, b: Date) {
  return formatDate(a) === formatDate(b);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString(undefined, { month: "long", year: "numeric" });
}

export default function DateCalendar({ value, onChange, compact = false }: DateCalendarProps) {
  const selected = useMemo(() => parseDate(value), [value]);
  const [visibleMonth, setVisibleMonth] = useState(() => startOfMonth(selected));
  const today = new Date();

  const days = useMemo(() => {
    const month = startOfMonth(visibleMonth);
    const firstDay = month.getDay();
    const totalDays = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
    const previousMonthDays = new Date(month.getFullYear(), month.getMonth(), 0).getDate();
    const cells: (Date | null)[] = [];

    for (let i = firstDay - 1; i >= 0; i -= 1) {
      cells.push(new Date(month.getFullYear(), month.getMonth() - 1, previousMonthDays - i));
    }
    for (let day = 1; day <= totalDays; day += 1) {
      cells.push(new Date(month.getFullYear(), month.getMonth(), day));
    }
    while (cells.length < 42) {
      cells.push(new Date(month.getFullYear(), month.getMonth() + 1, cells.length - firstDay - totalDays + 1));
    }
    return cells;
  }, [visibleMonth]);

  const chooseDate = (date: Date) => {
    onChange(formatDate(date));
    if (date.getMonth() !== visibleMonth.getMonth()) setVisibleMonth(startOfMonth(date));
  };

  return (
    <div className={`rounded-2xl border border-indigo-100 bg-white shadow-sm ${compact ? "p-3" : "p-4"}`}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-indigo-500">Booking calendar</p>
          <p className={`${compact ? "text-sm" : "text-base"} font-extrabold text-gray-800`}>
            {selected.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <button
          type="button"
          onClick={() => chooseDate(today)}
          className="rounded-lg border border-indigo-200 px-2.5 py-1.5 text-xs font-bold text-indigo-600 transition hover:bg-indigo-50"
        >
          Today
        </button>
      </div>

      <div className={`${compact ? "mt-2" : "mt-4"} flex items-center justify-between`}>
        <button
          type="button"
          aria-label="Previous month"
          onClick={() => setVisibleMonth((month) => addMonths(month, -1))}
          className="rounded-lg px-2 py-1 text-lg font-bold text-gray-500 transition hover:bg-gray-100"
        >
          ‹
        </button>
        <span className="text-sm font-bold text-gray-700">{monthLabel(visibleMonth)}</span>
        <button
          type="button"
          aria-label="Next month"
          onClick={() => setVisibleMonth((month) => addMonths(month, 1))}
          className="rounded-lg px-2 py-1 text-lg font-bold text-gray-500 transition hover:bg-gray-100"
        >
          ›
        </button>
      </div>

      <div className={`${compact ? "mt-1" : "mt-3"} grid grid-cols-7 gap-1 text-center`}>
        {["S", "M", "T", "W", "T", "F", "S"].map((day, index) => (
          <span key={`${day}-${index}`} className="py-1 text-[10px] font-bold uppercase text-gray-400">{day}</span>
        ))}
        {days.map((date, index) => {
          const inMonth = date.getMonth() === visibleMonth.getMonth();
          const selectedDay = isSameDay(date, selected);
          const isToday = isSameDay(date, today);
          return (
            <button
              type="button"
              key={`${formatDate(date)}-${index}`}
              onClick={() => chooseDate(date)}
              className={`relative rounded-lg py-1.5 text-xs font-semibold transition ${
                selectedDay
                  ? "bg-indigo-600 text-white shadow-sm"
                  : inMonth
                  ? "text-gray-700 hover:bg-indigo-50 hover:text-indigo-700"
                  : "text-gray-300 hover:bg-gray-50"
              }`}
            >
              {date.getDate()}
              {isToday && !selectedDay && <span className="absolute bottom-0.5 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-500" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}