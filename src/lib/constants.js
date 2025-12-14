import { Truck, Package } from 'lucide-react';
import Circle from '../components/Circle';


export const appId = typeof __app_id !== 'undefined' ? __app_id : 'heavy-machinery-app-v2';

export const initialAuthToken =
  typeof __initial_auth_token !== 'undefined' ? __initial_auth_token : null;

export const WARNING_THRESHOLD = 50;
export const BLOCK_THRESHOLD = 15; // Margen de tolerancia para bloqueo de operación

export const MACHINE_ICONS = [
   { id: 'excavator', label: 'Excavadora', icon: Truck }, 
   { id: 'loader', label: 'Cargador', icon: Package },
   { id: 'truck', label: 'Camión', icon: Truck },
   { id: 'roller', label: 'Rodillo', icon: Circle },
];

export const PM_SEQUENCE = ['PM1', 'PM2', 'PM1', 'PM3', 'PM1', 'PM2', 'PM3', 'PM4'];
// Updated labels with exact hour milestones for clarity
export const PM_CYCLE_LABELS = [
   'PM1 (250 hrs)',
   'PM2 (500 hrs)',
   'PM1 (750 hrs)',
   'PM3 (1000 hrs)',
   'PM1 (1250 hrs)',
   'PM2 (1500 hrs)',
   'PM3 (1750 hrs)',
   'PM4 (2000 hrs - Fin Ciclo)'
];
export const PM_TYPES = ['PM1', 'PM2', 'PM3', 'PM4']; 

export const DUMMY_AUTH_DB = [
   { id: 'admin1', username: 'admin', role: 'Administrador', password: '123' },
   { id: 'inst1', username: 'Usuario', role: 'Usuario', password: '456' },
   { id: 'student1', username: 'Visor', role: 'Visor', password: '789' },
];

export const DUMMY_MACHINES = [
   { 
       id: 'M1', 
       name: 'Excavadora Cat 320', 
       model: '320D', 
       plate: 'CAT-001',
       current_hm: 5120, 
       fuel_level: 75, 
       next_pm_type: 'PM3', 
       next_pm_due_hm: 5370, 
       last_pm_type: 'PM1', 
       last_pm_hm: 5120, 
       is_in_use: false, 
       series: 'CGG305163', 
       next_pm_sequence_index: 3,
       image_type: 'preset',
       image_src: 'excavator' 
   },
   { 
       id: 'M2', 
       name: 'Cargador Frontal WA470', 
       model: 'WA470-6', 
       plate: 'KOM-992',
       current_hm: 260, 
       fuel_level: 40,
       next_pm_type: 'PM2', 
       next_pm_due_hm: 510, 
       last_pm_type: 'PM1', 
       last_pm_hm: 260, 
       is_in_use: false, 
       series: 'KAM47060021', 
       next_pm_sequence_index: 1,
       image_type: 'preset',
       image_src: 'loader'
   },
];

export const DUMMY_SUPPLIES = [
   { id: 'S1', name: 'Aceite de Motor SAE 15W-40', stock: 150, unit: 'Litros' },
   { id: 'S2', name: 'Filtro de Aceite (Grande)', stock: 80, unit: 'Unidades' },
];
