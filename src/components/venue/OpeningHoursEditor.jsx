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

// Horas disponibles en formato 24h cada 30 minutos
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
      // Apagar → marcar como cerrado borrando open y close
      onChange({
        ...value,
        [day]: { open: null, close: null },
      });
    } else {
      // Encender → poner horario por defecto
      onChange({
        ...value,
        [day]: { open: '18:00', close: '02:00' },
      });
    }
  };

  const handleChange = (day, field, val) => {
    onChange({
      ...value,
      [day]: {
        ...value[day],
        [field]: val,
      },
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
              className={`flex items-center gap-3 px-4 py-3 transition-colors ${
                open ? 'bg-[#1a1a1a]' : 'bg-[#111]'
              }`}
            >
              {/* Nombre del día */}
              <span className="text-sm font-medium text-gray-300 w-24 flex-shrink-0">
                {label}
              </span>

              {/* Toggle */}
              <button
                type="button"
                onClick={() => handleToggle(key)}
                className={`relative w-10 h-5 rounded-full transition-colors flex-shrink-0 ${
                  open ? 'bg-[#ff0080]' : 'bg-[#333]'
                }`}
              >
                <span
                  className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform ${
                    open ? 'translate-x-5' : 'translate-x-0.5'
                  }`}
                />
              </button>

              {open ? (
                // Selectores de hora
                <div className="flex items-center gap-2 flex-1">
                  <select
                    value={value[key]?.open || '18:00'}
                    onChange={(e) => handleChange(key, 'open', e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm focus:border-[#ff0080] outline-none"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>

                  <span className="text-gray-500 text-xs flex-shrink-0">hasta</span>

                  <select
                    value={value[key]?.close || '02:00'}
                    onChange={(e) => handleChange(key, 'close', e.target.value)}
                    className="flex-1 px-2 py-1.5 bg-[#0f0f0f] border border-[#2a2a2a] rounded-lg text-white text-sm focus:border-[#ff0080] outline-none"
                  >
                    {HOURS.map((h) => (
                      <option key={h} value={h}>{h}</option>
                    ))}
                  </select>
                </div>
              ) : (
                // Estado cerrado
                <span className="text-xs font-medium text-red-500/70 bg-red-500/10 px-3 py-1 rounded-full">
                  Cerrado
                </span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}