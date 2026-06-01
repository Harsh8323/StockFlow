import { Children, useEffect, useId, useMemo, useRef, useState } from 'react';
import { ChevronDown } from 'lucide-react';

import useClickAway from '../hooks/useClickAway.js';

function parseOptions(children) {
  const list = [];
  Children.forEach(children, (child) => {
    if (!child || typeof child !== 'object') return;
    if (child.type === 'option' || child.props?.value !== undefined) {
      list.push({
        value: String(child.props.value ?? ''),
        label: child.props.children ?? child.props.value,
        disabled: !!child.props.disabled,
      });
    }
  });
  return list;
}

/**
 * Custom dropdown — fully themed (no native OS select popup).
 * Accepts <option> children or an `options` array.
 */
export default function Select({
  value,
  onChange,
  children,
  options: optionsProp,
  placeholder,
  disabled = false,
  className = '',
  wrapperClassName = '',
  id,
  name,
  'aria-label': ariaLabel,
}) {
  const autoId = useId();
  const listId = id || autoId;
  const wrapRef = useRef(null);
  const [open, setOpen] = useState(false);

  const options = useMemo(
    () => optionsProp ?? parseOptions(children),
    [optionsProp, children]
  );

  const selected = options.find((o) => o.value === String(value ?? ''));
  const displayLabel =
    selected?.label ??
    (value === '' || value === undefined ? placeholder || 'Select…' : String(value));

  useClickAway(wrapRef, () => setOpen(false), open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  const emitChange = (next) => {
    onChange?.({
      target: { value: next, name: name ?? '' },
      currentTarget: { value: next, name: name ?? '' },
    });
  };

  return (
    <div ref={wrapRef} className={`relative min-w-0 max-w-full ${wrapperClassName}`.trim()}>
      <button
        type="button"
        id={listId}
        disabled={disabled}
        aria-label={ariaLabel}
        aria-haspopup="listbox"
        aria-expanded={open}
        onClick={() => !disabled && setOpen((v) => !v)}
        className={`picker-trigger flex w-full items-center justify-between text-left ${open ? 'border-brand-500/50 ring-2 ring-brand-500/25' : ''} ${!selected && (value === '' || value === undefined) ? 'text-slate-500' : ''} ${className}`.trim()}
      >
        <span className="truncate pr-2">{displayLabel}</span>
        <ChevronDown
          className={`h-4 w-4 shrink-0 text-slate-500 transition ${open ? 'rotate-180' : ''}`}
        />
      </button>

      {open && (
        <ul
          role="listbox"
          aria-labelledby={listId}
          className="picker-panel absolute left-0 right-0 z-50 mt-1.5 max-h-60 overflow-auto py-1"
        >
          {options.map((opt) => {
            const isSelected = opt.value === String(value ?? '');
            return (
              <li key={opt.value || '__empty'} role="option" aria-selected={isSelected}>
                <button
                  type="button"
                  disabled={opt.disabled}
                  onClick={() => {
                    emitChange(opt.value);
                    setOpen(false);
                  }}
                  className={`picker-option ${isSelected ? 'picker-option-active' : ''}`}
                >
                  {opt.label}
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
