import { Loader2 } from 'lucide-react';

const Loader = () => (
   <div className="flex justify-center items-center h-[100dvh] text-indigo-600 flex-col bg-gray-50">
       <Loader2 className="animate-spin w-12 h-12 mb-4" />
       <span className="text-lg font-medium animate-pulse">Cargando Sistema...</span>
   </div>
);

export default Loader;