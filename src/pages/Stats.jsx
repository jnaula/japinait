import React from 'react';
import { motion } from 'framer-motion';
import { BarChart, Users, TrendingUp, DollarSign } from 'lucide-react';

export default function Stats() {
  return (
    <div className="min-h-screen bg-[#0a0a0a] py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-white mb-2">Estadísticas</h1>
          <p className="text-gray-400">Analiza el rendimiento de tus locales y eventos</p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            icon={<Users className="w-6 h-6 text-[#ff0080]" />}
            title="Visitas Totales"
            value="1,234"
            trend="+12%"
            trendUp={true}
          />
          <StatCard
            icon={<TrendingUp className="w-6 h-6 text-[#7928ca]" />}
            title="Interacciones"
            value="456"
            trend="+5%"
            trendUp={true}
          />
          <StatCard
            icon={<BarChart className="w-6 h-6 text-blue-500" />}
            title="Eventos Activos"
            value="3"
            trend="Igual"
            trendUp={true}
          />
          <StatCard
            icon={<DollarSign className="w-6 h-6 text-green-500" />}
            title="Ingresos Estimados"
            value="$0.00"
            trend="N/A"
            trendUp={true}
          />
        </div>

        <div className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-8 text-center">
          <BarChart className="w-16 h-16 text-gray-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">Gráficos Detallados</h3>
          <p className="text-gray-400">Próximamente podrás ver gráficos detallados del rendimiento de tu negocio.</p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon, title, value, trend, trendUp }) {
  return (
    <motion.div
      whileHover={{ y: -5 }}
      className="bg-[#0f0f0f] border border-[#1a1a1a] rounded-xl p-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="p-3 bg-[#1a1a1a] rounded-lg border border-[#2a2a2a]">
          {icon}
        </div>
        <span className={`text-sm font-medium ${trendUp ? 'text-green-500' : 'text-red-500'}`}>
          {trend}
        </span>
      </div>
      <h3 className="text-gray-400 text-sm font-medium mb-1">{title}</h3>
      <p className="text-2xl font-bold text-white">{value}</p>
    </motion.div>
  );
}
