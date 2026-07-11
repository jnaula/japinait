// ─────────────────────────────────────────────────────────────────────────────
// VenueTypeFields.jsx
// Renderiza dinámicamente los campos específicos según el tipo de venue.
// Usado en RegisterVenue y EditVenue.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import { getVenueConfig, getVenueFields } from '../../config/venueTypeConfig';

// ── Componentes de campo individuales ────────────────────────────────────────

function ToggleField({ fieldKey, field, value, onChange }) {
  return (
    <div className="flex items-center justify-between py-3 px-4 bg-[#1a1a1a] rounded-xl border border-[#2a2a2a]">
      <span className="text-gray-300 text-sm font-medium">{field.label}</span>
      <button
        type="button"
        onClick={() => onChange(fieldKey, !value)}
        className={`relative w-11 h-6 rounded-full transition-colors ${value ? 'bg-[#ff0080]' : 'bg-[#333]'}`}
      >
        <span className={`absolute top-1 w-4 h-4 bg-white rounded-full shadow-md transition-transform ${value ? 'translate-x-6' : 'translate-x-1'}`} />
      </button>
    </div>
  );
}

function SelectField({ fieldKey, field, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{field.label}</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white focus:outline-none focus:border-[#ff0080] transition-colors text-sm"
      >
        <option value="">Seleccionar...</option>
        {field.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    </div>
  );
}

function TextField({ fieldKey, field, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{field.label}</label>
      <input
        type="text"
        value={value || ''}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder={field.placeholder || ''}
        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0080] transition-colors text-sm"
      />
    </div>
  );
}

function NumberField({ fieldKey, field, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{field.label}</label>
      <input
        type="number"
        value={value || ''}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder={field.placeholder || ''}
        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0080] transition-colors text-sm"
      />
    </div>
  );
}

function TextareaField({ fieldKey, field, value, onChange }) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-2">{field.label}</label>
      <textarea
        value={value || ''}
        onChange={(e) => onChange(fieldKey, e.target.value)}
        placeholder={field.placeholder || ''}
        rows={3}
        className="w-full px-4 py-3 bg-[#1a1a1a] border border-[#2a2a2a] rounded-lg text-white placeholder-gray-600 focus:outline-none focus:border-[#ff0080] transition-colors text-sm resize-none"
      />
    </div>
  );
}

function MulticheckField({ fieldKey, field, value = [], onChange }) {
  const toggleOption = (opt) => {
    const current = Array.isArray(value) ? value : [];
    if (current.includes(opt)) {
      onChange(fieldKey, current.filter((v) => v !== opt));
    } else {
      onChange(fieldKey, [...current, opt]);
    }
  };

  return (
    <div>
      <label className="block text-sm font-medium text-gray-300 mb-3">{field.label}</label>
      <div className="flex flex-wrap gap-2">
        {field.options.map((opt) => {
          const selected = Array.isArray(value) && value.includes(opt);
          return (
            <button
              key={opt}
              type="button"
              onClick={() => toggleOption(opt)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-all ${
                selected
                  ? 'bg-gradient-to-r from-[#ff0080] to-[#7928ca] text-white'
                  : 'bg-[#1a1a1a] text-gray-400 border border-[#2a2a2a] hover:border-[#ff0080]'
              }`}
            >
              {opt}
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ── Renderer principal ────────────────────────────────────────────────────────

function renderField({ fieldKey, field, value, onChange }) {
  switch (field.type) {
    case 'toggle':
      return <ToggleField key={fieldKey} fieldKey={fieldKey} field={field} value={value} onChange={onChange} />;
    case 'select':
      return <SelectField key={fieldKey} fieldKey={fieldKey} field={field} value={value} onChange={onChange} />;
    case 'text':
      return <TextField key={fieldKey} fieldKey={fieldKey} field={field} value={value} onChange={onChange} />;
    case 'number':
      return <NumberField key={fieldKey} fieldKey={fieldKey} field={field} value={value} onChange={onChange} />;
    case 'textarea':
      return <TextareaField key={fieldKey} fieldKey={fieldKey} field={field} value={value} onChange={onChange} />;
    case 'multicheck':
      return <MulticheckField key={fieldKey} fieldKey={fieldKey} field={field} value={value} onChange={onChange} />;
    default:
      return null;
  }
}

// ── Separar campos en grupos ──────────────────────────────────────────────────

function groupFields(fields) {
  const toggles = [];
  const others = [];
  Object.entries(fields).forEach(([key, field]) => {
    if (field.type === 'toggle') toggles.push([key, field]);
    else others.push([key, field]);
  });
  return { toggles, others };
}

// ── Componente principal exportado ────────────────────────────────────────────

/**
 * VenueTypeFields
 * @param {string} venueTypeName - Nombre del tipo (ej: "Bar", "Discoteca")
 * @param {object} values - Estado actual de venue_details
 * @param {function} onChange - (fieldKey, value) => void
 */
export default function VenueTypeFields({ venueTypeName, values = {}, onChange }) {
  const config = getVenueConfig(venueTypeName);

  if (!config) return null;

  const fields = getVenueFields(venueTypeName);
  const { toggles, others } = groupFields(fields);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="space-y-5"
    >
      {/* Descripción del tipo */}
      <div className="flex items-start gap-3 p-4 bg-[#7928ca]/10 border border-[#7928ca]/20 rounded-xl">
        <span className="text-2xl flex-shrink-0">{config.icon}</span>
        <div>
          <p className="text-white font-semibold text-sm">{config.label}</p>
          <p className="text-gray-400 text-xs mt-0.5">{config.description}</p>
        </div>
      </div>

      {/* Campos de texto/select/multicheck */}
      {others.length > 0 && (
        <div className="space-y-4">
          {others.map(([key, field]) =>
            renderField({ fieldKey: key, field, value: values[key], onChange })
          )}
        </div>
      )}

      {/* Toggles agrupados */}
      {toggles.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-3">
            Características y servicios
          </p>
          <div className="space-y-2">
            {toggles.map(([key, field]) =>
              renderField({ fieldKey: key, field, value: values[key], onChange })
            )}
          </div>
        </div>
      )}
    </motion.div>
  );
}
