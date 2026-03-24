import React from 'react';
import { Clock } from 'lucide-react';

const DAYS = [
  { key: 'monday', label: 'Lunes' },
  { key: 'tuesday', label: 'Martes' },
  { key: 'wednesday', label: 'Miércoles' },
  { key: 'thursday', label: 'Jueves' },
  { key: 'friday', label: 'Viernes' },
  { key: 'saturday', label: 'Sábado' },
  { key: 'sunday', label: 'Domingo' },
];

const HOURS = Array.from({ length: 48 }, (_, i) => {
  const h = Math.floor(i / 2).toString().padStart(2, '0');
  const m = i % 2 === 0 ? '00' : '30';
  return `${h}:${m}`;
});

export default function OpeningHoursEditor({ value, onChange }) {

  const isOpen = (day) => {
    return value[day]?.open && value[day]?.close;
  };

  const handleToggle = (day) => {
    if (isOpen(day)) {
      onChange({ ...value, [day]: { open: null, close: null } });
    } else {
      onChange({ ...value, [day]: { open: '18:00', close: '02:00' } });
    }
  };

  const handleChange = (day, field, val) => {
    onChange({
      ...value,
      [day]: { ...value[day], [field]: val },
    });
  };

  return (
    <div className="space-y-3">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-300">
        <Clock className="w-4 h-4 text-[#ff0080]" />
        <span>Horarios de Atención</span>
      </label>

      <div className="rounded-xl border border-[#2a2a2a] overflow-hidden divide-y divide-[#2a2a2a]">
        {DAYS.map(({ key, label }) => {
          const open = isOpen(key);
          return (
            <div
              key={key}
              className={`px-4 py-3 transition-colors ${open ? 'bg-[#1a1a1a]' : 'bg-[#111]'}`}
            >
              {/* Fila superior: nombre + toggle */}
              <div className="flex items-center justify-between mb-2">
                <span className={`text-sm font-semibold ${open ? 'text-white' : 'text-gray-500'}`}>
                  {label}
                </span>
                <div className="flex items-center gap-2">
                  {!open && (
                    <span className="text-xs font-medium text-red-500/70 bg-red-500/10 px-2.5 py-0.5 rounded-full">
                      Cerrado
                    </span>
                  )}
                  {open && (
                    <span className="text-xs font-medium text-green-400/70 bg-green-400/10 px-2.5 py-0.5 rounded-full">
                      Abierto
                    </span>
                  )}
                  {/* Toggle */}
                  <button
                    type="button"
                    onClick={() => handleToggle(key)}
                    className={`relative w-11 h-6 rounded-full transition-colors ${
                      open ? 'bg-[#ff0080]' : 'bg-[#333]'
                    }`}
                  >
                    <span
                      className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${
                        open ? 'translate-x-6' : 'translate-x-1'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Fila inferior: selectores de hora (solo si está abierto) */}
              {open && (
                <div className="grid grid-cols-2 gap-3 mt-1">
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide pl-1">
                      Abre
                    </span>
                    <select
                      value={value[key]?.open || '18:00'}
                      onChange={(e) => handleChange(key, 'open', e.target.value)}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm focus:border-[#ff0080] outline-none transition-colors"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                  <div className="flex flex-col gap-1">
                    <span className="text-[11px] text-gray-500 uppercase tracking-wide pl-1">
                      Cierra
                    </span>
                    <select
                      value={value[key]?.close || '02:00'}
                      onChange={(e) => handleChange(key, 'close', e.target.value)}
                      className="w-full px-3 py-2 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm focus:border-[#ff0080] outline-none transition-colors"
                    >
                      {HOURS.map((h) => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
