import React, { useState } from 'react';
import { doc, updateDoc, writeBatch } from 'firebase/firestore';
import { Clock, Play, StopCircle, AlertOctagon, History, Loader2 } from 'lucide-react';

import Modal from '../components/Modal';
import FuelGauge from '../components/FuelGauge';
import { getCollectionRef, formatDuration } from '../lib/utils';
import { BLOCK_THRESHOLD } from '../lib/constants';
import { db } from '../firebaseConfig';

const MachineUsageSection = ({ userId, userName, machines, currentJob, setCurrentJob, showMessage, history, userRole }) => {
   const [search, setSearch] = useState('');
   const [endHm, setEndHm] = useState('');
   const [endFuel, setEndFuel] = useState('');
   const [modalOpen, setModalOpen] = useState(false);
   const [isStartingJob, setIsStartingJob] = useState(null);
   const canOperate = userRole === 'Administrador' || userRole === 'Instructor';

   const startJob = async (machine) => {
       if (!canOperate) return showMessage('No tienes permisos para operar', 'error');
       if(currentJob) return showMessage('Ya tienes un trabajo activo', 'error');

       if (machine.current_hm > machine.next_pm_due_hm + BLOCK_THRESHOLD) {
           return showMessage(`Bloqueado: PM Vencido hace más de ${BLOCK_THRESHOLD}h. Realice mantenimiento.`, 'error');
       }

       setIsStartingJob(machine.id);
       try {
           const jobData = { machineId: machine.id, machineName: machine.name, startHm: machine.current_hm, startTime: Date.now(), operator: userName, startFuel: machine.fuel_level || 100 };
           await updateDoc(doc(getCollectionRef('machines', userId), machine.id), { is_in_use: true });
           setCurrentJob(jobData);
           showMessage(`Operando ${machine.name}`, 'success');
       } catch(e) {
           showMessage('Error al iniciar', 'error');
       } finally {
           setIsStartingJob(null);
       }
   };
   const endJob = async (e) => {
       e.preventDefault();
       const endHmInt = parseInt(endHm);
       const endFuelInt = parseInt(endFuel);

       if(endHmInt < currentJob.startHm) return showMessage('HM Final inválido', 'error');
       if(isNaN(endFuelInt) || endFuelInt < 0 || endFuelInt > 100) return showMessage('Nivel de combustible inválido', 'error');
       if (endFuelInt < currentJob.startFuel - 50) {
           if(!window.confirm("El consumo de combustible parece alto (>50% en un turno). ¿Confirmar?")) return;
       }

       try {
           const durationMs = Date.now() - currentJob.startTime;
           const durationMin = Math.round(durationMs / 60000); const hoursAdded = endHmInt - currentJob.startHm;
           const batch = writeBatch(db);
           batch.update(doc(getCollectionRef('machines', userId), currentJob.machineId), { is_in_use: false, current_hm: endHmInt, fuel_level: endFuelInt });
           batch.set(doc(getCollectionRef('usage_history', userId)), { 
               ...currentJob, 
               endTime: Date.now(), 
               endHm: endHmInt, 
               endFuel: endFuelInt,
               durationMinutes: durationMin, 
               hoursAdded, 
               realDurationText: formatDuration(durationMs) 
           });
           await batch.commit(); setCurrentJob(null); setModalOpen(false); setEndHm(''); setEndFuel(''); showMessage('Trabajo finalizado', 'success');
       } catch(e) { showMessage('Error al finalizar', 'error');
       }
   };

   return (
       <div className="space-y-6 pb-24 md:pb-0">
           {currentJob && (
               <div className="bg-gradient-to-r from-orange-500 to-orange-600 text-white p-6 rounded-2xl shadow-lg shadow-orange-200 flex flex-col md:flex-row justify-between items-center animate-pulse border-2 border-white/20">
                   <div className="mb-4 md:mb-0 text-center md:text-left">
                       <h2 className="text-xl md:text-2xl font-bold flex items-center justify-center md:justify-start"><Clock className="w-8 h-8 mr-3" /> Operando: {currentJob.machineName}</h2>
                       <p className="opacity-90 mt-1 text-sm">Inicio: {new Date(currentJob.startTime).toLocaleTimeString()} • HM: {currentJob.startHm} h • Combustible: {currentJob.startFuel}%</p>
                   </div>
                   {canOperate && (
                       <button onClick={() => { setEndFuel(currentJob.startFuel); setModalOpen(true); }} className="bg-white text-orange-700 px-6 py-3 rounded-xl font-bold hover:bg-gray-50 shadow-lg transition flex items-center active:scale-95">
                           <StopCircle className="w-5 h-5 mr-2" /> Finalizar Turno
                       </button>
                   )}
               </div>
           )}
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{machines.filter(m => !m.is_in_use && m.name.toLowerCase().includes(search.toLowerCase())).map(m => {
               const isBlocked = m.current_hm > m.next_pm_due_hm + BLOCK_THRESHOLD;
               const isLoading = isStartingJob === m.id;
               return (
                   <div key={m.id} className={`bg-white p-5 rounded-2xl shadow-sm hover:shadow-md transition border-l-4 ${isBlocked ? 'border-gray-400 bg-gray-50' : 'border-green-500'} flex flex-col justify-between min-h-[160px]`}>
                       <div className="flex justify-between items-start">
                           <div>
                               <h4 className="font-bold text-lg text-gray-800 leading-tight">{m.name}</h4>
                               <p className="text-gray-500 text-sm mt-1">{m.model}</p>
                           </div>
                           <div className="bg-gray-50 p-2 rounded-lg font-mono text-sm font-bold text-indigo-600">{m.current_hm} h</div>
                       </div>
                       <div className="mb-2"><FuelGauge percentage={m.fuel_level || 0} /></div>
                       
                       {isBlocked ? (
                            <div className="mt-4 w-full py-3 rounded-xl font-bold flex justify-center items-center bg-red-50 text-red-500 border border-red-100 text-xs uppercase">
                               <AlertOctagon className="w-4 h-4 mr-2" /> Bloqueado: PM Vencido
                           </div>
                       ) : (
                           canOperate ? (
                               <button onClick={() => startJob(m)} disabled={!!currentJob || isLoading || isStartingJob} className={`mt-4 w-full py-3 rounded-xl font-bold flex justify-center items-center transition active:scale-95 ${currentJob || isStartingJob ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200'}`}>
                                   {isLoading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Play className="w-4 h-4 mr-2" />}
                                   {isLoading ? 'Iniciando...' : 'Iniciar Operación'}
                               </button>
                           ) : (
                               <div className="mt-4 w-full py-3 rounded-xl font-bold flex justify-center items-center bg-gray-50 text-gray-400 border border-dashed border-gray-200 text-xs italic">Modo Espectador</div>
                           )
                       )}
                   </div>
               )
           })}</div>
           <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 mt-8"><div className="p-4 border-b flex justify-between items-center bg-gray-50"><h3 className="font-bold text-gray-700 flex items-center"><History className="w-5 h-5 mr-2 text-indigo-500"/> Historial de Operaciones</h3></div><div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left text-gray-600"><thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold"><tr><th className="px-6 py-3">Fecha</th><th className="px-6 py-3">Equipo</th><th className="px-6 py-3">Operador</th><th className="px-6 py-3 text-center">Tiempo Real</th><th className="px-6 py-3 text-center">HM (+Horas)</th><th className="px-6 py-3 text-center">Combustible</th></tr></thead><tbody>{history.map(h => (<tr key={h.id} className="border-b hover:bg-gray-50"><td className="px-6 py-3">{h.endTime ? new Date(h.endTime).toLocaleDateString() : '-'}</td><td className="px-6 py-3 font-medium text-gray-900">{h.machineName}</td><td className="px-6 py-3">{h.operator || 'Desconocido'}</td><td className="px-6 py-3 text-center text-blue-600 font-medium">{h.realDurationText || `${h.durationMinutes} min`}</td><td className="px-6 py-3 text-center font-mono font-bold text-gray-800">+{h.hoursAdded} h</td><td className="px-6 py-3 text-center text-xs font-mono">{h.startFuel}% <span className="text-gray-400">→</span> {h.endFuel}%</td></tr>))}{history.length === 0 && <tr><td colSpan="6" className="text-center py-8 text-gray-400">Sin registros</td></tr>}</tbody></table></div><div className="md:hidden">{history.slice(0, 10).map(h => (<div key={h.id} className="p-5 border-b border-gray-100 last:border-0 active:bg-gray-50"><div className="flex justify-between mb-2"><span className="font-bold text-gray-800 text-sm">{h.machineName}</span><span className="text-xs text-gray-500">{h.endTime ? new Date(h.endTime).toLocaleDateString() : '-'}</span></div><div className="text-xs text-gray-500 mb-2">Operador: {h.operator}</div><div className="grid grid-cols-3 gap-2 text-center"><div className="bg-gray-50 rounded-lg p-2"><div className="text-[10px] text-gray-500">Duración</div><div className="font-bold text-xs text-blue-600">{h.realDurationText || `${h.durationMinutes} min`}</div></div><div className="bg-gray-50 rounded-lg p-2"><div className="text-[10px] text-gray-500">Horas</div><div className="font-bold text-xs font-mono">+{h.hoursAdded} h</div></div><div className="bg-gray-50 rounded-lg p-2"><div className="text-[10px] text-gray-500">Consumo</div><div className="font-bold text-xs font-mono">{h.startFuel-h.endFuel}%</div></div></div></div>))}{history.length === 0 && <p className="p-8 text-center text-gray-400 text-sm">Sin registros</p>}</div></div>
           
           <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title="Finalizar Turno">
               <form onSubmit={endJob} className="space-y-6">
                   <div>
                       <label className="block font-bold mb-2 text-gray-700 text-center">Horómetro Final</label>
                       <div className="text-center text-xs text-gray-500 mb-2">Mínimo aceptado: {currentJob?.startHm} h</div>
                       <input type="number" required min={currentJob?.startHm} value={endHm} onChange={e => setEndHm(e.target.value)} className="w-full border border-gray-200 p-4 rounded-2xl text-3xl font-mono text-center focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition" autoFocus />
                   </div>
                   
                   <div>
                        <label className="block font-bold mb-2 text-gray-700 text-center">Nivel de Combustible Final</label>
                        <div className="flex items-center justify-center gap-4">
                           <span className="text-xl font-bold text-indigo-600">{endFuel}%</span>
                        </div>
                        <input type="range" min="0" max="100" value={endFuel} onChange={e => setEndFuel(e.target.value)} className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 mt-2"/>
                        <div className="flex justify-between text-xs text-gray-400 mt-1 px-1"><span>0%</span><span>Inicio: {currentJob?.startFuel}%</span><span>100%</span></div>
                   </div>

                   <button type="submit" className="w-full bg-red-600 text-white py-4 rounded-xl font-bold shadow-lg shadow-red-200 hover:bg-red-700 transition active:scale-95 text-lg">Confirmar Fin</button>
               </form>
           </Modal>
       </div>
   );
};

export default MachineUsageSection;