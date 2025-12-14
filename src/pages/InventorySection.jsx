import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc, addDoc } from 'firebase/firestore';
import { Search, Plus, Edit2, Trash2, PlusCircle } from 'lucide-react';

import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/Modal';
import { getCollectionRef } from '../lib/utils';

const InventorySection = ({ userId, supplies, showMessage, userRole }) => {
   const [search, setSearch] = useState('');
   const [modalOpen, setModalOpen] = useState(false);
   const [restockModalOpen, setRestockModalOpen] = useState(false);
   const [editingItem, setEditingItem] = useState(null);
   const [selectedItemForRestock, setSelectedItemForRestock] = useState(null);
   const [restockQty, setRestockQty] = useState(0);
   const [form, setForm] = useState({ name: '', stock: 0, unit: 'Unidades' });
   const [confirmDeleteId, setConfirmDeleteId] = useState(null);

   // Permission Logic
   const canCreate = userRole === 'Administrador' || userRole === 'Instructor';
   const canRestock = userRole === 'Administrador' || userRole === 'Instructor';
   const canEditDelete = userRole === 'Administrador';
   const filteredSupplies = supplies.filter(s => s.name.toLowerCase().includes(search.toLowerCase()));

   const handleSaveStock = async (e) => {
       e.preventDefault();
       try {
           const ref = getCollectionRef('supplies', userId);
           if (editingItem) await updateDoc(doc(ref, editingItem.id), form); else await addDoc(ref, form);
           setModalOpen(false); showMessage('Inventario actualizado', 'success');
       } catch (err) { showMessage('Error al guardar', 'error'); }
   };
   const handleRestock = async (e) => {
       e.preventDefault();
       if(!selectedItemForRestock) return;
       const qtyToAdd = parseInt(restockQty);
       if(qtyToAdd <= 0) return showMessage("Cantidad inválida", "error");
       try {
           const ref = doc(getCollectionRef('supplies', userId), selectedItemForRestock.id);
           const newStock = parseInt(selectedItemForRestock.stock || 0) + qtyToAdd;
           await updateDoc(ref, { stock: newStock });
           setRestockModalOpen(false);
           showMessage(`Stock actualizado: +${qtyToAdd} ${selectedItemForRestock.unit}`, 'success');
       } catch(e) { showMessage('Error al actualizar stock', 'error'); }
   };
   const confirmDeleteStock = async () => {
       if (!confirmDeleteId) return;
       try { await deleteDoc(doc(getCollectionRef('supplies', userId), confirmDeleteId)); showMessage('Eliminado correctamente', 'success'); } 
       catch (error) { showMessage('Error al eliminar', 'error');
       } finally { setConfirmDeleteId(null); }
   };

   return (
       <div className="space-y-6 pb-24 md:pb-0">
           <ConfirmationModal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={confirmDeleteStock} title="Eliminar Suministro" message="¿Seguro que deseas eliminar este item?" />
           
           <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
               <div className="relative w-full md:w-96"><Search className="absolute left-4 top-3.5 text-gray-400 w-5 h-5" /><input type="text" placeholder="Buscar suministro..." value={search} onChange={e => setSearch(e.target.value)} className="w-full pl-12 pr-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white text-base transition"/></div>
               {canCreate && (
                   <button onClick={() => { setEditingItem(null); setForm({name:'', stock:0, unit:'Unidades'}); setModalOpen(true); }} className="bg-green-600 text-white px-6 py-3 rounded-xl flex items-center hover:bg-green-700 transition w-full md:w-auto justify-center font-bold text-sm shadow-lg shadow-green-200 active:scale-95">
                       <Plus className="w-5 h-5 mr-2" /> Nuevo Item
                   </button>
               )}
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in">
               {filteredSupplies.map(s => (
                   <div key={s.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-indigo-500 flex justify-between items-center hover:shadow-md transition">
                       <div><h4 className="font-bold text-gray-800 text-sm mb-1">{s.name}</h4><p className={`text-xs font-bold px-2 py-1 rounded-md inline-block ${s.stock < 10 ? 'bg-red-100 text-red-600' : 'bg-green-100 text-green-600'}`}>Stock: {s.stock} {s.unit}</p></div>
                       <div className="flex gap-1">
                           {canRestock && (
                               <button onClick={() => { setSelectedItemForRestock(s); setRestockQty(0); setRestockModalOpen(true); }} className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition active:scale-95" title="Re-Stock">
                                   <PlusCircle className="w-5 h-5" />
                               </button>
                           )}
                           {canEditDelete && (
                               <>
                                   <button onClick={() => { setEditingItem(s); setForm(s); setModalOpen(true); }} className="p-2 text-gray-400 hover:text-indigo-600 hover:bg-gray-50 rounded-lg transition active:scale-95"><Edit2 className="w-5 h-5" /></button>
                                   <button onClick={() => setConfirmDeleteId(s.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-gray-50 rounded-lg transition active:scale-95"><Trash2 className="w-5 h-5" /></button>
                               </>
                           )}
                       </div>
                   </div>
               ))}
           </div>

           {/* Modal Nuevo/Editar */}
           <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingItem ? "Editar Suministro" : "Nuevo Suministro"}>
               <form onSubmit={handleSaveStock} className="space-y-5">
                   <div><label className="block text-sm font-bold mb-1.5 text-gray-700">Nombre</label><input required type="text" value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" /></div>
                   <div className="grid grid-cols-2 gap-4">
                       <div><label className="block text-sm font-bold mb-1.5 text-gray-700">Stock Inicial</label><input required type="number" value={form.stock} onChange={e => setForm({...form, stock: Number(e.target.value)})} className="w-full border border-gray-200 p-3 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" /></div>
                       <div><label className="block text-sm font-bold mb-1.5 text-gray-700">Unidad</label><input required type="text" value={form.unit} onChange={e => setForm({...form, unit: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" /></div>
                   </div>
                   <div className="pt-4 flex justify-end"><button type="submit" className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition active:scale-95">Guardar</button></div>
               </form>
           </Modal>

           {/* Modal Restock */}
           <Modal isOpen={restockModalOpen} onClose={() => setRestockModalOpen(false)} title="Reabastecer Stock">
               <form onSubmit={handleRestock} className="space-y-5">
                   <div className="text-center mb-4">
                       <p className="text-sm text-gray-500">Item</p>
                       <h3 className="text-xl font-bold text-gray-800">{selectedItemForRestock?.name}</h3>
                       <p className="text-sm font-bold text-green-600 mt-1">Actual: {selectedItemForRestock?.stock} {selectedItemForRestock?.unit}</p>
                   </div>
                   <div>
                       <label className="block text-sm font-bold mb-1.5 text-gray-700 text-center">Cantidad a Agregar</label>
                       <input required type="number" min="1" value={restockQty} onChange={e => setRestockQty(e.target.value)} className="w-full border border-gray-200 p-4 rounded-xl text-3xl text-center font-bold text-indigo-600 focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" />
                   </div>
                   <div className="pt-2 flex justify-end">
                       <button type="submit" className="w-full bg-green-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-green-700 transition active:scale-95 flex items-center justify-center">
                           <PlusCircle className="w-5 h-5 mr-2"/> Confirmar Ingreso
                       </button>
                   </div>
               </form>
           </Modal>
       </div>
   );
};

export default InventorySection;