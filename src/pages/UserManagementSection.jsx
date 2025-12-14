import React, { useState } from 'react';
import { doc, updateDoc, deleteDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { UserPlus, Edit2, Trash2 } from 'lucide-react';

import ConfirmationModal from '../components/ConfirmationModal';
import Modal from '../components/Modal';
import { getCollectionRef } from '../lib/utils';

const UserManagementSection = ({ userId, users, showMessage, userRole }) => {
   const [modalOpen, setModalOpen] = useState(false);
   const [editingUser, setEditingUser] = useState(null);
   const [formData, setFormData] = useState({ username: '', password: '', role: 'Usuario' });
   const [confirmDeleteId, setConfirmDeleteId] = useState(null);

   const canEdit = userRole === 'Administrador';

   const handleSave = async (e) => { e.preventDefault();
   const ref = getCollectionRef('users_list', userId); try { if (editingUser) { await updateDoc(doc(ref, editingUser.id), formData); showMessage('Usuario actualizado', 'success');
   } else { await addDoc(ref, { ...formData, createdAt: serverTimestamp() }); showMessage('Usuario creado', 'success'); } setModalOpen(false);
   } catch (error) { showMessage('Error al guardar', 'error'); } };
   const confirmDelete = async () => { if (!confirmDeleteId) return;
   try { await deleteDoc(doc(getCollectionRef('users_list', userId), confirmDeleteId)); showMessage('Usuario eliminado', 'success'); } catch (error) { showMessage('Error al eliminar', 'error');
   } finally { setConfirmDeleteId(null); } };
   const openModal = (user = null) => { setEditingUser(user);
   setFormData(user ? { username: user.username, password: user.password, role: user.role } : { username: '', password: '', role: 'Usuario' }); setModalOpen(true);
   };

   return (
       <div className="space-y-6 pb-24 md:pb-0">
           <ConfirmationModal isOpen={!!confirmDeleteId} onClose={() => setConfirmDeleteId(null)} onConfirm={confirmDelete} title="Eliminar Usuario" message="¿Seguro que deseas eliminar este usuario?" />
           <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-gray-100 z-10 md:static">
               <h3 className="text-lg font-bold text-gray-800">Usuarios</h3>
               {canEdit && (
                   <button onClick={() => openModal()} className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl flex items-center text-sm font-bold hover:bg-indigo-700 transition active:scale-95 shadow-lg shadow-indigo-200">
                       <UserPlus className="w-5 h-5 mr-2" /> Nuevo
                   </button>
               )}
           </div>
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">{users.map(u => (<div key={u.id} className="bg-white p-5 rounded-2xl shadow-sm border-l-4 border-indigo-500 flex justify-between items-center"><div className="flex items-center gap-4"><div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white shadow-md ${u.role === 'Administrador' ? 'bg-purple-600' : 'bg-blue-500'}`}>{u.username[0].toUpperCase()}</div><div><h4 className="font-bold text-gray-800">{u.username}</h4><span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-md border border-gray-200">{u.role}</span></div></div>{canEdit && <div className="flex gap-1"><button onClick={() => openModal(u)} className="p-2 text-indigo-600 hover:bg-indigo-50 rounded-lg transition active:scale-95"><Edit2 className="w-5 h-5"/></button><button onClick={() => setConfirmDeleteId(u.id)} className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition active:scale-95"><Trash2 className="w-5 h-5"/></button></div>}</div>))}</div>
           <Modal isOpen={modalOpen} onClose={() => setModalOpen(false)} title={editingUser ? "Editar Usuario" : "Nuevo Usuario"}><form onSubmit={handleSave} className="space-y-5"><div><label className="block text-sm font-bold mb-1.5 text-gray-700">Usuario</label><input required type="text" value={formData.username} onChange={e => setFormData({...formData, username: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" /></div><div><label className="block text-sm font-bold mb-1.5 text-gray-700">Contraseña</label><input required type="text" value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base focus:ring-2 focus:ring-indigo-500 outline-none bg-gray-50 focus:bg-white transition" /></div><div><label className="block text-sm font-bold mb-1.5 text-gray-700">Rol</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full border border-gray-200 p-3 rounded-xl text-base bg-white focus:ring-2 focus:ring-indigo-500 outline-none"><option value="Usuario">Usuario</option><option value="Administrador">Administrador</option><option value="Visor">Visor</option></select></div><div className="pt-4 flex justify-end"><button type="submit" className="w-full md:w-auto bg-indigo-600 text-white px-8 py-3 rounded-xl font-bold shadow-lg hover:bg-indigo-700 transition active:scale-95">Guardar</button></div></form></Modal>
       </div>
   );
};

export default UserManagementSection;