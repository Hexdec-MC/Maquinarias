import { CheckCircle, AlertTriangle, X } from 'lucide-react';

const GlobalToast = ({ message, onClose }) => {
   if (!message) return null;
   return (
       <div className={`fixed z-[120] print:hidden animate-bounce-in
           top-20 left-4 right-4 md:top-auto md:left-auto md:bottom-8 md:right-8 md:w-auto
           max-w-md mx-auto md:mx-0
           px-6 py-4 rounded-2xl shadow-2xl backdrop-blur-md flex items-center justify-between
           ${message.type === 'success' ? 'bg-green-600/95 text-white shadow-green-900/20' : 'bg-red-600/95 text-white shadow-red-900/20'}
       `}>
           <div className="flex items-center mr-4">
               {message.type === 'success' ? <CheckCircle className="w-6 h-6 mr-3 shrink-0" /> : <AlertTriangle className="w-6 h-6 mr-3 shrink-0" />}
               <span className="font-bold text-sm md:text-base leading-tight">{message.text}</span>
           </div>
           <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition"><X className="w-5 h-5"/></button>
       </div>
   );
};

export default GlobalToast;