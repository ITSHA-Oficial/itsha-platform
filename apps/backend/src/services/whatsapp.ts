export function buildWhatsAppUrl(phone: string, clientName: string, pdfUrl: string): string {
  const cleanPhone = phone.replace(/\D/g, '');
  const message = `Hola! Soy ${clientName}. Acabo de enviar una solicitud de cotización. Puedes ver el detalle aquí: ${pdfUrl}`;
  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}