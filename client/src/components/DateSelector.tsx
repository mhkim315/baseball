import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

function getWeekDates(baseDate: Date): Date[] {
  const dates: Date[] = [];
  const day = baseDate.getDay();
  const monday = new Date(baseDate);
  monday.setDate(baseDate.getDate() - ((day + 6) % 7));
  for (let i = 0; i < 7; i++) {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    dates.push(d);
  }
  return dates;
}

function formatDate(date: Date): string {
  return `${date.getMonth() + 1}.${date.getDate()}`;
}

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}

interface DateSelectorProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  hasGameDates?: string[];
}

export default function DateSelector({
  selectedDate,
  onDateChange,
  hasGameDates = [],
}: DateSelectorProps) {
  const [weekBase, setWeekBase] = useState(selectedDate);
  const weekDates = getWeekDates(weekBase);

  const goToPrevWeek = () => {
    const prev = new Date(weekBase);
    prev.setDate(weekBase.getDate() - 7);
    setWeekBase(prev);
  };

  const goToNextWeek = () => {
    const next = new Date(weekBase);
    next.setDate(weekBase.getDate() + 7);
    setWeekBase(next);
  };

  return (
    <div className="flex items-center gap-2 px-2 py-3">
      <button
        onClick={goToPrevWeek}
        className="p-2 rounded-full hover:bg-accent transition-colors"
      >
        <ChevronLeft size={18} className="text-muted-foreground" />
      </button>

      <div className="flex-1 flex items-center justify-between gap-1">
        {weekDates.map((date) => {
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, new Date());
          const dayIndex = date.getDay();
          const d = date;
          const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
          const hasGame = hasGameDates.includes(dateStr);

          return (
            <button
              key={dateStr}
              onClick={() => onDateChange(date)}
              className={`flex flex-col items-center gap-1 py-2 px-2 rounded-xl transition-all flex-1 ${
                isSelected
                  ? "bg-foreground text-primary-foreground"
                  : "hover:bg-accent"
              }`}
            >
              <span
                className={`text-[10px] ${
                  isSelected
                    ? "text-primary-foreground/70"
                    : dayIndex === 0
                    ? "text-destructive"
                    : dayIndex === 6
                    ? "text-blue-500"
                    : "text-muted-foreground"
                }`}
              >
                {DAYS[dayIndex]}
              </span>
              <span
                className={`text-sm font-medium ${
                  isSelected ? "text-primary-foreground" : ""
                }`}
              >
                {date.getDate()}
              </span>
              {hasGame && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-foreground" />
              )}
              {isToday && !isSelected && (
                <div className="w-1 h-1 rounded-full bg-destructive" />
              )}
            </button>
          );
        })}
      </div>

      <button
        onClick={goToNextWeek}
        className="p-2 rounded-full hover:bg-accent transition-colors"
      >
        <ChevronRight size={18} className="text-muted-foreground" />
      </button>
    </div>
  );
}
