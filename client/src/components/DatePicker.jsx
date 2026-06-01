import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { Calendar, ChevronLeft, ChevronRight } from 'lucide-react';

import useClickAway from '../hooks/useClickAway.js';

const WEEKDAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function pad(n) {
  return String(n).padStart(2, '0');
}

export function toYMD(date) {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function parseYMD(str) {
  if (!str) return null;
  const [y, m, d] = str.split('-').map(Number);
  if (!y || !m || !d) return null;
  const date = new Date(y, m - 1, d);
  return Number.isNaN(date.getTime()) ? null : date;
}

function formatDisplay(ymd) {
  const d = parseYMD(ymd);
  if (!d) return '';
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function buildCalendarDays(year, month) {
  const first = new Date(year, month, 1);
  const startPad = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const cells = [];
  const prevMonthDays = new Date(year, month, 0).getDate();
  for (let i = startPad - 1; i >= 0; i -= 1) {
    cells.push({ day: prevMonthDays - i, inMonth: false, date: new Date(year, month - 1, prevMonthDays - i) });
  }
  for (let d = 1; d <= daysInMonth; d += 1) {
    cells.push({ day: d, inMonth: true, date: new Date(year, month, d) });
  }
  let next = 1;
  while (cells.length < 42) {
    cells.push({ day: next, inMonth: false, date: new Date(year, month + 1, next) });
    next += 1;
  }
  return cells;
}

/**
 * Custom date picker with orange/dark theme (replaces native type="date").
 */
export default function DatePicker({
  value = '',
  onChange,
  min,
  max,
  disabled = false,
  placeholder = 'Select date',
  className = '',
  wrapperClassName = '',
  id,
  name,
  'aria-label': ariaLabel,
}) {
  const autoId = useId();
  const inputId = id || autoId;
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const parsed = parseYMD(value);
  const today = useMemo(() => new Date(), []);
  const [viewYear, setViewYear] = useState(() => (parsed ?? today).getFullYear());
  const [viewMonth, setViewMonth] = useState(() => (parsed ?? today).getMonth());

  useClickAway(wrapRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  useEffect(() => {
    const d = parseYMD(value);
    if (d) {
      setViewYear(d.getFullYear());
      setViewMonth(d.getMonth());
    }
  }, [value]);

  const cells = useMemo(() => buildCalendarDays(viewYear, viewMonth), [viewYear, viewMonth]);

  const minD = parseYMD(min);
  const maxD = parseYMD(max);

  const isDisabledDate = (date) => {
    if (minD && date < new Date(minD.getFullYear(), minD.getMonth(), minD.getDate())) return true;
    if (maxD && date > new Date(maxD.getFullYear(), maxD.getMonth(), maxD.getDate())) return true;
    return false;
  };

  const emitChange = (next) => {
    onChange?.({
      target: { value: next, name: name ?? '' },
      currentTarget: { value: next, name: name ?? '' },
    });
  };

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear((y) => y - 1);
    } else setViewMonth((m) => m - 1);
  };

  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear((y) => y + 1);
    } else setViewMonth((m) => m + 1);
  };

  const todayYmd = toYMD(today);
  const isToday = (date) => toYMD(date) === todayYmd;

  return (
    <div ref={wrapRef} className={`relative min-w-0 max-w-full ${wrapperClassName}`.trim()}>
      <button
        type="button"
        id={inputId}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="dialog"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`picker-trigger flex w-full items-center justify-between gap-2 text-left ${open ? 'picker-trigger-open' : ''} ${!value ? 'text-slate-500' : ''} ${className}`.trim()}
      >
        <span className="truncate">{value ? formatDisplay(value) : placeholder}</span>
        <Calendar className="h-4 w-4 shrink-0 text-slate-500" />
      </button>

      {open && (
        <div className="picker-panel absolute left-0 z-50 mt-1.5 w-[17rem]">
          <div className="picker-cal-header">
            <button type="button" onClick={prevMonth} className="picker-cal-nav" aria-label="Previous month">
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="text-sm font-medium text-white">
              {MONTHS[viewMonth]} {viewYear}
            </span>
            <button type="button" onClick={nextMonth} className="picker-cal-nav" aria-label="Next month">
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="picker-cal-weekdays">
            {WEEKDAYS.map((d) => (
              <span key={d} className="py-1">
                {d}
              </span>
            ))}
          </div>

          <div className="picker-cal-grid">
            {cells.map(({ day, inMonth, date }, i) => {
              const ymd = toYMD(date);
              const selected = value === ymd;
              const disabledDay = isDisabledDate(date);
              return (
                <button
                  key={`${ymd}-${i}`}
                  type="button"
                  disabled={disabledDay}
                  onClick={() => {
                    emitChange(ymd);
                    setOpen(false);
                  }}
                  className={[
                    'picker-day',
                    !inMonth && 'picker-day-out',
                    selected && 'picker-day-selected',
                    !selected && isToday(date) && 'picker-day-today',
                  ]
                    .filter(Boolean)
                    .join(' ')}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <div className="picker-cal-footer">
            <button
              type="button"
              onClick={() => {
                emitChange('');
                setOpen(false);
              }}
            >
              Clear
            </button>
            <button
              type="button"
              onClick={() => {
                emitChange(todayYmd);
                setOpen(false);
              }}
            >
              Today
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
