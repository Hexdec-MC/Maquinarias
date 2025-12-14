import { FileText, Printer, X } from 'lucide-react';

const MaintenanceReportTemplate = ({ data, onClose }) => {
   const handlePrint = () => {
       const printContent = document.getElementById('printable-area');
       if (!printContent) return;
       const printWindow = window.open('', '_blank');
       if (!printWindow) { alert("Permite pop-ups"); return; }
       
       // Estilos de impresión ajustados para A4 y diseño SENATI
       printWindow.document.write(`
           <html>
               <head>
                   <title>Informe de Mantenimiento - SENATI</title>
                   <script src="https://cdn.tailwindcss.com"></script>
                   <style>
                       @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap');
                       @page { size: A4; margin: 10mm; }
                       body { 
                           font-family: 'Roboto', sans-serif; 
                           background: white; 
                           -webkit-print-color-adjust: exact !important; 
                           print-color-adjust: exact !important;
                           font-size: 11px;
                           color: #1f2937;
                       }
                       /* Clases para evitar cortes */
                       table, tr, td, th, tbody, thead, tfoot { page-break-inside: avoid !important; }
                       .avoid-break { page-break-inside: avoid !important; break-inside: avoid !important; }
                       
                       /* Bordes de tabla finos */
                       .table-border { border: 0.5px solid #374151; }
                       .table-header { background-color: #EBF1F9 !important; color: #000; font-weight: bold; }
                   </style>
               </head>
               <body>
                   ${printContent.innerHTML}
                   <script>setTimeout(()=>{window.print()},800)</script>
               </body>
           </html>
       `);
       printWindow.document.close();
   };
   
   const dateStr = data.timestamp ? new Date(data.timestamp.seconds * 1000).toLocaleDateString('es-PE') : 'N/A';
   const woNumber = data.id ? data.id.slice(0,8).toUpperCase() : '0000';
   
   return (
       <div className="fixed inset-0 bg-gray-900 bg-opacity-90 z-[100] overflow-y-auto flex justify-center p-4 md:p-8">
           <div className="bg-white w-full max-w-[210mm] shadow-2xl relative flex flex-col rounded-lg overflow-hidden h-[90vh]">
               {/* Header de la Vista Previa */}
               <div className="flex justify-between items-center p-4 bg-slate-900 text-white sticky top-0 z-20 shadow-md shrink-0">
                   <h2 className="font-bold flex items-center text-lg truncate"><FileText className="mr-2"/> Vista Previa (A4)</h2>
                   <div className="flex gap-2">
                       <button onClick={handlePrint} className="bg-blue-600 text-white px-4 py-2 rounded-lg font-bold flex items-center border border-blue-500 hover:bg-blue-700 text-xs md:text-sm transition active:scale-95"><Printer className="mr-2 w-4 h-4"/> Imprimir</button>
                       <button onClick={onClose} className="bg-red-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-red-600 text-xs md:text-sm transition active:scale-95"><X className="w-4 h-4 md:hidden"/><span className="hidden md:inline">Cerrar</span></button>
                   </div>
               </div>
               
               {/* ÁREA IMPRIMIBLE */}
               <div id="printable-area" className="p-8 overflow-y-auto bg-white flex-1">
                   <div className="max-w-full mx-auto">
                       
                       {/* CABECERA SENATI - Estilo PDF */}
                       <div className="flex justify-between items-start mb-6 avoid-break border-b-2 border-blue-900 pb-4">
                           <div className="w-1/4">
                               <div className="font-black text-3xl tracking-tighter text-blue-900 italic">SENATI</div>
                           </div>
                           <div className="flex-1 text-center">
                               <h1 className="text-2xl font-bold text-blue-900 uppercase tracking-wide">Informe de Mantenimiento</h1>
                               <h2 className="text-sm font-bold text-gray-600 uppercase mt-1">CFP - CERRO DE PASCO</h2>
                           </div>
                           <div className="w-1/4 text-right">
                               <div className="flex flex-col items-end">
                                   <div className="text-xs font-bold text-gray-500">WO N°: <span className="text-base text-black">{woNumber}</span></div>
                                   <div className="text-xs font-bold text-gray-500">Fecha: <span className="text-black">{dateStr}</span></div>
                               </div>
                           </div>
                       </div>

                       {/* DATOS GENERALES - Cuadrícula Densa */}
                       <div className="grid grid-cols-4 gap-x-4 gap-y-2 text-[10px] mb-6 border border-gray-300 p-3 avoid-break">
                           <div className="col-span-2 flex border-b border-gray-100 pb-1"><span className="font-bold w-24 text-gray-600">Cliente:</span> <span className="font-bold text-black uppercase">SENATI</span></div>
                           <div className="col-span-2 flex border-b border-gray-100 pb-1"><span className="font-bold w-24 text-gray-600">Modelo:</span> <span className="font-bold text-black uppercase">{data.machineName || 'N/A'}</span></div>
                           
                           <div className="col-span-2 flex border-b border-gray-100 pb-1"><span className="font-bold w-24 text-gray-600">Tipo Contrato:</span> <span className="text-black">Mantenimiento Preventivo</span></div>
                           <div className="col-span-2 flex border-b border-gray-100 pb-1"><span className="font-bold w-24 text-gray-600">Serie:</span> <span className="text-black uppercase">---</span></div>
                           
                           <div className="col-span-2 flex border-b border-gray-100 pb-1"><span className="font-bold w-24 text-gray-600">N° Interno:</span> <span className="text-black">---</span></div>
                           <div className="col-span-2 flex border-b border-gray-100 pb-1"><span className="font-bold w-24 text-gray-600">Lugar Op.:</span> <span className="text-black">VILLA DE PASCO</span></div>
                           
                           <div className="col-span-2 flex border-b border-gray-100 pb-1"><span className="font-bold w-24 text-gray-600">PM Realizado:</span> <span className="font-bold text-black">{data.type}</span></div>
                           <div className="col-span-2 flex border-b border-gray-100 pb-1"><span className="font-bold w-24 text-gray-600">Horómetro PM:</span> <span className="font-bold text-black">{data.hm_done_at} h</span></div>
                           
                           <div className="col-span-4 flex pt-1"><span className="font-bold w-24 text-gray-600">Técnico:</span> <span className="text-black uppercase">{data.operator || 'Técnico de Servicio'}</span></div>
                       </div>

                       {/* ESTADO DE EQUIPO - Banner */}
                       <div className="mb-6 p-2 bg-green-50 border border-green-200 avoid-break flex items-center">
                           <span className="font-bold text-gray-700 mr-4 text-xs">Estado de Equipo:</span>
                           <span className="text-sm font-extrabold text-green-800 uppercase">OPERATIVO CON OBSERVACIONES DE SEGUIMIENTO</span>
                       </div>

                       {/* TEXTO INTRODUCTORIO */}
                       <div className="mb-6 text-[10px] text-gray-600 text-justify avoid-break leading-relaxed">
                           <p className="mb-2">Estimado coordinador de área, la información presentada a continuación deberá ser revisada en su totalidad para que usted pueda conocer el estado actual del equipo.</p>
                           <p>En este informe usted podrá encontrar:</p>
                           <ol className="list-decimal ml-8 mt-1 space-y-0.5">
                               <li>Listado de tareas realizadas durante el servicio.</li>
                               <li>Estado de observaciones encontradas en el servicio.</li>
                               <li>Nuevas observaciones encontradas durante el servicio actual y recomendaciones.</li>
                               <li>Anexos.</li>
                           </ol>
                       </div>

                       {/* 1. LISTADO DE TAREAS */}
                       <div className="mb-6 avoid-break">
                           <h3 className="text-sm font-bold text-blue-900 mb-2 border-b border-blue-200 pb-1">1. Listado de tareas realizadas durante el servicio</h3>
                           <p className="text-[10px] mb-2 text-gray-500">En esta visita de mantenimiento se realizaron las actividades:</p>
                           
                           <table className="w-full text-[10px] border-collapse border border-gray-400">
                               <thead className="bg-blue-50">
                                   <tr>
                                       <th className="border border-gray-400 p-1.5 text-left w-2/3">Actividad / Suministro</th>
                                       <th className="border border-gray-400 p-1.5 text-center w-1/6">Cant.</th>
                                       <th className="border border-gray-400 p-1.5 text-center w-1/6">Estado</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   {/* Items fijos simulados para parecerse al PDF */}
                                   <tr>
                                       <td className="border border-gray-400 p-1.5 font-bold bg-gray-100" colSpan="3">Reemplazo de Filtros y Fluidos</td>
                                   </tr>
                                   {data.supplies_used?.map((item, idx) => (
                                       <tr key={idx}>
                                           <td className="border border-gray-400 p-1.5">{item.name}</td>
                                           <td className="border border-gray-400 p-1.5 text-center">{item.qty}</td>
                                           <td className="border border-gray-400 p-1.5 text-center">Si</td>
                                       </tr>
                                   ))}
                                   <tr>
                                       <td className="border border-gray-400 p-1.5 font-bold bg-gray-100" colSpan="3">Inspección y Otros</td>
                                   </tr>
                                   <tr>
                                       <td className="border border-gray-400 p-1.5">Inspección General del Equipo</td>
                                       <td className="border border-gray-400 p-1.5 text-center">1</td>
                                       <td className="border border-gray-400 p-1.5 text-center">Si</td>
                                   </tr>
                               </tbody>
                           </table>
                       </div>

                       {/* 2. OBSERVACIONES */}
                       <div className="mb-6 avoid-break">
                           <h3 className="text-sm font-bold text-blue-900 mb-2 border-b border-blue-200 pb-1">2. Observaciones</h3>
                           <table className="w-full text-[10px] border-collapse border border-gray-400">
                               <thead className="bg-blue-50">
                                   <tr>
                                       <th className="border border-gray-400 p-1.5 text-left">Descripción</th>
                                   </tr>
                               </thead>
                               <tbody>
                                   <tr>
                                       <td className="border border-gray-400 p-2 min-h-[40px]">{data.description}</td>
                                   </tr>
                               </tbody>
                           </table>
                       </div>
                       
                       {/* 3. EVIDENCIA FOTOGRÁFICA (GRID 3 COLUMNAS) */}
                       {data.images && data.images.length > 0 && (
                           <div className="mb-6 avoid-break">
                               <h3 className="text-sm font-bold text-blue-900 mb-2 border-b border-blue-200 pb-1">3. Evidencia Fotográfica (Detalles de Servicio)</h3>
                               <div className="grid grid-cols-3 gap-2">
                                   {data.images.map((img, idx) => (
                                       <div key={idx} className="border border-gray-300 flex flex-col">
                                           <div className="h-40 w-full bg-gray-100 overflow-hidden flex items-center justify-center">
                                               <img src={img} alt={`Evidencia ${idx+1}`} className="w-full h-full object-cover" />
                                           </div>
                                           <div className="p-1.5 bg-white border-t border-gray-300 text-center">
                                               <span className="text-[9px] font-bold text-gray-700 uppercase">FOTO {idx + 1}</span>
                                           </div>
                                       </div>
                                   ))}
                               </div>
                           </div>
                       )}

                       {/* FIRMAS */}
                       <div className="mt-12 grid grid-cols-2 gap-16 avoid-break">
                           <div className="text-center">
                               <div className="border-t border-black pt-2">
                                   <p className="font-bold text-xs text-black uppercase">{data.operator || 'Técnico'}</p>
                                   <p className="text-[10px] text-gray-500 uppercase">Técnico de Servicio</p>
                               </div>
                           </div>
                           <div className="text-center">
                               <div className="border-t border-black pt-2">
                                   <p className="font-bold text-xs text-black uppercase">SUPERVISOR</p>
                                   <p className="text-[10px] text-gray-500 uppercase">V°B° Cliente / SENATI</p>
                               </div>
                           </div>
                       </div>

                   </div>
               </div>
           </div>
       </div>
   );
};

export default MaintenanceReportTemplate;