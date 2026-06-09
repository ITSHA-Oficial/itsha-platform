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
  logoUrl?: string | null;
  primaryColor?: string | null;
  whatsapp?: string | null;
}

export async function generateQuotePDF(data: QuoteData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({ margin: 50 });
    const chunks: Buffer[] = [];

    doc.on('data', (chunk: Buffer) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    const primaryColor = data.primaryColor || '#1a56db';
    const darkGray = '#6b7280';
    const lightGray = '#f3f4f6';

    // === ENCABEZADO ===
    doc.rect(0, 0, doc.page.width, 3).fill(primaryColor);

    // Intentar cargar y dibujar el logo (de forma síncrona dentro del flujo)
    let logoLoaded = false;
    if (data.logoUrl) {
      try {
        const response = await fetch(data.logoUrl);
        if (response.ok) {
          const buffer = await response.arrayBuffer();
          doc.image(Buffer.from(buffer), doc.page.width - 120, 20, { width: 80 });
          logoLoaded = true;
          doc.moveDown(2);
        }
      } catch (err) {
        console.warn('No se pudo cargar el logo para el PDF:', err);
      }
    }

    // Si no hay logo, solo bajamos un espacio para que el título no quede pegado arriba
    if (!logoLoaded) {
      doc.moveDown(1);
    }

    // Título
    doc.fontSize(20).font('Helvetica-Bold').fillColor(primaryColor).text('Cotización', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor(darkGray).text(`Fecha: ${new Date().toLocaleDateString('es-PE')}`, { align: 'right' });
    doc.moveDown(1.5);

    // Datos del cliente
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('Datos del cliente');
    doc.moveDown(0.5);
    doc.fontSize(10).font('Helvetica').fillColor('black');
    doc.text(`Nombre: ${data.client_name}`);
    doc.text(`Teléfono: ${data.client_phone}`);
    if (data.notes) doc.text(`Notas: ${data.notes}`);
    doc.moveDown(1.5);

    // Tabla de items
    doc.fontSize(12).font('Helvetica-Bold').fillColor(primaryColor).text('Productos solicitados');
    doc.moveDown(0.8);

    const tableTop = doc.y;
    const colX = { producto: 50, cantidad: 300, precio: 370, total: 450 };

    doc.fontSize(9).font('Helvetica-Bold').fillColor('black');
    doc.text('Producto', colX.producto, tableTop);
    doc.text('Cant.', colX.cantidad, tableTop);
    doc.text('Precio', colX.precio, tableTop);
    doc.text('Total', colX.total, tableTop);

    doc.moveDown(0.5);
    const lineY = doc.y;
    doc.rect(50, lineY, doc.page.width - 100, 1).fill(primaryColor);
    doc.moveDown(0.8);

    doc.font('Helvetica').fillColor('black');
    data.items.forEach((item, index) => {
      const y = doc.y;
      doc.fontSize(9);
      const name = item.variant_signature ? `${item.product_name} (${item.variant_signature})` : item.product_name;

      if (index % 2 === 0) {
        doc.rect(45, y - 2, doc.page.width - 90, 16).fill(lightGray);
        doc.fillColor('black');
      }

      doc.text(name.substring(0, 40), colX.producto, y, { width: 240 });
      doc.text(String(item.quantity), colX.cantidad, y);
      doc.text(item.unit_price ? `S/ ${item.unit_price.toFixed(2)}` : 'N/A', colX.precio, y);
      doc.text(item.total_price ? `S/ ${(item.total_price * item.quantity).toFixed(2)}` : 'N/A', colX.total, y);
      doc.moveDown(1.2);
    });

    doc.moveDown(1);

    // Total
    const grandTotal = data.items.reduce((sum, i) => sum + (i.total_price || 0) * i.quantity, 0);
    doc.fontSize(10).font('Helvetica-Bold').fillColor(primaryColor).text(`Total general: S/ ${grandTotal.toFixed(2)}`, { align: 'right' });
    doc.moveDown(3);

    // Pie de página
    doc.fontSize(8).font('Helvetica').fillColor(darkGray).text('Gracias por tu preferencia. Para cualquier consulta, comunícate con nosotros.', { align: 'center' });
    if (data.whatsapp) {
      doc.text(`WhatsApp: ${data.whatsapp}`, { align: 'center' });
    }

    doc.end();
  });
}