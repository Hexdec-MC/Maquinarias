import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Plus, Trash2, Edit2, ImageIcon, Upload, Droplets } from 'lucide-react';

import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/Modal';
import FuelGauge from '../components/FuelGauge';
import { getRecommendedSequenceIndex, getCollectionRef } from '../lib/utils';
import { MACHINE_ICONS, PM_SEQUENCE, WARNING_THRESHOLD } from '../lib/constants';

const MachineManagementSection = ({ userId, machines, showMessage, userRole }) => {
   const [modalOpen, setModalOpen] = useState(false);
   const [refuelModalOpen, setRefuelModalOpen] = useState(false);
   const [editingMachine, setEditingMachine] = useState(null);
   const [selectedMachineForRefuel, setSelectedMachineForRefuel] = useState(null);
   const [refuelLevel, setRefuelLevel] = useState(0);
   const [formData, setFormData] = useState({ name: '', model: '', plate: '', current_hm: '', next_pm_sequence_index: 0, fuel_level: 100, image_type: 'preset', image_src: 'excavator' });
   const [confirmDeleteId, setConfirmDeleteId] = useState(null);

   // Permission updates: Split edit and create permissions
   const canEdit = userRole === 'Administrador';
   const canCreate = userRole === 'Administrador' || userRole === 'Instructor'; // Instructors can now create
   const canRefuel = userRole === 'Administrador' || userRole === 'Instructor';

   const openModal = (machine = null) => { setEditingMachine(machine); if (machine) { const seqIdx = machine.next_pm_sequence_index !== undefined ? machine.next_pm_sequence_index : getRecommendedSequenceIndex(machine.current_hm); setFormData({ name: machine.name, model: machine.model, plate: machine.plate || '', current_hm: machine.current_hm, next_pm_sequence_index: seqIdx, fuel_level: machine.fuel_level || 100, image_type: machine.image_type || 'preset', image_src: machine.image_src || 'excavator' });
   } else { setFormData({ name: '', model: '', plate: '', current_hm: '', next_pm_sequence_index: 0, fuel_level: 100, image_type: 'preset', image_src: 'excavator' });
   } setModalOpen(true); };
   const openRefuelModal = (machine) => { setSelectedMachineForRefuel(machine); setRefuelLevel(machine.fuel_level || 0); setRefuelModalOpen(true); };
   const handleRefuel = async (e) => { e.preventDefault(); if (!selectedMachineForRefuel) return; const newLevel = parseInt(refuelLevel);
   if (newLevel <= selectedMachineForRefuel.fuel_level) { return showMessage('El porcentaje de combustible debe ser mayor al actual para repostar.', 'error');
   } try { const ref = getCollectionRef('machines', userId); await updateDoc(doc(ref, selectedMachineForRefuel.id), { fuel_level: newLevel }); showMessage('Repostaje registrado con éxito', 'success');
   setRefuelModalOpen(false); } catch(e) { showMessage('Error al registrar repostaje', 'error'); } };
   const handleHmChange = (val) => { 
       const hm = parseInt(val) || 0;
       // Si es una nueva máquina (no edición), actualizamos el PM recomendado dinámicamente
       if (!editingMachine) { 
           const recommendedIndex = getRecommendedSequenceIndex(hm);
           setFormData(prev => ({ ...prev, current_hm: val, next_pm_sequence_index: recommendedIndex })); 
       } else { 
           setFormData(prev => ({ ...prev, current_hm: val }));
       } 
   };
   const handleFileUpload = (e) => { const file = e.target.files[0];
   if (file) { if (file.size > 500000) { showMessage('La imagen es muy grande. Máx 500KB.', 'error'); return;
   } const reader = new FileReader(); reader.onloadend = () => { setFormData(prev => ({ ...prev, image_type: 'url', image_src: reader.result }));
   }; reader.readAsDataURL(file); } };
   const handleSave = async (e) => { e.preventDefault(); const ref = getCollectionRef('machines', userId);
   const hmInt = parseInt(formData.current_hm); const cycleIdx = parseInt(formData.next_pm_sequence_index); const fuelInt = parseInt(formData.fuel_level);
   if (isNaN(hmInt) || hmInt < 0) return showMessage('Horómetro inválido', 'error'); try { const nextPmType = PM_SEQUENCE[cycleIdx];
   const nextPmDueHm = hmInt + 250; const machineData = { name: formData.name, model: formData.model, plate: formData.plate, current_hm: hmInt, fuel_level: fuelInt, next_pm_sequence_index: cycleIdx, next_pm_type: nextPmType, next_pm_due_hm: nextPmDueHm, image_type: formData.image_type, image_src: formData.image_src };
   if (editingMachine) { await updateDoc(doc(ref, editingMachine.id), machineData); showMessage('Equipo actualizado', 'success');
   } else { await addDoc(ref, { ...machineData, is_in_use: false, series: 'S/N ' + Date.now().toString().slice(-6), last_pm_type: 'Nuevo', last_pm_hm: 0 });
   showMessage('Equipo registrado', 'success'); } setModalOpen(false); } catch (error) { showMessage('Error al guardar', 'error'); } };
   const confirmDelete = async () => { if (!confirmDeleteId) return; try { await deleteDoc(doc(getCollectionRef('machines', userId), confirmDeleteId)); showMessage('Equipo eliminado correctamente', 'success');
   } catch (error) { showMessage('Error al eliminar el equipo', 'error'); } finally { setConfirmDeleteId(null); } };
   return (
       <div className="space-y-6 pb-24 md:pb-0">
           <ConfirmationModal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={confirmDelete} title="Eliminar Equipo" message="¿Estás seguro de que quieres eliminar este equipo? Esta acción no se puede deshacer." />
           <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 z-10 md:static">
               <h3 className="text-lg font-bold text-gray-800">Inventario de Equipos</h3>
               {canCreate && (
                   <button onClick={() => openModal()} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center text-sm font-bold hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-200">
                       <Plus className="w-5 h-5 mr-2" /> Nuevo
                   </button>
               )}
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{machines.map(m => { const isDue = m.current_hm >= m.next_pm_due_hm;
           const isClose = m.current_hm >= m.next_pm_due_hm - WARNING_THRESHOLD && m.current_hm < m.next_pm_due_hm; const ImgComp = m.image_type === 'preset' ? (MACHINE_ICONS.find(i => i.id === m.image_src)?.icon || Truck) : Truck; return (<div key={m.id} className={`bg-white p-5 rounded-2xl shadow-sm border-t-4 ${isDue ? 'border-red-500' : isClose ? 'border-yellow-500' : 'border-green-500'} hover:shadow-md transition relative overflow-hidden`}><div className="flex gap-4 mb-4"><div className="w-16 h-16 flex-shrink-0 bg-gray-100 rounded-xl flex items-center justify-center border border-gray-200 overflow-hidden">{m.image_type === 'url' ? (<img src={m.image_src} alt={m.name} className="w-full h-full object-cover" onError={(e) => e.target.src='https://placehold.co/64?text=EQ'} />) : (<ImgComp className="w-8 h-8 text-indigo-500" />)}</div><div className="flex-1"><div className="flex justify-between items-start"><h4 className="font-bold text-gray-800 text-lg leading-tight line-clamp-1">{m.name}</h4>{m.is_in_use ? <span className="bg-orange-100 text-orange-700 text-[10px] font-bold px-2 py-1 rounded-lg animate-pulse border border-orange-200 whitespace-nowrap">EN USO</span> : <span className="bg-green-100 text-green-700 text-[10px] font-bold px-2 py-1 rounded-lg border border-green-200 whitespace-nowrap">DISP.</span>}</div><p className="text-xs text-gray-500 mt-1">{m.model} • <span className="font-mono bg-gray-100 px-1 rounded text-indigo-900 font-bold">{m.plate || 'S/P'}</span></p></div></div><div className="bg-gray-50 p-3 rounded-xl mb-3 flex justify-between items-center border border-gray-100"><span className="text-xs font-bold text-gray-500 uppercase">Horómetro</span><span className="font-mono text-lg font-bold text-indigo-600 tracking-tight">{m.current_hm} h</span></div><div className="mb-4 px-1 flex items-end gap-2"><div className="flex-1"><FuelGauge percentage={m.fuel_level || 0} /></div>{canRefuel && <button onClick={() => openRefuelModal(m)} className="bg-green-50 text-green-700 p-2 rounded-xl text-xs font-bold hover:bg-green-100 transition active:scale-95 border border-green-100 whitespace-nowrap">Repostar</button>}</div><div className="grid grid-cols-2 gap-2">{canEdit && <button onClick={() => openModal(m)} className="w-full bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition active:scale-95 flex items-center justify-center"><Edit2 className="w-3.5 h-3.5 mr-1.5"/> Editar</button>}{canEdit && <button onClick={() => setConfirmDeleteId(m.id)} className="w-full bg-red-50 text-red-600 py-2.5 rounded-xl text-xs font-bold hover:bg-red-100 transition active:scale-95 flex items-center justify-center"><Trash2 className="w-3.5 h-3.5 mr-1.5"/> Eliminar</button>}</div></div>)})}</div>
           <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingMachine ? "Editar Equipo" : "Nuevo Equipo"}><form onSubmit={handleSave} className="space-y-5"><div className="bg-gray-50 p-3 rounded-xl border border-gray-200"><label className="block text-sm font-bold mb-2 text-gray-700">Imagen / Logotipo</label><div className="flex gap-2 mb-3"><button type="button" onClick={() => setFormData({...formData, image_type: 'preset'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${formData.image_type === 'preset' ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>Icono</button><button type="button" onClick={() => setFormData({...formData, image_type: 'url'})} className={`flex-1 py-2 rounded-lg text-xs font-bold border transition ${formData.image_type === 'url' ? 'bg-white border-indigo-500 text-indigo-700 shadow-sm' : 'border-transparent text-gray-500 hover:bg-gray-100'}`}>Foto / URL</button></div>{formData.image_type === 'preset' ? (<div className="grid grid-cols-4 gap-2">{MACHINE_ICONS.map(icon => (<button type="button" key={icon.id} onClick={() => setFormData({...formData, image_src: icon.id})} className={`p-2 rounded-xl border flex flex-col items-center justify-center transition ${formData.image_src === icon.id ? 'border-indigo-500 bg-white shadow-sm' : 'border-transparent hover:bg-gray-200'}`}><icon.icon className={`w-6 h-6 mb-1 ${formData.image_src === icon.id ? 'text-indigo-600' : 'text-gray-400'}`}/><span className="text-[10px] font-medium text-gray-600">{icon.label}</span></button>))}</div>) : (<div className="space-y-3"><div className="relative"><ImageIcon className="absolute left-3 top-3 w-5 h-5 text-gray-400"/><input type="text" value={formData.image_src.startsWith('data:') ? '(Imagen subida)' : formData.image_src} onChange={e => setFormData({...formData, image_src: e.target.value})} className="w-full pl-10 p-3 border border-gray-200 rounded-xl text-sm" placeholder="https://..." /></div><label className="w-full flex items-center justify-center px-4 py-3 bg-white border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 text-sm font-bold text-gray-500 transition"><Upload className="w-4 h-4 mr-2"/>Subir Archivo<input type="file" className="hidden" onChange={handleFileUpload} /></label></div>)}</div><div><label className="block text-sm font-bold mb-1.5 text-gray-700">Nombre del Equipo</label><input required type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base" /></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold mb-1.5 text-gray-700">Modelo</label><input required type="text" value={formData.model} onChange={e => setFormData({...formData, model: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base" /></div><div><label className="block text-sm font-bold mb-1.5 text-gray-700">Placa</label><input type="text" value={formData.plate} onChange={e => setFormData({...formData, plate: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base" /></div></div><div className="grid grid-cols-2 gap-4"><div><label className="block text-sm font-bold mb-1.5 text-gray-700">Horómetro Actual</label><input required type="number" value={formData.current_hm} onChange={e => handleHmChange(e.target.value)} className="w-full border border-gray-200 p-3 rounded-xl text-base" /></div><div><label className="block text-sm font-bold mb-1.5 text-gray-700">Combustible (%)</label><input required type="number" min="0" max="100" value={formData.fuel_level} onChange={e => setFormData({...formData, fuel_level: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base" /></div></div><div className="pt-4 flex justify-end"><button type="submit" className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition active:scale-95">Guardar</button></div></form></Modal>
           
           {/* Modal Repostar - Restaurado */}
           <Modal isOpen={refuelModalOpen} onClose={() => setRefuelModalOpen(false)} title="Repostar Combustible">
               <form onSubmit={handleRefuel} className="space-y-5">
                   <div className="text-center mb-4">
                       <p className="text-sm text-gray-500">Equipo</p>
                       <h3 className="text-xl font-bold text-gray-800">{selectedMachineForRefuel?.name}</h3>
                       <p className="text-sm font-bold text-indigo-600 mt-1">Nivel Actual: {selectedMachineForRefuel?.fuel_level}%</p>
                   </div>
                   <div>
                       <label className="block text-sm font-bold mb-1.5 text-gray-700 text-center">Nuevo Nivel de Combustible</label>
                       <div className="flex items-center justify-center gap-4 mb-2">
                           <span className="text-3xl font-bold text-indigo-600">{refuelLevel}%</span>
                       </div>
                       <input type="range" min="0" max="100" value={refuelLevel} onChange={e => setRefuelLevel(e.target.value)} className="w-full h-4 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                       <div className="flex justify-between text-xs text-gray-400 mt-1 px-1"><span>0%</span><span>100%</span></div>
                   </div>
                   <div className="pt-4 flex justify-end">
                       <button type="submit" className="w-full bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition active:scale-95 flex items-center justify-center">
                           <Droplets className="w-5 h-5 mr-2"/> Confirmar Repostaje
                       </button>
                   </div>
               </form>
           </Modal>
       </div>
   );
};

export default MachineManagementSection;