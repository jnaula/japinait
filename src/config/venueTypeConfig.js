// ─────────────────────────────────────────────────────────────────────────────
// venueTypeConfig.js
// Configuración central de tipos de negocio para JapiNait.
// Para agregar un nuevo tipo: añade una entrada aquí y crea su Fields component.
// ─────────────────────────────────────────────────────────────────────────────

export const VENUE_TYPE_KEYS = {
  BAR: 'bar',
  DISCOTECA: 'discoteca',
  KARAOKE: 'karaoke',
  LOUNGE: 'lounge',
  RESTOBAR: 'restobar',
  ROOFTOP: 'rooftop',
  LICORERIA: 'licoreria',
};

export const VENUE_TYPE_CONFIG = {
  bar: {
    label: 'Bar',
    icon: '🍺',
    description: 'Registra las promociones, ambiente y servicios que ofrece tu bar.',
    // Secciones que se mostrarán primero en VenueDetail
    detailPriority: ['happyHour', 'musica', 'eventos', 'cover', 'reservas', 'servicios'],
    // Campos del formulario específicos
    fields: {
      // Ambiente
      ambiente: { type: 'select', label: 'Ambiente', options: ['Relajado', 'Animado', 'Deportivo', 'Romántico', 'Social'] },
      musica_en_vivo: { type: 'toggle', label: 'Música en vivo' },
      dj: { type: 'toggle', label: 'DJ' },
      deportes: { type: 'toggle', label: 'Transmisión de deportes' },
      karaoke: { type: 'toggle', label: 'Karaoke' },
      terraza: { type: 'toggle', label: 'Terraza' },
      // Servicios
      reservas: { type: 'toggle', label: 'Reservas' },
      parqueadero: { type: 'toggle', label: 'Parqueadero' },
      wifi: { type: 'toggle', label: 'WiFi' },
      // Precios
      happy_hour: { type: 'text', label: 'Happy Hour', placeholder: 'Ej: Lunes a Jueves de 18:00 a 20:00' },
      cover: { type: 'text', label: 'Cover', placeholder: 'Ej: $5 viernes y sábados' },
    },
  },

  discoteca: {
    label: 'Discoteca',
    icon: '🎧',
    description: 'Destaca tu música, ambiente y experiencia de noche.',
    detailPriority: ['dj_residente', 'genero_musical', 'cover', 'reservas_vip', 'eventos', 'codigo_vestimenta'],
    fields: {
      dj_residente: { type: 'text', label: 'DJ Residente', placeholder: 'Nombre del DJ residente' },
      genero_musical: { type: 'select', label: 'Género Musical Principal', options: ['Electrónica', 'Reggaeton', 'Salsa', 'Rock', 'Pop', 'Hip Hop', 'Variado'] },
      codigo_vestimenta: { type: 'text', label: 'Código de Vestimenta', placeholder: 'Ej: Casual elegante' },
      cover: { type: 'text', label: 'Cover', placeholder: 'Ej: $10 viernes, $15 sábados' },
      reservas_vip: { type: 'toggle', label: 'Reservas VIP' },
      precio_mesa_vip: { type: 'text', label: 'Precio Mesa VIP', placeholder: 'Ej: Desde $150' },
      eventos_especiales: { type: 'toggle', label: 'Eventos especiales' },
    },
  },

  karaoke: {
    label: 'Karaoke',
    icon: '🎤',
    description: 'Registra tus salas, horarios y promociones de karaoke.',
    detailPriority: ['salas_privadas', 'reservas', 'precio_sala', 'promociones'],
    fields: {
      salas_privadas: { type: 'toggle', label: 'Salas privadas' },
      numero_salas: { type: 'number', label: 'Número de salas', placeholder: 'Ej: 5' },
      capacidad_sala: { type: 'text', label: 'Capacidad por sala', placeholder: 'Ej: 2 a 10 personas' },
      precio_sala: { type: 'text', label: 'Precio por sala/hora', placeholder: 'Ej: $20/hora' },
      reservas: { type: 'toggle', label: 'Reservas disponibles' },
      catalogo_canciones: { type: 'text', label: 'Catálogo de canciones', placeholder: 'Ej: +10.000 canciones en español e inglés' },
    },
  },

  lounge: {
    label: 'Lounge',
    icon: '🛋️',
    description: 'Destaca la experiencia, cócteles y ambiente de tu lounge.',
    detailPriority: ['musica_ambiente', 'cocteles', 'reservas', 'terraza', 'eventos_privados'],
    fields: {
      musica_ambiente: { type: 'text', label: 'Música ambiente', placeholder: 'Ej: Jazz, Chill Out, Lounge' },
      cocteles_signature: { type: 'toggle', label: 'Cócteles signature' },
      carta_cocteles: { type: 'text', label: 'Especialidad en cócteles', placeholder: 'Ej: Gin Tonics artesanales' },
      terraza: { type: 'toggle', label: 'Terraza' },
      reservas: { type: 'toggle', label: 'Reservas' },
      eventos_privados: { type: 'toggle', label: 'Eventos privados' },
      aforo: { type: 'number', label: 'Aforo máximo', placeholder: 'Ej: 80' },
    },
  },

  restobar: {
    label: 'Restobar',
    icon: '🍽️',
    description: 'Registra tu menú, horarios y la experiencia gastronómica de tu restobar.',
    detailPriority: ['menu', 'almuerzos', 'cena', 'cocteles', 'musica', 'reservas'],
    fields: {
      tipo_cocina: { type: 'text', label: 'Tipo de cocina', placeholder: 'Ej: Fusión, Ecuatoriana, Internacional' },
      almuerzos: { type: 'toggle', label: 'Almuerzos' },
      precio_almuerzo: { type: 'text', label: 'Precio almuerzo', placeholder: 'Ej: $5 - $8' },
      cena: { type: 'toggle', label: 'Cenas' },
      cocteles: { type: 'toggle', label: 'Cócteles' },
      musica_viva: { type: 'toggle', label: 'Música en vivo' },
      reservas: { type: 'toggle', label: 'Reservas' },
      menu_url: { type: 'text', label: 'Link del menú', placeholder: 'https://...' },
    },
  },

  rooftop: {
    label: 'Rooftop',
    icon: '🌆',
    description: 'Destaca la experiencia, la vista y los eventos de tu rooftop.',
    detailPriority: ['vista_panoramica', 'terraza', 'cocteles', 'musica_en_vivo', 'reservas', 'happy_hour'],
    fields: {
      vista_panoramica: { type: 'text', label: 'Vista panorámica', placeholder: 'Ej: Vista al centro histórico de Quito' },
      terraza_cubierta: { type: 'toggle', label: 'Terraza cubierta' },
      musica_en_vivo: { type: 'toggle', label: 'Música en vivo' },
      tipo_musica: { type: 'text', label: 'Tipo de música', placeholder: 'Ej: Jazz, Acústico, DJ' },
      cocteles: { type: 'toggle', label: 'Cócteles' },
      reservas: { type: 'toggle', label: 'Reservas' },
      happy_hour: { type: 'text', label: 'Happy Hour', placeholder: 'Ej: Jueves a Sábados 18:00 - 20:00' },
      aforo: { type: 'number', label: 'Aforo máximo', placeholder: 'Ej: 120' },
    },
  },

  licoreria: {
    label: 'Licorería',
    icon: '🛒',
    description: 'Registra tus productos, métodos de entrega y promociones.',
    detailPriority: ['delivery', 'tiempo_estimado', 'productos', 'metodos_pago', 'combos'],
    // La licorería oculta campos que no aplican
    hideFields: ['music_type', 'opening_hours_extended'],
    fields: {
      // Servicios de entrega
      delivery: { type: 'toggle', label: 'Delivery disponible' },
      compra_en_tienda: { type: 'toggle', label: 'Compra en tienda' },
      recoge_en_local: { type: 'toggle', label: 'Recoge en local' },
      tiempo_estimado: {
        type: 'select',
        label: 'Tiempo estimado de entrega',
        options: ['Menos de 20 minutos', '20–40 minutos', 'Más de 40 minutos'],
      },
      // Productos disponibles
      productos: {
        type: 'multicheck',
        label: 'Productos disponibles',
        options: ['Cervezas', 'Whisky', 'Ron', 'Vodka', 'Vino', 'Tequila', 'Energizantes', 'Hielo', 'Snacks'],
      },
      // Métodos de pago
      metodos_pago: {
        type: 'multicheck',
        label: 'Métodos de pago',
        options: ['Efectivo', 'Tarjeta', 'Transferencia', 'Contra entrega'],
      },
      // Promociones
      combos: { type: 'toggle', label: 'Combos disponibles' },
      descripcion_combos: { type: 'textarea', label: 'Descripción de combos', placeholder: 'Ej: Pack de 6 cervezas + hielo a $12' },
      descuentos: { type: 'toggle', label: 'Descuentos especiales' },
    },
  },
};

// ─── Helpers ─────────────────────────────────────────────────────────────────

/**
 * Dado un nombre de tipo de venue_types (ej: "Bar", "Discoteca"),
 * retorna la key del config (ej: "bar", "discoteca").
 * Útil para mapear desde Supabase al config.
 */
export function getVenueTypeKey(venueTypeName) {
  if (!venueTypeName) return null;
  const normalized = venueTypeName.toLowerCase().trim()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, ''); // quita tildes
  return Object.keys(VENUE_TYPE_CONFIG).find(key => 
    key === normalized || 
    VENUE_TYPE_CONFIG[key].label.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '') === normalized
  ) || null;
}

/**
 * Retorna el config de un tipo de venue dado su nombre.
 */
export function getVenueConfig(venueTypeName) {
  const key = getVenueTypeKey(venueTypeName);
  return key ? VENUE_TYPE_CONFIG[key] : null;
}

/**
 * Retorna los campos de un tipo específico.
 */
export function getVenueFields(venueTypeName) {
  const config = getVenueConfig(venueTypeName);
  return config?.fields || {};
}

/**
 * Genera un objeto vacío con todos los campos de un tipo,
 * útil para inicializar el estado del formulario.
 */
export function getEmptyVenueDetails(venueTypeName) {
  const fields = getVenueFields(venueTypeName);
  const empty = {};
  Object.entries(fields).forEach(([key, field]) => {
    if (field.type === 'toggle') empty[key] = false;
    else if (field.type === 'multicheck') empty[key] = [];
    else if (field.type === 'number') empty[key] = '';
    else empty[key] = '';
  });
  return empty;
}
