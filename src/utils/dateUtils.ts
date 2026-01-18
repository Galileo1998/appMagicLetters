// src/utils/dateUtils.ts

export function getDaysRemaining(
  dateStr: string | null, 
  serverDays?: number | null // Nuevo parámetro opcional
): { 
  text: string; 
  color: string; 
  isExpired: boolean 
} {
  
  let days: number;

  // 1. PRIORIDAD: Usar lo que calculó el servidor (Exacto)
  if (serverDays !== undefined && serverDays !== null) {
    days = serverDays;
  } 
  // 2. FALLBACK: Calcular localmente si no vino del server
  else if (dateStr) {
    // Intento básico de parsing para fallback
    // Formato esperado: 22-Jan-2026
    const parts = dateStr.replace(/-/g, ' ').split(' ');
    if (parts.length >= 3) {
       // Mapa simple inglés/español
       const months:any = {jan:0,ene:0, feb:1, mar:2, apr:3,abr:3, may:4, jun:5, jul:6, aug:7,ago:7, sep:8, oct:9, nov:10, dec:11,dic:11};
       const d = parseInt(parts[0]);
       const mStr = parts[1].toLowerCase();
       const y = parseInt(parts[2]);
       const m = months[mStr] ?? 0;
       
       const deadline = new Date(y, m, d);
       const today = new Date();
       deadline.setHours(0,0,0,0); today.setHours(0,0,0,0);
       const diff = deadline.getTime() - today.getTime();
       days = Math.ceil(diff / (1000 * 3600 * 24));
    } else {
       return { text: dateStr || '-', color: '#999', isExpired: false };
    }
  } else {
    return { text: '-', color: '#999', isExpired: false };
  }

  // 3. GENERAR TEXTO Y COLOR
  let text = `${days} días`;
  let color = '#28a745'; // Verde

  if (days < 0) {
    text = `Vencida (${Math.abs(days)}d)`;
    color = '#dc3545'; // Rojo
  } else if (days === 0) {
    text = '¡HOY!';
    color = '#dc3545'; // Rojo
  } else if (days <= 3) {
    text = `${days} días`;
    color = '#fd7e14'; // Naranja
  } else if (days <= 5) {
    text = `${days} días`;
    color = '#ffc107'; // Amarillo
  }

  return { text, color, isExpired: days < 0 };
}