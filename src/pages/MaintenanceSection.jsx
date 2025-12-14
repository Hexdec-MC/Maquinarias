import React, { useState } from 'react';
import { doc, setDoc, writeBatch, serverTimestamp } from 'firebase/firestore';
import { Wrench, History, Settings, Plus, X, Camera, Lock, Save, FileText, AlertTriangle, CheckCircle, ClipboardList, AlertOctagon, Package } from 'lucide-react';

import Modal from '../components/Modal';
import MaintenanceReportTemplate from '../components/MaintenanceReportTemplate';
import { getCollectionRef, calculateNextPmStep, compressImage } from '../lib/utils';
import { WARNING_THRESHOLD, PM_TYPES } from '../lib/constants';
import { db } from '../firebaseConfig';

const MaintenanceSection = ({ userId, machines, supplies, history, pmConfigs, showMessage, userRole }) => {
   const [viewMode, setViewMode] = useState('register'); // register | history | kits
   const [modalOpen, setModalOpen] = useState(false);
   const [selectedMachine, setSelectedMachine] = useState(null);
   const [type, setType] = useState('Programado');
   const [formData, setFormData] = useState({ hm: '', fuel_level: 100, desc: '', usedSupplies: [], images: [] });
   const [tempSupplyId, setTempSupplyId] = useState('');
   const [tempQty, setTempQty] = useState(1);
   const [historyFilter, setHistoryFilter] = useState('Programado');
   const [reportData, setReportData] = useState(null);
   // Estado para Kits
   const [selectedPmType, setSelectedPmType] = useState('PM1');
   const [kitForm, setKitForm] = useState({ supplyId: '', qty: 1, isMandatory: true });
   const currentPmConfig = pmConfigs[selectedPmType] || [];
   // Permissions
   const canRegister = userRole === 'Administrador' || userRole === 'Instructor';
   const canManageKits = userRole === 'Administrador';

   // Funciones Kits
   const handleAddKitItem = async (e) => {
       e.preventDefault();
       if (!kitForm.supplyId) return showMessage('Selecciona un suministro', 'error');
       const supply = supplies.find(s => s.id === kitForm.supplyId);
       if (!supply) return;
       const newItem = { supplyId: supply.id, name: supply.name, qty: parseInt(kitForm.qty), isMandatory: kitForm.isMandatory };
       try {
           const configRef = doc(getCollectionRef('pm_configs', userId), selectedPmType);
           const updatedItems = [...currentPmConfig, newItem];
           await setDoc(configRef, { items: updatedItems }); 
           showMessage(`Item agregado al kit ${selectedPmType}`, 'success');
           setKitForm({ supplyId: '', qty: 1, isMandatory: true });
       } catch(error) { showMessage('Error al actualizar kit', 'error');
       }
   };

   const removeKitItem = async (indexToRemove) => {
       try {
           const configRef = doc(getCollectionRef('pm_configs', userId), selectedPmType);
           const updatedItems = currentPmConfig.filter((_, index) => index !== indexToRemove);
           await setDoc(configRef, { items: updatedItems });
           showMessage('Item removido del kit', 'success');
       } catch(error) { showMessage('Error al remover item', 'error'); }
   };

   const openModal = (machine, mType) => {
       setSelectedMachine(machine); setType(mType);
       let initialSupplies = [];
       let description = '';
       if (mType === 'Programado') {
           const pmType = machine.next_pm_type;
           description = pmType;
           const kitItems = pmConfigs[pmType] || [];
           initialSupplies = kitItems.map(kItem => {
               const supplyData = supplies.find(s => s.id === kItem.supplyId);
               return {
                   id: kItem.supplyId,
                   name: kItem.name,
                   qty: kItem.qty,
                   isMandatory: kItem.isMandatory,
                   stock: supplyData ? supplyData.stock : 0 
               };
           });
       }
       setFormData({ hm: machine.current_hm, fuel_level: machine.fuel_level || 100, desc: description, usedSupplies: initialSupplies, images: [] });
       setModalOpen(true);
   };

   const addSupplyToUsage = () => {
       if (!tempSupplyId) return;
       const supply = supplies.find(s => s.id === tempSupplyId);
       if (!supply) return;
       const exists = formData.usedSupplies.find(s => s.id === tempSupplyId);
       if(exists) return showMessage('Item ya en lista', 'error');
       if(tempQty > supply.stock) return showMessage(`Stock insuficiente (${supply.stock})`, 'error');
       setFormData(prev => ({ ...prev, usedSupplies: [...prev.usedSupplies, { id: supply.id, name: supply.name, qty: tempQty, isMandatory: false }] }));
       setTempSupplyId(''); setTempQty(1);
   };

   const handleImageUpload = async (e) => {
       const files = Array.from(e.target.files);
       if (files.length + formData.images.length > 3) {
           return showMessage('Máximo 3 imágenes permitidas', 'error');
       }

       const newImages = [];
       for (const file of files) {
           if (file.size > 2 * 1024 * 1024) { // Limite inicial de lectura 2MB
                showMessage(`Imagen ${file.name} muy pesada, se intentará comprimir`, 'warning');
           }
           try {
               const compressedDataUrl = await compressImage(file);
               newImages.push(compressedDataUrl);
           } catch (err) { 
               console.error("Error comprimiendo imagen", err);
               showMessage(`Error al procesar ${file.name}`, 'error');
           }
       }
       setFormData(prev => ({ ...prev, images: [...prev.images, ...newImages] }));
   };

   const handleRemoveImage = (index) => {
       setFormData(prev => ({ ...prev, images: prev.images.filter((_, i) => i !== index) }));
   };

   const handleSave = async (e) => {
       e.preventDefault();
       const hmDone = parseInt(formData.hm);
       const fuelInt = parseInt(formData.fuel_level);

       if (hmDone < selectedMachine.current_hm) return showMessage('Horómetro incorrecto', 'error');
       if (type === 'Programado') {
            const pmType = selectedMachine.next_pm_type;
            const kitItems = pmConfigs[pmType] || [];
            for (const kItem of kitItems) {
                if (kItem.isMandatory) {
                    const inList = formData.usedSupplies.find(u => u.id === kItem.supplyId);
                    if (!inList) return showMessage(`Falta suministro obligatorio: ${kItem.name}`, 'error');
                }
            }
       }

       for (const item of formData.usedSupplies) {
            const currentSupply = supplies.find(s => s.id === item.id);
            if (!currentSupply) return showMessage(`Item ${item.name} no encontrado en inventario`, 'error');
            if (currentSupply.stock < item.qty) return showMessage(`Stock insuficiente para ${item.name}. Stock: ${currentSupply.stock}`, 'error');
       }
       
       try {
           const batch = writeBatch(db);
           const machineRef = doc(getCollectionRef('machines', userId), selectedMachine.id);
           let updateData = { current_hm: hmDone, last_pm_hm: hmDone, fuel_level: fuelInt };
           if (type === 'Programado') {
               const currentSeqIdx = selectedMachine.next_pm_sequence_index || 0;
               const nextStep = calculateNextPmStep(hmDone, currentSeqIdx);
               updateData = { 
                   ...updateData, 
                   next_pm_type: nextStep.nextPmType, 
                   next_pm_due_hm: nextStep.nextPmDueHm, 
                   next_pm_sequence_index: nextStep.nextSequenceIndex, 
                   last_pm_type: selectedMachine.next_pm_type 
               };
           }
           
           batch.update(machineRef, updateData);
           const historyRef = doc(getCollectionRef('maintenance_history', userId));
           batch.set(historyRef, { 
               machineId: selectedMachine.id, 
               machineName: selectedMachine.name, 
               type, 
               description: formData.desc, 
               hm_done_at: hmDone, 
               fuel_level: fuelInt, 
               supplies_used: formData.usedSupplies,
               images: formData.images, // Guardamos las imágenes
               timestamp: serverTimestamp() 
           });
           formData.usedSupplies.forEach(item => {
               const supplyRef = doc(getCollectionRef('supplies', userId), item.id);
               const currentSupply = supplies.find(s => s.id === item.id);
               if(currentSupply) { 
                   const newStock = Math.max(0, currentSupply.stock - item.qty); 
                   batch.update(supplyRef, { stock: newStock }); 
               }
           });
           await batch.commit(); 
           showMessage('Mantenimiento registrado', 'success'); setModalOpen(false);
       } catch (error) { 
           console.error(error);
           if (error.code === 'invalid-argument') {
               showMessage('Error: Las imágenes son demasiado pesadas para guardar.', 'error');
           } else {
               showMessage('Error al registrar', 'error');
           }
       }
   };
   
   const filteredHistory = history.filter(h => {
       if (historyFilter === 'Programado') return h.type === 'Programado';
       if (historyFilter === 'Correctivo') return h.type === 'No Programado';
       return true;
   });
   
   return (
       <div className="space-y-6 pb-24 md:pb-0">
           {reportData && (<MaintenanceReportTemplate data={reportData} onClose={() => setReportData(null)} />)}
           
           {/* SUB-NAVIGATION TABS - CORREGIDO */}
           <div className="flex w-full md:w-fit space-x-1 md:space-x-2 bg-gray-100 p-1 rounded-xl mb-6">
               <button 
                   onClick={() => setViewMode('register')} 
                   className={`flex-1 justify-center px-2 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center ${viewMode === 'register' ? 
                   'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                   <Wrench className="w-4 h-4 mr-1.5 md:mr-2"/> Ejecución
               </button>
               
               <button 
                   onClick={() => setViewMode('history')} 
                   className={`flex-1 justify-center px-2 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center ${viewMode === 'history' ? 
                   'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                   <History className="w-4 h-4 mr-1.5 md:mr-2"/> Historial
               </button>
               
               <button 
                   onClick={() => setViewMode('kits')} 
                   className={`flex-1 justify-center px-2 md:px-5 py-2 rounded-lg text-xs md:text-sm font-bold transition flex items-center ${viewMode === 'kits' ? 
                   'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
               >
                   <Settings className="w-4 h-4 mr-1.5 md:mr-2"/> 
                   <span className="truncate">Config. Kits</span>
               </button>
           </div>

           {viewMode === 'register' && (
               <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
                   {machines.map(m => {
                       const isDue = m.current_hm >= m.next_pm_due_hm;
                       const isClose = m.current_hm >= m.next_pm_due_hm - WARNING_THRESHOLD && m.current_hm < m.next_pm_due_hm;
                       
                       // New logic: show button only if close or due
                       const showPmButton = isDue || isClose;

                       return (
                           <div key={m.id} className={`bg-white p-5 rounded-2xl shadow-sm border-t-4 ${isDue ? 'border-red-500' : isClose ? 'border-yellow-500' : 'border-green-500'} hover:shadow-md transition`}>
                               <div className="flex justify-between mb-3"><h4 className="font-bold text-gray-800 text-lg">{m.name}</h4>{isDue ? <AlertTriangle className="text-red-500 w-6 h-6 animate-pulse" /> : isClose ? <AlertTriangle className="text-yellow-500 w-6 h-6" /> : <CheckCircle className="text-green-500 w-6 h-6" />}</div>
                               <div className="bg-gray-50 p-3 rounded-xl mb-4 flex justify-between items-center"><span className="text-xs font-bold text-gray-500 uppercase">Horómetro</span><span className="font-mono text-lg font-bold text-indigo-600">{m.current_hm} h</span></div>
                               <div className="text-xs text-gray-500 mb-4 flex items-center"><span className={`w-2 h-2 rounded-full mr-2 ${isDue ? 'bg-red-500' : 'bg-green-500'}`}></span>Próximo: <strong className="ml-1">{m.next_pm_type}</strong> <span className="mx-1">|</span> {m.next_pm_due_hm} h</div>
                               <div className="flex gap-2">
                                   {canRegister ? (
                                       <>
                                           {showPmButton && (
                                               <button onClick={() => openModal(m, 'Programado')} className="flex-1 bg-indigo-50 text-indigo-700 py-2.5 rounded-xl text-xs font-bold hover:bg-indigo-100 transition active:scale-95 animate-pulse">PM Programado</button>
                                           )}
                                           <button onClick={() => openModal(m, 'No Programado')} className={`flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-xs font-bold hover:bg-gray-200 transition active:scale-95 ${!showPmButton ? 'w-full' : ''}`}>Correctivo</button>
                                       </>
                                   ) : (
                                       <div className="flex-1 text-center py-2.5 text-xs text-gray-400 italic bg-gray-50 rounded-xl border border-dashed border-gray-200">Solo lectura</div>
                                   )}
                               </div>
                           </div>
                       )
                   })}
               </div>
           )}

           {viewMode === 'history' && (
               <div className="bg-white rounded-2xl shadow-sm overflow-hidden border border-gray-100 animate-fade-in">
                   <div className="p-4 border-b flex flex-col md:flex-row justify-between items-center bg-gray-50 gap-4">
                       <div className="flex space-x-2 w-full md:w-auto bg-gray-200 p-1.5 rounded-xl">
                           <button onClick={() => setHistoryFilter('Programado')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${historyFilter === 'Programado' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><ClipboardList className="w-4 h-4 inline mr-1 mb-0.5" /> PM Programado</button>
                           <button onClick={() => setHistoryFilter('Correctivo')} className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${historyFilter === 'Correctivo' ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}><AlertOctagon className="w-4 h-4 inline mr-1 mb-0.5" /> Correctivo</button>
                       </div>
                   </div>
                   <div className="hidden md:block overflow-x-auto"><table className="w-full text-sm text-left text-gray-600"><thead className="bg-gray-50 text-xs uppercase text-gray-700 font-bold"><tr><th className="px-6 py-3">Fecha</th><th className="px-6 py-3">Equipo</th><th className="px-6 py-3">Tipo</th><th className="px-6 py-3">Descripción</th><th className="px-6 py-3 text-center">Acción</th></tr></thead><tbody>{filteredHistory.length > 0 ? filteredHistory.map(h => (<tr key={h.id} className="border-b hover:bg-gray-50"><td className="px-6 py-3 whitespace-nowrap">{h.timestamp ? new Date(h.timestamp.seconds * 1000).toLocaleDateString() : '-'}</td><td className="px-6 py-3 font-medium text-gray-900">{h.machineName}</td><td className="px-6 py-3"><span className={`px-2 py-1 rounded text-xs font-bold ${h.type === 'Programado' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{h.type}</span></td><td className="px-6 py-3 max-w-xs truncate">{h.description}</td><td className="px-6 py-3 text-center"><button onClick={() => setReportData(h)} className="text-indigo-600 hover:bg-indigo-50 p-2 rounded-lg active:scale-95 transition" title="Ver Informe PDF"><FileText className="w-5 h-5" /></button></td></tr>)) : (<tr><td colSpan="5" className="p-8 text-center text-gray-400">No se encontraron registros.</td></tr>)}</tbody></table></div>
                   <div className="md:hidden">{filteredHistory.length > 0 ? filteredHistory.slice(0, 10).map(h => (<div key={h.id} className="p-5 border-b border-gray-100 last:border-0 active:bg-gray-50 transition"><div className="flex justify-between mb-2"><span className="font-bold text-gray-800 text-sm">{h.machineName}</span><span className="text-xs text-gray-500">{h.timestamp ? new Date(h.timestamp.seconds * 1000).toLocaleDateString() : '-'}</span></div><div className="flex justify-between items-center mb-2"><span className={`text-[10px] uppercase px-2 py-1 rounded-md font-bold ${h.type === 'Programado' ? 'bg-blue-100 text-blue-800' : 'bg-orange-100 text-orange-800'}`}>{h.type}</span><span className="font-mono text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">{h.hm_done_at} h</span></div><div className="flex justify-between items-center"><p className="text-xs text-gray-500 line-clamp-1 flex-1 mr-4">{h.description}</p><button onClick={() => setReportData(h)} className="flex items-center text-xs bg-white border border-gray-200 text-indigo-600 px-3 py-1.5 rounded-lg font-bold shadow-sm active:scale-95 transition"><FileText className="w-3 h-3 mr-1.5"/> Informe</button></div></div>)) : <p className="p-8 text-center text-gray-400 text-sm">No hay registros.</p>}</div>
               </div>
           )}

           {viewMode === 'kits' && (
               <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-fade-in">
                   <div className="lg:col-span-2 space-y-6">
                       <div className="flex space-x-2 overflow-x-auto pb-2">
                           {PM_TYPES.map(pm => (
                               <button key={pm} onClick={() => setSelectedPmType(pm)} className={`px-5 py-3 rounded-xl font-bold text-sm transition whitespace-nowrap ${selectedPmType === pm ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'bg-white text-gray-500 hover:bg-gray-50 border border-gray-100'}`}>Kit {pm}</button>
                           ))}
                       </div>
                       <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                           <div className="p-4 border-b border-gray-100 bg-gray-50/50 flex justify-between items-center"><h3 className="font-bold text-gray-800">Items definidos para {selectedPmType}</h3><span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-lg font-bold">{currentPmConfig.length} items</span></div>
                           {currentPmConfig.length === 0 ? (<div className="p-8 text-center text-gray-400"><Package className="w-12 h-12 mx-auto mb-2 opacity-20"/><p>No hay items configurados.</p></div>) : (
                               <div className="divide-y divide-gray-100">{currentPmConfig.map((item, index) => (<div key={index} className="p-4 flex items-center justify-between hover:bg-gray-50 transition"><div className="flex items-center gap-3"><div className={`w-2 h-10 rounded-full ${item.isMandatory ? 'bg-red-500' : 'bg-blue-300'}`}></div><div><p className="font-bold text-gray-800">{item.name}</p><p className="text-xs text-gray-500">Cantidad: <span className="font-bold">{item.qty}</span><span className="mx-2">•</span>{item.isMandatory ? <span className="text-red-600 font-bold">Obligatorio</span> : <span className="text-blue-600">Opcional</span>}</p></div></div>{canManageKits && <button onClick={() => removeKitItem(index)} className="text-gray-400 hover:text-red-500 p-2 transition"><X className="w-5 h-5"/></button>}</div>))}</div>
                           )}
                       </div>
                   </div>
                   <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-fit">
                       <h3 className="font-bold text-lg text-gray-800 mb-4 flex items-center"><Plus className="w-5 h-5 mr-2 text-indigo-600"/> Agregar al Kit</h3>
                       {canManageKits ? (
                           <form onSubmit={handleAddKitItem} className="space-y-4">
                               <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Suministro</label><select className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition" value={kitForm.supplyId} onChange={(e) => setKitForm({...kitForm, supplyId: e.target.value})}><option value="">Seleccionar...</option>{supplies.map(s => (<option key={s.id} value={s.id}>{s.name} (Stock: {s.stock})</option>))}</select></div>
                               <div><label className="block text-sm font-bold text-gray-700 mb-1.5">Cantidad Requerida</label><input type="number" min="1" className="w-full p-3 border border-gray-200 rounded-xl bg-gray-50 focus:bg-white focus:ring-2 focus:ring-indigo-500 outline-none transition" value={kitForm.qty} onChange={(e) => setKitForm({...kitForm, qty: e.target.value})} /></div>
                               <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl border border-gray-100"><input type="checkbox" id="mandatory" className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500" checked={kitForm.isMandatory} onChange={(e) => setKitForm({...kitForm, isMandatory: e.target.checked})} /><label htmlFor="mandatory" className="text-sm font-medium text-gray-700 cursor-pointer select-none">Es Obligatorio</label></div>
                               <button type="submit" className="w-full bg-indigo-600 text-white font-bold py-3 rounded-xl hover:bg-indigo-700 transition shadow-lg shadow-indigo-100 active:scale-95">Agregar Item</button>
                           </form>
                       ) : (
                           <div className="p-4 bg-gray-50 rounded-xl border border-dashed border-gray-200 text-center text-sm text-gray-500">
                               <Lock className="w-8 h-8 mx-auto mb-2 text-gray-300"/>
                               Solo administradores pueden modificar los kits.
                           </div>
                       )}
                   </div>
               </div>
           )}

           <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={`Registrar ${type}`}>
               <form onSubmit={handleSave} className="space-y-5">
                   <div><label className="block text-sm font-bold mb-1.5 text-gray-700">HM Final (Min: {selectedMachine?.current_hm})</label><input type="number" required min={selectedMachine?.current_hm} value={formData.hm} onChange={e => setFormData({...formData, hm: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base font-mono focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" /></div>
                   
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                       <div className="flex justify-between mb-2">
                           <label className="text-sm font-bold text-gray-700">Nivel de Combustible</label>
                           <span className="font-bold text-indigo-600">{formData.fuel_level}%</span>
                       </div>
                       <input type="range" min="0" max="100" value={formData.fuel_level} onChange={e => setFormData({...formData, fuel_level: e.target.value})} className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-indigo-600"/>
                       <div className="flex justify-between text-xs text-gray-400 mt-1"><span>0%</span><span>50%</span><span>100%</span></div>
                   </div>

                   <div><label className="block text-sm font-bold mb-1.5 text-gray-700">Descripción</label><input type="text" required value={formData.desc} onChange={e => setFormData({...formData, desc: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" placeholder="Ej: Cambio de Aceite..." /></div>
                   
                   {/* IMAGENES EVIDENCIA */}
                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                       <label className="block text-sm font-bold mb-3 text-indigo-700">Evidencia (Máx 3)</label>
                       <div className="grid grid-cols-3 gap-2 mb-3">
                           {formData.images.map((img, idx) => (
                               <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-gray-300 group">
                                   <img src={img} alt="preview" className="w-full h-full object-cover" />
                                   <button type="button" onClick={() => handleRemoveImage(idx)} className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-80 hover:opacity-100">
                                       <X className="w-3 h-3" />
                                   </button>
                               </div>
                           ))}
                           {formData.images.length < 3 && (
                               <label className="flex flex-col items-center justify-center aspect-square border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-100 transition">
                                   <Camera className="w-6 h-6 text-gray-400" />
                                   <span className="text-[10px] text-gray-500 mt-1">Subir Foto</span>
                                   <input type="file" accept="image/*" multiple className="hidden" onChange={handleImageUpload} />
                               </label>
                           )}
                       </div>
                   </div>

                   <div className="bg-gray-50 p-4 rounded-xl border border-gray-200">
                       <label className="block text-sm font-bold mb-3 text-indigo-700">Suministros (Opcional)</label>
                       <div className="flex items-end gap-2 mb-3"> 
                           <div className="flex-1">
                               <select 
                                   className="w-full border border-gray-200 p-3 rounded-xl text-base bg-white focus:ring-2 focus:ring-indigo-500 outline-none h-12" 
                                   value={tempSupplyId} 
                                   onChange={e => setTempSupplyId(e.target.value)}
                               >
                                   <option value="">Seleccionar...</option>
                                   {supplies.filter(s => s.stock > 0).map(s => (<option key={s.id} value={s.id}>{s.name} (Disp: {s.stock})</option>))}
                               </select>
                           </div>
                           <div className="w-20">
                               <input 
                                   type="number" 
                                   min="1" 
                                   className="w-full border border-gray-200 p-3 rounded-xl text-base text-center bg-white focus:ring-2 focus:ring-indigo-500 outline-none h-12" 
                                   value={tempQty} 
                                   onChange={e => setTempQty(e.target.value)} 
                               />
                           </div>
                           <button 
                               type="button" 
                               onClick={addSupplyToUsage} 
                               className="bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 active:scale-95 transition flex items-center justify-center shadow-md h-12 w-12 flex-shrink-0"
                           >
                               <Plus className="w-6 h-6" />
                           </button>
                       </div>
                       {formData.usedSupplies.length > 0 && (
                           <div className="space-y-2 mt-2">
                               {formData.usedSupplies.map(item => (
                                   <div key={item.id} className={`flex justify-between items-center bg-white p-3 rounded-lg border shadow-sm ${item.isMandatory ? 'border-red-200 bg-red-50' : 'border-gray-100'}`}>
                                       <div className="flex items-center gap-2">
                                           {item.isMandatory && <Lock className="w-4 h-4 text-red-500" />}
                                           <span className="text-sm font-medium text-gray-700">{item.qty} x {item.name}</span>
                                       </div>
                                       <button 
                                           type="button" 
                                           onClick={() => setFormData(prev => ({...prev, usedSupplies: prev.usedSupplies.filter(s => s.id !== item.id)}))} 
                                           className={`p-1 rounded-full transition ${item.isMandatory ? 'text-red-300 hover:text-red-500 hover:bg-red-100' : 'text-gray-400 hover:text-red-500 hover:bg-red-50'}`}
                                           title={item.isMandatory ? 'Item Obligatorio' : 'Eliminar'}
                                       >
                                           <X className="w-5 h-5" />
                                       </button>
                                   </div>
                               ))}
                           </div>
                       )}
                   </div>

                   <div className="pt-4 flex justify-end"><button type="submit" className="w-full md:w-auto bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-green-200 hover:bg-green-700 transition active:scale-95"><Save className="w-5 h-5 mr-2 inline" /> Registrar</button></div>
               </form>
           </Modal>
       </div>
   );
};

export default MaintenanceSection;