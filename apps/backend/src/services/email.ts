import sgMail from '@sendgrid/mail';

const SENDGRID_API_KEY = process.env.SENDGRID_API_KEY || '';
sgMail.setApiKey(SENDGRID_API_KEY);

export async function sendQuoteEmail(
  to: string,
  subject: string,
  pdfBuffer: Buffer,
  clientName: string
): Promise<boolean> {
  try {
    const msg = {
      to,
      from: process.env.EMAIL_FROM || 'itsha.peru@gmail.com',
      subject,
      text: `Hola ${clientName},\n\nAdjuntamos el PDF con tu cotización.\n\n¡Gracias por confiar en nosotros!`,
      attachments: [
        {
          content: pdfBuffer.toString('base64'),
          filename: 'cotizacion.pdf',
          type: 'application/pdf',
          disposition: 'attachment',
        },
      ],
    };
    await sgMail.send(msg);
    console.log(`[Email] Correo enviado a ${to}`);
    return true;
  } catch (error: any) {
    console.error('[Email] Error al enviar correo:', error.message);
    return false;
  }
}