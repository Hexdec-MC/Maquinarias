import { Fuel } from 'lucide-react';

const FuelGauge = ({ percentage }) => {
   let color = 'bg-green-500';
   if (percentage <= 20) color = 'bg-red-500';
   else if (percentage <= 50) color = 'bg-yellow-500';
   return (
       <div className="w-full">
           <div className="flex justify-between text-xs mb-1 font-semibold text-gray-500">
               <span className="flex items-center"><Fuel className="w-3 h-3 mr-1"/> Nivel Combustible</span>
               <span>{percentage}%</span>
           </div>
           <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden border border-gray-300">
               <div className={`h-2.5 rounded-full ${color} transition-all duration-500`} style={{ width: `${percentage}%` }}></div>
           </div>
       </div>
   );
};

export default FuelGauge;