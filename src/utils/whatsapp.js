/**
 * Elimina todos los caracteres que no sean números de un teléfono
 */
export function cleanPhoneNumber(phone) {
  if (!phone) return '';
  return phone.replace(/\D/g, '');
}

/**
 * Genera enlace de WhatsApp para un cliente (mensaje genérico)
 */
export function getWhatsAppClientLink(phone, clientName, appName = 'PrestaFácil') {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return null;
  // Asumimos código de Costa Rica (+506) por defecto si tiene 8 dígitos
  const finalPhone = cleaned.length === 8 ? `506${cleaned}` : cleaned;
  const message = encodeURIComponent(`Hola ${clientName}, te escribo de ${appName}.`);
  return `https://wa.me/${finalPhone}?text=${message}`;
}

/**
 * Genera enlace de WhatsApp para un recordatorio de pago
 */
export function getWhatsAppReminderLink(phone, clientName, amountFormatted, dueDateFormatted, appName = 'PrestaFácil') {
  const cleaned = cleanPhoneNumber(phone);
  if (!cleaned) return null;
  const finalPhone = cleaned.length === 8 ? `506${cleaned}` : cleaned;
  
  const message = encodeURIComponent(
    `Hola ${clientName} 👋, somos ${appName}.\n\nTe recordamos amablemente que tienes una cuota pendiente de *${amountFormatted}* para la fecha *${dueDateFormatted}*.\n\n¡Gracias por tu pago puntual!`
  );
  
  return `https://wa.me/${finalPhone}?text=${message}`;
}
