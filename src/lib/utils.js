import { collection } from 'firebase/firestore';
import { db } from '../firebaseConfig';
import { appId, PM_SEQUENCE } from './constants';

export const formatDuration = (ms) => {
   const minutes = Math.floor(ms / 60000);
   const hours = Math.floor(minutes / 60);
   const remainingMinutes = minutes % 60;
   if (hours > 0) return `${hours}h ${remainingMinutes}m`;
   return `${minutes} min`;
};

// Función para comprimir imágenes (Evitar límite de 1MB de Firestore)
export const compressImage = (file) => {
   return new Promise((resolve) => {
       const reader = new FileReader();
       reader.readAsDataURL(file);
       reader.onload = (event) => {
           const img = new Image();
           img.src = event.target.result;
           img.onload = () => {
               const canvas = document.createElement('canvas');
               const MAX_WIDTH = 800;
               const MAX_HEIGHT = 800;
               let width = img.width;
               let height = img.height;

               if (width > height) {
                   if (width > MAX_WIDTH) {
                       height *= MAX_WIDTH / width;
                       width = MAX_WIDTH;
                   }
               } else {
                   if (height > MAX_HEIGHT) {
                       width *= MAX_HEIGHT / height;
                       height = MAX_HEIGHT;
                   }
               }
               canvas.width = width;
               canvas.height = height;
               const ctx = canvas.getContext('2d');
               ctx.drawImage(img, 0, 0, width, height);
               resolve(canvas.toDataURL('image/jpeg', 0.7)); // Compresión JPEG al 70%
           };
       };
   });
};

// Lógica de cálculo automático INTELIGENTE (Por proximidad y tolerancia de 25h)
export const getRecommendedSequenceIndex = (currentHm) => {
   // Hitos del ciclo de 2000 horas
   const milestones = [250, 500, 750, 1000, 1250, 1500, 1750, 2000];
   // Normalizamos el HM al ciclo actual de 2000 horas
   const relativeHm = currentHm % 2000;

   // Regla de Negocio:
   // Si (Hito - 25) <= relativeHm: Significa que ya estamos "en zona" de ese PM o ya lo pasamos.
   // Por tanto, el "Siguiente PM" debería ser el posterior a ese hito.
   // Ejemplo 1: HM = 230. relativeHm = 230.
   // Hito 1 = 250. (250 - 25 = 225).
   // 230 >= 225? Sí. -> Ya pasamos PM1. Toca PM2 (index 1).
   // Ejemplo 2: HM = 210. relativeHm = 210.
   // Hito 1 = 250. (250 - 25 = 225).
   // 210 >= 225? No. -> Toca PM1 (index 0).

   let nextIndex = 0; // Default al primero

   for (let i = 0; i < milestones.length; i++) {
       const threshold = milestones[i] - 25; // Umbral de tolerancia REDUCIDO A 25H
       
       if (relativeHm >= threshold) {
           // Si ya pasamos el umbral de este hito, el "siguiente" debe ser el i+1
           nextIndex = i + 1;
       } else {
           // Si no hemos llegado al umbral de este hito, este es el que toca.
           // Y como el bucle va en orden ascendente, el primero que no cumplimos es el correcto.
           nextIndex = i;
           break; // Salimos del bucle
       }
   }
   
   // Ajuste final: Si nextIndex es 8 (pasamos el de 2000), volvemos a 0 (PM1 250h del siguiente ciclo)
   return nextIndex % 8;
};

export const calculateNextPmStep = (currentHmDone, currentSequenceIndex) => {
   const nextPmDueHm = currentHmDone + 250;
   const nextSequenceIndex = (currentSequenceIndex + 1) % 8;
   const nextPmType = PM_SEQUENCE[nextSequenceIndex];
   return { nextPmType, nextPmDueHm, nextSequenceIndex };
};

export const getCollectionRef = (collectionName, userId) => {
   return collection(db, 'artifacts', appId, 'users', userId, collectionName);
};
