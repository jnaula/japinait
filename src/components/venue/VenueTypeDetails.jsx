// ─────────────────────────────────────────────────────────────────────────────
// VenueTypeDetails.jsx
// Visualización dinámica de los campos específicos según el tipo de venue.
// Usado en VenueDetail.jsx
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { motion } from 'framer-motion';
import { getVenueConfig, getVenueFields } from '../../config/venueTypeConfig';

// ── Íconos por sección ────────────────────────────────────────────────────────
const SECTION_ICONS = {
  happyHour: '🍺', musica: '🎵', musica_en_vivo: '🎸', eventos: '🎉',
  cover: '🎫', reservas: '📅', reservas_vip: '👑', servicios: '✨',
  delivery: '🛵', tiempo_estimado: '⏱️', productos: '🛒', metodos_pago: '💳',
  combos: '📦', dj_residente: '🎧', genero_musical: '🎶',
  codigo_vestimenta: '👔', vista_panoramica: '🌆', terraza: '🌿',
  cocteles: '🍹', salas_privadas: '🚪', catalogo_canciones: '🎤',
  almuerzos: '🍽️', cena: '🌙', menu: '📋', tipo_cocina: '👨‍🍳',
  ambiente: '🌟', wifi: '📶', parqueadero: '🅿️',
};

// ── Chip de valor booleano ────────────────────────────────────────────────────
function BoolChip({ label, active }) {
  if (!active) return null;
  return (
    <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold bg-[#7928ca]/15 text-[#a855f7] border border-[#7928ca]/25">
      ✓ {label}
    </span>
  );
}

// ── Chip de opción de multicheck ─────────────────────────────────────────────
function OptionChip({ label }) {
  return (
    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold bg-[#1a1a1a] text-gray-300 border border-[#2a2a2a]">
      {label}
    </span>
  );
}

// ── Tarjeta de sección destacada ─────────────────────────────────────────────
function HighlightCard({ icon, title, value }) {
  if (!value && value !== true) return null;
  return (
    <div className="flex items-start gap-3 p-4 bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl">
      <span className="text-xl flex-shrink-0">{icon || '✨'}</span>
      <div>
        <p className="text-gray-500 text-xs mb-0.5">{title}</p>
        {typeof value === 'boolean'
          ? <p className="text-white font-semibold text-sm">Disponible</p>
          : Array.isArray(value)
            ? <div className="flex flex-wrap gap-1.5 mt-1">{value.map((v) => <OptionChip key={v} label={v} />)}</div>
            : <p className="text-white font-semibold text-sm">{value}</p>
        }
      </div>
    </div>
  );
}

// ── Componente principal ──────────────────────────────────────────────────────

/**
 * VenueTypeDetails
 * @param {string} venueTypeName - Nombre del tipo (ej: "Bar")
 * @param {object} venueDetails  - Objeto venue_details desde Supabase
 */
export default function VenueTypeDetails({ venueTypeName, venueDetails }) {
  const config = getVenueConfig(venueTypeName);
  const fields = getVenueFields(venueTypeName);

  if (!config || !venueDetails || Object.keys(venueDetails).length === 0) return null;

  // Separar campos con valor
  const filledFields = Object.entries(fields).filter(([key]) => {
    const val = venueDetails[key];
    if (val === undefined || val === null || val === '') return false;
    if (typeof val === 'boolean' && val === false) return false;
    if (Array.isArray(val) && val.length === 0) return false;
    return true;
  });

  if (filledFields.length === 0) return null;

  // Ordenar según detailPriority del config
  const priority = config.detailPriority || [];
  const sorted = [
    ...priority.filter((key) => filledFields.find(([k]) => k === key)),
    ...filledFields.map(([k]) => k).filter((k) => !priority.includes(k)),
  ];

  // Separar toggles de otros
  const toggleFields = filledFields.filter(([k, f]) => f.type === 'toggle' && venueDetails[k] === true);
  const otherFields = filledFields.filter(([, f]) => f.type !== 'toggle');

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mb-6"
    >
      {/* Header de sección */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-xl">{config.icon}</span>
        <h3 className="text-white font-bold text-lg">
          Sobre este {config.label}
        </h3>
      </div>

      {/* Campos destacados (no toggle) */}
      {otherFields.length > 0 && (
        <div className="grid gap-3 mb-4">
          {otherFields
            .sort(([a], [b]) => {
              const ai = sorted.indexOf(a);
              const bi = sorted.indexOf(b);
              return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
            })
            .map(([key, field]) => (
              <HighlightCard
                key={key}
                icon={SECTION_ICONS[key]}
                title={field.label}
                value={venueDetails[key]}
              />
            ))}
        </div>
      )}

      {/* Toggles como chips */}
      {toggleFields.length > 0 && (
        <div>
          <p className="text-gray-500 text-xs font-semibold uppercase tracking-widest mb-2">
            Características
          </p>
          <div className="flex flex-wrap gap-2">
            {toggleFields
              .sort(([a], [b]) => {
                const ai = sorted.indexOf(a);
                const bi = sorted.indexOf(b);
                return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
              })
              .map(([key, field]) => (
                <BoolChip key={key} label={field.label} active={true} />
              ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}
