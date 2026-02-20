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

export default function OpeningHoursEditor({ value, onChange }) {
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
    <div className="space-y-4">
      <label className="flex items-center space-x-2 text-sm font-medium text-gray-300 mb-2">
        <Clock className="w-4 h-4 text-[#ff0080]" />
        <span>Horarios de Apertura</span>
      </label>
      <div className="grid gap-2">
        {DAYS.map(({ key, label }) => (
          <div key={key} className="grid grid-cols-3 gap-2 items-center bg-[#1a1a1a] p-2 rounded-lg border border-[#2a2a2a]">
            <span className="text-gray-400 text-sm font-medium">{label}</span>
            <input
              type="time"
              value={value[key]?.open || ''}
              onChange={(e) => handleChange(key, 'open', e.target.value)}
              className="px-2 py-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded text-white text-sm focus:border-[#ff0080] outline-none"
            />
            <input
              type="time"
              value={value[key]?.close || ''}
              onChange={(e) => handleChange(key, 'close', e.target.value)}
              className="px-2 py-1 bg-[#0f0f0f] border border-[#2a2a2a] rounded text-white text-sm focus:border-[#ff0080] outline-none"
            />
          </div>
        ))}
      </div>
    </div>
  );
}
