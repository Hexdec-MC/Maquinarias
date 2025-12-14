import React, { useState, useEffect, useMemo } from 'react';
import { Bell, X, AlertOctagon, AlertTriangle, CheckCircle } from 'lucide-react';
import { WARNING_THRESHOLD } from '../lib/constants';

const NotificationCenter = ({ machines = [], supplies = [] }) => {
   const [isOpen, setIsOpen] = useState(false);
   
   // Bloquear scroll body
   useEffect(() => {
       if (isOpen) document.body.style.overflow = 'hidden';
       else document.body.style.overflow = 'unset';
       return () => { document.body.style.overflow = 'unset'; }
   }, [isOpen]);

   const alerts = useMemo(() => {
       const list = [];
       if (machines && machines.length > 0) {
           machines.forEach(m => {
               const current = parseInt(m.current_hm || 0);
               const nextDue = parseInt(m.next_pm_due_hm || 0);
               if (current >= nextDue) {
                   list.push({ type: 'critical', message: `PM Vencido: ${m.name}`, sub: `${current}h / ${nextDue}h`, id: m.id });
               } else if (current >= nextDue - WARNING_THRESHOLD) {
                   list.push({ type: 'warning', message: `PM Próximo: ${m.name}`, sub: `Faltan ${nextDue - current}h`, id: m.id });
               }
           });
       }
       if (supplies && supplies.length > 0) {
           supplies.forEach(s => {
               const stock = parseInt(s.stock || 0);
               if (stock < 10) {
                   list.push({ type: 'warning', message: `Stock Bajo: ${s.name}`, sub: `Quedan ${stock} ${s.unit}`, id: s.id });
               }
           });
       }
       return list;
   }, [machines, supplies]);

   const hasCritical = alerts.some(a => a.type === 'critical');
   const hasWarning = alerts.some(a => a.type === 'warning');
   const hasAlerts = hasCritical || hasWarning;

   return (
       <>
           <button 
               onClick={() => setIsOpen(true)} 
               className={`relative p-2.5 rounded-full transition focus:outline-none active:scale-95 ${hasAlerts ? 'bg-white/10 text-white border border-white/20' : 'hover:bg-white/10 text-gray-300 hover:text-white'}`}
           >
               <Bell className={`w-6 h-6 ${hasCritical ? 'text-red-400' : hasWarning ? 'text-yellow-400' : 'text-current'}`} />
               {hasAlerts && (
                   <span className="absolute top-2 right-2 flex h-2.5 w-2.5">
                     <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${hasCritical ? 'bg-red-400' : 'bg-yellow-400'}`}></span>
                     <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${hasCritical ? 'bg-red-500' : 'bg-yellow-500'}`}></span>
                   </span>
               )}
           </button>

           {/* MODAL - BOTTOM SHEET */}
           {isOpen && (
               <div className="fixed inset-0 z-[110] flex items-end justify-center md:items-start md:justify-end">
                   {/* Backdrop Clickable */}
                   <div 
                       className="fixed inset-0 bg-gray-900/60 backdrop-blur-sm transition-opacity animate-fade-in" 
                       onClick={() => setIsOpen(false)}
                   ></div>
                   
                   {/* Panel */}
                   <div className="
                       relative w-full bg-white shadow-2xl z-[111] overflow-hidden flex flex-col
                       rounded-t-3xl h-[70vh] animate-slide-up-mobile
                       md:h-auto md:max-h-[600px] md:w-96 md:rounded-2xl md:m-4 md:animate-fade-in
                   ">
                       {/* Drag Handle para móvil visual */}
                       <div className="md:hidden flex justify-center pt-3 pb-1" onClick={() => setIsOpen(false)}>
                           <div className="w-12 h-1.5 bg-gray-300 rounded-full"></div>
                       </div>

                       {/* Header */}
                       <div className="p-4 border-b border-gray-100 flex justify-between items-center">
                           <div className="flex items-center gap-2">
                               <h3 className="font-bold text-gray-800 text-lg">Notificaciones</h3>
                               <span className="bg-indigo-100 text-indigo-700 px-2.5 py-0.5 rounded-full text-xs font-extrabold">{alerts.length}</span>
                           </div>
                           <button 
                               onClick={() => setIsOpen(false)} 
                               className="bg-gray-100 hover:bg-gray-200 text-gray-600 p-2 rounded-full transition active:scale-95"
                           >
                               <X className="w-6 h-6" />
                           </button>
                       </div>

                       {/* Content */}
                       <div 
                           className="overflow-y-auto px-4 pt-4 space-y-3 bg-gray-50/50 flex-1"
                           style={{ paddingBottom: 'calc(1rem + env(safe-area-inset-bottom))' }}
                       >
                           {alerts.length > 0 ? (
                               alerts.map((alert, idx) => (
                                   <div key={idx} className={`p-4 rounded-2xl border flex items-start gap-4 transition shadow-sm bg-white ${alert.type === 'critical' ? 'border-red-100' : 'border-yellow-100'}`}>
                                       <div className={`p-2.5 rounded-full shrink-0 ${alert.type === 'critical' ? 'bg-red-50 text-red-600' : 'bg-yellow-50 text-yellow-600'}`}>
                                           {alert.type === 'critical' ? <AlertOctagon className="w-6 h-6"/> : <AlertTriangle className="w-6 h-6"/>}
                                       </div>
                                       <div>
                                           <p className={`text-sm font-bold leading-snug ${alert.type === 'critical' ? 'text-red-700' : 'text-gray-800'}`}>{alert.message}</p>
                                           <p className="text-xs text-gray-500 mt-1 font-medium">{alert.sub}</p>
                                       </div>
                                   </div>
                               ))
                           ) : (
                               <div className="py-12 text-center text-gray-400 flex flex-col items-center justify-center h-full">
                                   <div className="bg-white p-6 rounded-full mb-4 shadow-sm border border-gray-100">
                                       <CheckCircle className="w-10 h-10 opacity-30 text-green-500"/>
                                   </div>
                                   <p className="font-bold text-gray-600 text-lg">Todo al día</p>
                                   <p className="text-sm text-gray-400">No hay alertas pendientes</p>
                               </div>
                           )}
                       </div>
                   </div>
               </div>
           )}
       </>
   );
};

export default NotificationCenter;