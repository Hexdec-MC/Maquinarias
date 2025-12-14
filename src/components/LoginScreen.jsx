import React, { useState } from 'react';
import { Truck, LogIn, AlertTriangle } from 'lucide-react';
import { DUMMY_AUTH_DB } from '../lib/constants';

const LoginScreen = ({ onLogin }) => {
   const [username, setUsername] = useState('');
   const [password, setPassword] = useState('');
   const [error, setError] = useState('');
   const handleLogin = (e) => { e.preventDefault(); const user = DUMMY_AUTH_DB.find(u => u.username === username && u.password === password); if (user) onLogin(user);
   else setError('Credenciales inválidas. Intente de nuevo.'); };
   return (
       <div className="min-h-[100dvh] bg-slate-900 flex items-center justify-center p-4 print:hidden">
           <div className="bg-white rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden max-w-4xl w-full transform transition-all">
               <div className="md:w-1/2 bg-indigo-600 p-8 md:p-12 flex flex-col justify-center items-center text-white text-center relative overflow-hidden">
                   <Truck className="w-24 h-24 mb-6 opacity-90 relative z-10 drop-shadow-lg" />
                   <h1 className="text-4xl font-extrabold mb-2 relative z-10 tracking-tight">HeavyGest</h1>
                   <p className="text-indigo-100 text-lg relative z-10 font-medium">Gestión de Flota Inteligente</p>
               </div>
               <div className="md:w-1/2 p-8 md:p-12 flex flex-col justify-center">
                   <h2 className="text-2xl font-bold text-gray-800 mb-2">Bienvenido</h2>
                   <p className="text-gray-500 mb-8">Ingresa tus credenciales para continuar</p>
                   {error && <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded-lg mb-6 text-sm flex items-center"><AlertTriangle className="w-4 h-4 mr-2 flex-shrink-0"/>{error}</div>}
                   <form onSubmit={handleLogin} className="space-y-6">
                       <div><label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Usuario</label><input type="text" value={username} onChange={e => setUsername(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition bg-gray-50 text-base" placeholder="Ej. admin" /></div>
                       <div><label className="block text-gray-700 text-sm font-bold mb-2 ml-1">Contraseña</label><input type="password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 border border-gray-200 rounded-xl focus:ring-4 focus:ring-indigo-100 focus:border-indigo-500 outline-none transition bg-gray-50 text-base" placeholder="••••••" /></div>
                       <button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-3.5 rounded-xl transition duration-200 flex justify-center items-center shadow-lg shadow-indigo-200 active:scale-95"><LogIn className="w-5 h-5 mr-2" /> Iniciar Sesión</button>
                   </form>
               </div>
           </div>
       </div>
   );
};

export default LoginScreen;