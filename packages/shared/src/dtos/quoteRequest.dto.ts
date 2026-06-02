import { z } from 'zod';

export const createQuoteRequestSchema = z.object({
  client_name: z.string().min(3).max(200),
  client_phone: z.string().regex(/^9\d{8}$/, 'Debe ser 9 dígitos empezando con 9'),
  client_email: z.string().email().optional().or(z.literal('')),
  notes: z.string().max(1000).optional(),
  items: z.array(z.object({
    product_id: z.string().uuid(),
    variant_id: z.string().uuid().optional(),
    quantity: z.coerce.number().int().min(1).max(99999),
    selected_options: z.record(z.string()),
    formula_inputs: z.record(z.string(), z.number()).optional().refine(
      (val) => val === undefined || Object.keys(val).every(k => typeof k === 'string' && k.length > 0),
      { message: 'formula_inputs debe ser un objeto con claves de texto y valores numéricos' }
    ),
    notes: z.string().max(500).optional()
  })).min(1).max(50)
});

export type CreateQuoteRequestDTO = z.infer<typeof createQuoteRequestSchema>;

export interface CreateQuoteResponseDTO {
  quote_request_id: string;
  processing_status: 'pending' | 'processing' | 'completed' | 'failed' | 'expired';
  public_token: string;
  pdf_url?: string;
  whatsapp_url?: string;
}