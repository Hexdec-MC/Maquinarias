import React from 'react';
import { LogOut, Truck, BarChart3, Clock, Wrench, Package, Users, Play } from 'lucide-react';
import NotificationCenter from '../components/NotificationCenter';

const Layout = ({ user, activeTab, setActiveTab, onLogout, machines, supplies, currentJob, children }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'machines', label: 'Flota', icon: Truck },
        { id: 'usage', label: 'Operaciones', icon: Clock },
        { id: 'maintenance', label: 'Mantenimiento', icon: Wrench },
        { id: 'inventory', label: 'Inventario', icon: Package },
    ];
    if (user?.role === 'Administrador' || user?.role === 'Usuario') navItems.push({ id: 'users', label: 'Usuarios', icon: Users });

    return (
        <div className="min-h-[100dvh] bg-gray-50 font-sans flex flex-col md:flex-row text-gray-900">
            {/* Sidebar Desktop */}
            <aside className="bg-slate-900 text-white w-72 flex-shrink-0 hidden md:flex flex-col h-screen sticky top-0 print:hidden shadow-2xl z-30">
                <div className="p-8 border-b border-slate-800"><div className="flex items-center gap-3"><div className="bg-indigo-600 p-2 rounded-lg"><Truck className="w-6 h-6 text-white" /></div><div><h1 className="font-bold text-xl tracking-wide text-white">HeavyGest</h1><p className="text-xs text-slate-400 font-medium">Enterprise Edition</p></div></div></div>
                <nav className="flex-1 p-4 space-y-2 overflow-y-auto">{navItems.map(item => (<button key={item.id} onClick={() => setActiveTab(item.id)} className={`w-full flex items-center p-3.5 rounded-xl transition duration-200 group ${activeTab === item.id ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' : 'text-slate-400 hover:bg-slate-800 hover:text-white'}`}><item.icon className={`w-5 h-5 mr-3 transition-colors ${activeTab === item.id ? 'text-white' : 'text-slate-500 group-hover:text-white'}`} /> <span className="font-medium text-sm">{item.label}</span></button>))}</nav>
                <div className="p-6 border-t border-slate-800 bg-slate-900/50"><div className="flex items-center gap-3 mb-4 px-2"><div className="bg-gradient-to-br from-indigo-500 to-purple-600 w-10 h-10 rounded-full flex items-center justify-center font-bold shadow-lg text-white border-2 border-slate-700">{user.username[0].toUpperCase()}</div><div className="overflow-hidden"><p className="font-bold text-sm truncate text-white">{user.username}</p><p className="text-xs text-slate-400 truncate">{user.role}</p></div></div><button onClick={onLogout} className="w-full bg-slate-800 hover:bg-red-600/90 py-3 rounded-xl text-xs font-bold flex justify-center items-center transition text-slate-300 hover:text-white border border-slate-700 hover:border-transparent"><LogOut className="w-4 h-4 mr-2" /> Cerrar Sesión</button></div>
            </aside>
            
            {/* Header Móvil Sticky: Optimized for 18:9+ and safe areas */}
            <div className="md:hidden bg-slate-900 text-white px-6 py-3 flex justify-between items-center fixed top-0 left-0 right-0 z-50 shadow-lg print:hidden min-h-[4rem] h-auto pt-safe transition-all duration-300">
                <div className="flex items-center gap-2"><div className="bg-indigo-600 p-1.5 rounded-lg"><Truck className="w-5 h-5 text-white"/></div><span className="font-bold text-lg tracking-tight">HeavyGest</span></div>
                <div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold border border-slate-700">{user.username[0].toUpperCase()}</div><button onClick={onLogout} className="text-slate-400 hover:text-white transition"><LogOut className="w-5 h-5"/></button></div>
            </div>

            {/* Main Content: Dynamic padding for safe areas */}
            <main 
                className="flex-1 p-4 md:p-8 overflow-y-auto h-auto md:h-screen print:p-0 print:h-auto print:overflow-visible bg-gray-50/50 pb-28 md:pb-8"
                style={{ paddingTop: 'calc(4rem + env(safe-area-inset-top) + 1rem)' }}
            >
                {/* Header de Sección - NO STICKY en móvil para evitar tapar contenido */}
                <header className="flex flex-row justify-between items-center mb-6 gap-4 print:hidden md:mb-8">
                    <div className="min-w-0 flex-1">
                        <h2 className="text-2xl font-extrabold text-slate-900 capitalize tracking-tight truncate">{navItems.find(n => n.id === activeTab)?.label}</h2>
                        <p className="text-sm text-gray-500 hidden md:block font-medium mt-1">Bienvenido de nuevo, {user.username}</p>
                    </div>
                    
                    <div className="flex items-center gap-3 shrink-0">
                        <NotificationCenter machines={machines} supplies={supplies} />
                        {currentJob && activeTab !== 'usage' && (
                            <button onClick={() => setActiveTab('usage')} className="flex items-center justify-center bg-orange-100 text-orange-700 px-3 py-2 md:px-4 md:py-2.5 rounded-xl text-xs md:text-sm font-bold animate-pulse border border-orange-200 hover:bg-orange-200 transition shadow-sm active:scale-95">
                                <Play className="w-4 h-4 md:mr-2 fill-current" /> 
                                <span className="hidden md:inline truncate max-w-[150px]">En uso: {currentJob.machineName}</span>
                                <span className="md:hidden">En uso</span>
                            </button>
                        )}
                    </div>
                </header>

                {children}
            </main>

            {/* Navegación Inferior Móvil (Bottom Nav) */}
            <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-lg border-t border-gray-200 flex justify-around items-center z-40 pb-safe print:hidden shadow-[0_-4px_10px_rgba(0,0,0,0.03)] safe-padding">
                {navItems.map(item => (
                    <button key={item.id} onClick={() => setActiveTab(item.id)} className={`flex flex-col items-center justify-center w-full py-3 transition-all duration-200 active:scale-90 ${activeTab === item.id ? 'text-indigo-600' : 'text-gray-400'}`}>
                        <div className={`mb-1 p-1 rounded-lg transition-all duration-200 ${activeTab === item.id ? 'bg-indigo-50 -translate-y-1' : ''}`}>
                            <item.icon className={`w-6 h-6 ${activeTab === item.id ? 'fill-current' : ''}`} />
                        </div>
                        <span className={`text-[10px] font-bold leading-none ${activeTab === item.id ? 'opacity-100' : 'opacity-70'}`}>{item.label}</span>
                    </button>
                ))}
            </div>
        </div>
    );
};

export default Layout;