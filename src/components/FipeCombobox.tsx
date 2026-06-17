import { useState, useRef, useEffect } from 'react';
import { ChevronDown, Loader2 } from 'lucide-react';

export interface ComboOption { value: string; label: string; }

interface Props {
  options: ComboOption[];
  value: string;
  onSelect: (opt: ComboOption) => void;
  placeholder?: string;
  disabled?: boolean;
  loading?: boolean;
}

const inputCls =
  'w-full border border-gray-300 rounded-lg px-3 py-2 pr-8 text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition';

export default function FipeCombobox({ options, value, onSelect, placeholder, disabled, loading }: Props) {
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  useEffect(() => {
    if (!value) setQuery('');
  }, [value]);

  const filtered = query
    ? options.filter((o) => o.label.toLowerCase().includes(query.toLowerCase()))
    : options;

  return (
    <div ref={containerRef} className="relative">
      <input
        className={
          inputCls +
          (disabled || loading ? ' bg-gray-50 text-gray-400 cursor-not-allowed' : '')
        }
        placeholder={loading ? 'Carregando...' : placeholder}
        value={open ? query : value}
        disabled={disabled || loading}
        onFocus={() => { setOpen(true); setQuery(''); }}
        onChange={(e) => setQuery(e.target.value)}
      />
      <div className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-gray-400">
        {loading
          ? <Loader2 size={14} className="animate-spin" />
          : <ChevronDown size={14} />}
      </div>

      {open && !loading && (
        <ul className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-lg max-h-52 overflow-y-auto text-sm">
          {filtered.length > 0
            ? filtered.map((o) => (
                <li
                  key={o.value}
                  onMouseDown={() => { onSelect(o); setOpen(false); setQuery(''); }}
                  className="px-3 py-2 hover:bg-blue-50 cursor-pointer"
                >
                  {o.label}
                </li>
              ))
            : <li className="px-3 py-2 text-gray-400">Nenhum resultado</li>}
        </ul>
      )}
    </div>
  );
}
