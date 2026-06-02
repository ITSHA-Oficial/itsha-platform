import PDFDocument from 'pdfkit';

export interface QuoteData {
  client_name: string;
  client_phone: string;
  items: {
    product_name: string;
    variant_signature?: string | null;
    quantity: number;
    unit_price?: number | null;
    total_price?: number | null;
  }[];
  notes?: string | null;
}

export function generateQuotePDF(data: QuoteData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    // Encabezado
    doc.fontSize(20).font('Helvetica-Bold').text('Cotización', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, { align: 'right' });
    doc.moveDown();

    // Datos del cliente
    doc.fontSize(12).font('Helvetica-Bold').text('Datos del cliente');
    doc.fontSize(10).font('Helvetica').text(`Nombre: ${data.client_name}`);
    doc.text(`Teléfono: ${data.client_phone}`);
    if (data.notes) doc.text(`Notas: ${data.notes}`);
    doc.moveDown();

    // Tabla de items
    doc.fontSize(12).font('Helvetica-Bold').text('Productos solicitados');
    doc.moveDown(0.5);

    let y = doc.y;
    doc.fontSize(9).font('Helvetica-Bold');
    doc.text('Producto', 50, y);
    doc.text('Cant.', 300, y);
    doc.text('Precio', 370, y);
    doc.text('Total', 450, y);
    doc.moveDown(0.5);

    doc.font('Helvetica');
    data.items.forEach(item => {
      y = doc.y;
      doc.fontSize(9);
      const name = item.variant_signature ? `${item.product_name} (${item.variant_signature})` : item.product_name;
      doc.text(name.substring(0, 40), 50, y, { width: 240 });
      doc.text(String(item.quantity), 300, y);
      doc.text(item.unit_price ? `S/ ${item.unit_price.toFixed(2)}` : 'N/A', 370, y);
      doc.text(item.total_price ? `S/ ${(item.total_price * item.quantity).toFixed(2)}` : 'N/A', 450, y);
      doc.moveDown(0.5);
    });

    doc.moveDown();
    const grandTotal = data.items.reduce((sum, i) => sum + (i.total_price || 0) * i.quantity, 0);
    doc.fontSize(10).font('Helvetica-Bold').text(`Total general: S/ ${grandTotal.toFixed(2)}`, { align: 'right' });
    doc.end(); // ← CIERRE DEL DOCUMENTO
  });
}