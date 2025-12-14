import React, { useState, useEffect } from 'react';
import { signInAnonymously, signInWithCustomToken, onAuthStateChanged } from 'firebase/auth';
import { doc, collection, query, onSnapshot, setDoc, limit } from 'firebase/firestore';

import { auth, db } from "./firebaseConfig";
import { getCollectionRef } from './lib/utils';
import { DUMMY_MACHINES, DUMMY_SUPPLIES, DUMMY_AUTH_DB, initialAuthToken } from './lib/constants';

import Loader from './components/Loader';
import LoginScreen from './components/LoginScreen';
import GlobalToast from './components/GlobalToast';
import Layout from './layout/Layout';

import DashboardOverview from './pages/DashboardOverview';
import MachineManagementSection from './pages/MachineManagementSection';
import InventorySection from './pages/InventorySection';
import MaintenanceSection from './pages/MaintenanceSection';
import MachineUsageSection from './pages/MachineUsageSection';
import UserManagementSection from './pages/UserManagementSection';

export default function App() {
   const [user, setUser] = useState(null);
   const [authReady, setAuthReady] = useState(false);
   const [userId, setUserId] = useState(null);
   const [activeTab, setActiveTab] = useState('dashboard');
   const [message, setMessage] = useState(null);
   const [machines, setMachines] = useState([]);
   const [supplies, setSupplies] = useState([]);
   const [usersList, setUsersList] = useState([]);
   const [maintenanceHistory, setMHistory] = useState([]);
   const [usageHistory, setUHistory] = useState([]);
   const [currentJob, setCurrentJob] = useState(null);
   const [pmConfigs, setPmConfigs] = useState({});

   useEffect(() => {
       const init = async () => { if (initialAuthToken) await signInWithCustomToken(auth, initialAuthToken); else await signInAnonymously(auth); };
       const unsub = onAuthStateChanged(auth, (u) => { setUserId(u ? u.uid : null); setAuthReady(true); });
       init(); return () => unsub();
   }, []);

   useEffect(() => {
       if (!userId) return;
       const unsubMachines = onSnapshot(getCollectionRef('machines', userId), snap => { let data = snap.docs.map(d => ({id: d.id, ...d.data()})); setMachines(data); if(data.length === 0) DUMMY_MACHINES.forEach(m => setDoc(doc(getCollectionRef('machines', userId), m.id), m)); });
       const unsubSupplies = onSnapshot(getCollectionRef('supplies', userId), snap => { let data = snap.docs.map(d => ({id: d.id, ...d.data()})); setSupplies(data); if(data.length === 0) DUMMY_SUPPLIES.forEach(s => setDoc(doc(getCollectionRef('supplies', userId), s.id), s)); });
       const unsubUsers = onSnapshot(getCollectionRef('users_list', userId), snap => { let data = snap.docs.map(d => ({id: d.id, ...d.data()})); setUsersList(data); if(data.length === 0) DUMMY_AUTH_DB.forEach(u => setDoc(doc(getCollectionRef('users_list', userId), u.id), u)); });
       const unsubMHistory = onSnapshot(query(getCollectionRef('maintenance_history', userId), limit(50)), snap => { setMHistory(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => (b.timestamp?.seconds||0) - (a.timestamp?.seconds||0)));
       });
       const unsubUHistory = onSnapshot(query(getCollectionRef('usage_history', userId), limit(50)), snap => { setUHistory(snap.docs.map(d => ({id: d.id, ...d.data()})).sort((a,b) => b.endTime - a.endTime)); });
       const unsubPmConfigs = onSnapshot(getCollectionRef('pm_configs', userId), snap => {
           const configs = {};
           snap.docs.forEach(doc => { configs[doc.id] = doc.data().items || []; });
           setPmConfigs(configs);
       });
       return () => { unsubMachines(); unsubSupplies(); unsubMHistory(); unsubUHistory(); unsubUsers(); unsubPmConfigs(); };
   }, [userId]);

   const showMessage = (text, type) => { setMessage({ text, type }); setTimeout(() => setMessage(null), 4000); };
   
   if (!authReady) return <Loader />;
   if (!user) return <LoginScreen onLogin={setUser} />;

   const renderContent = () => {
       switch (activeTab) {
           case 'dashboard':
               return <DashboardOverview machines={machines} supplies={supplies} maintenanceHistory={maintenanceHistory} usageHistory={usageHistory} />;
           case 'machines':
               return <MachineManagementSection userId={userId} machines={machines} showMessage={showMessage} userRole={user.role} />;
           case 'inventory':
               return <InventorySection userId={userId} supplies={supplies} showMessage={showMessage} userRole={user.role} />;
           case 'maintenance':
               return <MaintenanceSection userId={userId} machines={machines} supplies={supplies} history={maintenanceHistory} pmConfigs={pmConfigs} showMessage={showMessage} userRole={user.role} />;
           case 'usage':
               return <MachineUsageSection userId={userId} userName={user.username} machines={machines} currentJob={currentJob} setCurrentJob={setCurrentJob} history={usageHistory} showMessage={showMessage} userRole={user.role} />;
           case 'users':
                return <UserManagementSection userId={userId} users={usersList} showMessage={showMessage} userRole={user.role} />;
           default:
               return null;
       }
   }

   return (
       <>
           <Layout
               user={user}
               activeTab={activeTab}
               setActiveTab={setActiveTab}
               onLogout={() => setUser(null)}
               machines={machines}
               supplies={supplies}
               currentJob={currentJob}
           >
               {renderContent()}
           </Layout>

           <GlobalToast message={message} onClose={() => setMessage(null)} />

           <style>{`
               .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
               .pt-safe { padding-top: env(safe-area-inset-top); }
               .safe-padding { padding-left: env(safe-area-inset-left); padding-right: env(safe-area-inset-right); }
               
               @keyframes fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
               .animate-fade-in { animation: fade-in 0.3s ease-out forwards; }
               
               @keyframes slide-up-mobile { from { transform: translateY(100%); } to { transform: translateY(0); } }
               .animate-slide-up-mobile { animation: slide-up-mobile 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
               
               @keyframes bounce-in { 
                   0% { transform: scale(0.9); opacity: 0; } 
                   60% { transform: scale(1.05); opacity: 1; } 
                   100% { transform: scale(1); opacity: 1; } 
               }
               .animate-bounce-in { animation: bounce-in 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards; }
           `}</style>
       </>
   );
}