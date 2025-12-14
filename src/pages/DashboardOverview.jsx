import { Truck, AlertTriangle, Package, Clock, Wrench, CheckCircle, ChevronRight } from 'lucide-react';
import { WARNING_THRESHOLD } from '../lib/constants';

const DashboardOverview = ({ machines, supplies, maintenanceHistory, usageHistory }) => {

  const totalMachines = machines.length;
  const machinesInUse = machines.filter(m => m.is_in_use).length;
  const lowStockItems = supplies.filter(s => s.stock < 10);
  const criticalAlerts = machines.filter(m => m.current_hm >= m.next_pm_due_hm).length;
  const warningAlerts = machines.filter(
    m =>
      m.current_hm >= m.next_pm_due_hm - WARNING_THRESHOLD &&
      m.current_hm < m.next_pm_due_hm
  ).length;

  const StatCard = ({ title, value, subtext, icon: Icon, color, bgColor }) => (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex items-start justify-between hover:shadow-md transition duration-300">
      <div>
        <p className="text-gray-500 text-xs font-bold uppercase tracking-wider mb-1">{title}</p>
        <h3 className={`text-3xl font-extrabold ${color}`}>{value}</h3>
        {subtext && <p className="text-xs text-gray-400 mt-2 font-medium">{subtext}</p>}
      </div>

      <div className={`p-3 rounded-xl ${bgColor}`}>
        <Icon className={`w-6 h-6 ${color}`} />
      </div>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in pb-24 md:pb-0">

      {/* ---- CARDS PRINCIPALES ---- */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">

        <StatCard
          title="Flota Total"
          value={totalMachines}
          subtext={`${machinesInUse} en operación`}
          icon={Truck}
          color="text-blue-600"
          bgColor="bg-blue-50"
        />

        <StatCard
          title="Alertas Mantenimiento"
          value={criticalAlerts + warningAlerts}
          subtext={`${criticalAlerts} Vencidos, ${warningAlerts} Próximos`}
          icon={AlertTriangle}
          color={
            criticalAlerts > 0
              ? "text-red-600"
              : warningAlerts > 0
              ? "text-yellow-600"
              : "text-green-600"
          }
          bgColor={
            criticalAlerts > 0
              ? "bg-red-50"
              : warningAlerts > 0
              ? "bg-yellow-50"
              : "bg-green-50"
          }
        />

        <StatCard
          title="Inventario Bajo"
          value={lowStockItems.length}
          subtext="Items por agotar"
          icon={Package}
          color={lowStockItems.length > 0 ? "text-orange-600" : "text-gray-600"}
          bgColor="bg-orange-50"
        />

        <StatCard
          title="Horas Operadas"
          value={usageHistory.reduce((acc, curr) => acc + (curr.hoursAdded || 0), 0)}
          subtext="Total histórico"
          icon={Clock}
          color="text-indigo-600"
          bgColor="bg-indigo-50"
        />

      </div>

      {/* ---- MANTENIMIENTOS ---- */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Mantenimientos recientes */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Wrench className="w-5 h-5 mr-2 text-indigo-500" />  
            Mantenimientos Recientes
          </h3>

          <div className="space-y-3">
            {maintenanceHistory.slice(0, 5).map(m => (
              <div
                key={m.id}
                className="flex justify-between items-center p-3 bg-gray-50 rounded-xl hover:bg-gray-100 transition"
              >
                <div>
                  <p className="font-bold text-sm text-gray-800">{m.machineName}</p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {m.type} •{" "}
                    {new Date(m.timestamp?.seconds * 1000).toLocaleDateString()}
                  </p>
                </div>

                <span className="text-xs font-mono bg-white border border-gray-200 px-2 py-1 rounded-md text-gray-600">
                  {m.hm_done_at} h
                </span>
              </div>
            ))}

            {maintenanceHistory.length === 0 && (
              <p className="text-gray-400 text-sm text-center py-8 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                No hay actividad reciente.
              </p>
            )}
          </div>
        </div>

        {/* Alertas de stock */}
        <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
          <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center">
            <Package className="w-5 h-5 mr-2 text-orange-500" />
            Alertas de Stock
          </h3>

          <div className="space-y-3">
            {lowStockItems.length > 0 ? (
              lowStockItems.map(s => (
                <div
                  key={s.id}
                  className="flex justify-between items-center p-3 bg-orange-50 rounded-xl border border-orange-100"
                >
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-red-500 rounded-full mr-3 animate-pulse"></div>

                    <div>
                      <p className="font-bold text-sm text-gray-800">{s.name}</p>
                      <p className="text-xs text-red-600 font-semibold mt-0.5">
                        Quedan: {s.stock} {s.unit}
                      </p>
                    </div>
                  </div>

                  <button className="text-orange-600 bg-white p-1.5 rounded-lg shadow-sm border border-orange-100">
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center h-40 text-green-600 bg-green-50 rounded-xl border border-dashed border-green-200">
                <CheckCircle className="w-10 h-10 text-green-500/30" />
                <p className="font-bold mt-2">Sin alertas de stock</p>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default DashboardOverview;
