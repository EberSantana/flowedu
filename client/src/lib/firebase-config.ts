/**
 * Configuração do Firebase para o frontend
 * Essas chaves são públicas e seguras de expor no frontend
 */

export const firebaseConfig = {
  apiKey: "AIzaSyDxK_placeholder", // Será preenchido no .env
  authDomain: "flowedu-18cb7.firebaseapp.com",
  projectId: "flowedu-18cb7",
  storageBucket: "flowedu-18cb7.appspot.com",
  messagingSenderId: "101480460831445015399",
  appId: "1:101480460831445015399:web:placeholder",
};

/**
 * Chave pública VAPID para Web Push (será usada para fallback em navegadores desktop)
 * Será preenchida via variável de ambiente VITE_VAPID_PUBLIC_KEY
 */
export const vapidPublicKey = import.meta.env.VITE_VAPID_PUBLIC_KEY || "";
