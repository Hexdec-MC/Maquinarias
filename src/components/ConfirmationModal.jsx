import { AlertCircle, Trash2 } from 'lucide-react';

const ConfirmationModal = ({ isOpen, onClose, onConfirm, title, message }) => {
   if (!isOpen) return null;
   return (
       <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[70] p-4 backdrop-blur-sm print:hidden animate-fade-in">
           <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transform transition-all scale-100 border border-gray-100">
               <div className="p-6 text-center">
                   <div className="mx-auto flex items-center justify-center h-16 w-16 rounded-full bg-red-100 mb-4 animate-bounce-in">
                       <AlertCircle className="h-8 w-8 text-red-600" />
                   </div>
                   <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                   <p className="text-sm text-gray-500 mb-6 leading-relaxed">{message}</p>
                   <div className="flex flex-col-reverse md:flex-row justify-center gap-3">
                       <button onClick={onClose} className="w-full md:w-auto bg-white border border-gray-300 text-gray-700 px-5 py-3 rounded-xl font-bold hover:bg-gray-50 transition active:scale-95">Cancelar</button>
                       <button onClick={onConfirm} className="w-full md:w-auto bg-red-600 text-white px-5 py-3 rounded-xl font-bold hover:bg-red-700 shadow-lg shadow-red-200 transition active:scale-95 flex items-center justify-center"><Trash2 className="w-4 h-4 mr-2" /> Eliminar</button>
                   </div>
               </div>
           </div>
       </div>
   );
};

export default ConfirmationModal;