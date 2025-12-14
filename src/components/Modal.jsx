import { XCircle } from 'lucide-react';

const Modal = ({ isOpen, title, onClose, children, maxWidth = "max-w-lg" }) => {
   if (!isOpen) return null;
   return (
       <div className="fixed inset-0 bg-gray-900/80 flex items-center justify-center z-[60] p-4 backdrop-blur-sm print:hidden animate-fade-in safe-padding">
           <div className={`bg-white w-full h-auto max-h-[90dvh] rounded-2xl shadow-2xl ${maxWidth} flex flex-col transition-all transform overflow-hidden`}>
               <div className="flex justify-between items-center p-4 border-b bg-indigo-50 shrink-0">
                   <h3 className="text-lg md:text-xl font-bold text-indigo-900 truncate pr-4">{title}</h3>
                   <button onClick={onClose} className="text-gray-500 hover:text-red-600 p-2 rounded-full hover:bg-white transition active:scale-95 shrink-0">
                       <XCircle className="w-7 h-7" />
                   </button>
               </div>
               <div className="p-4 md:p-6 overflow-y-auto overscroll-contain bg-gray-50/50">
                   {children}
               </div>
           </div>
       </div>
   );
};

export default Modal;