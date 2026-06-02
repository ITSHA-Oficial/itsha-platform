import { Router, Request, Response } from 'express';
import { getSupabaseClient } from '../db/supabase';
import { parse, evaluate } from 'mathjs';

const router = Router();

const ALLOWED_NODES = ['SymbolNode', 'ConstantNode', 'OperatorNode', 'FunctionNode', 'ParenthesisNode'];
const ALLOWED_FUNCTIONS = ['add', 'subtract', 'multiply', 'divide', 'pow', 'sqrt'];

function validateAST(expression: string): void {
  try {
    const node = parse(expression);
    node.traverse((node: any) => {
      if (!ALLOWED_NODES.includes(node.type)) {
        throw new Error(`Nodo no permitido: ${node.type}`);
      }
      if (node.type === 'FunctionNode' && !ALLOWED_FUNCTIONS.includes(node.name)) {
        throw new Error(`Función no permitida: ${node.name}`);
      }
    });
  } catch (err: any) {
    if (err.message.includes('Nodo no permitido') || err.message.includes('Función no permitida')) {
      throw err;
    }
    throw new Error('La fórmula tiene un error de sintaxis.');
  }
}

router.post('/', async (req: Request, res: Response) => {
  try {
    const tenantSlug = req.headers['x-tenant-slug'] as string;
    if (!tenantSlug) {
      return res.status(400).json({
        error: { code: 'MISSING_TENANT_SLUG', message: 'Se requiere el header X-Tenant-Slug.' }
      });
    }

    const supabase = getSupabaseClient();

    const { data: tenant, error: tenantError } = await supabase
      .from('tenants')
      .select('id')
      .eq('slug', tenantSlug)
      .eq('active', true)
      .single();

    if (tenantError || !tenant) {
      return res.status(404).json({
        error: { code: 'TENANT_NOT_FOUND', message: 'El tenant no existe o está inactivo.' }
      });
    }

    const { product_id, formula_inputs } = req.body;
    if (!product_id || !formula_inputs || typeof formula_inputs !== 'object') {
      return res.status(400).json({
        error: { code: 'VALIDATION_ERROR', message: 'Se requieren product_id y formula_inputs.' }
      });
    }

    const { data: product, error: productError } = await supabase
      .from('products')
      .select('pricing_mode, price_formula, formula_vars')
      .eq('id', product_id)
      .eq('tenant_id', tenant.id)
      .is('deleted_at', null)
      .single();

    if (productError || !product) {
      return res.status(404).json({
        error: { code: 'PRODUCT_NOT_FOUND', message: 'Producto no encontrado.' }
      });
    }

    if (product.pricing_mode !== 'dynamic_formula' || !product.price_formula) {
      return res.status(400).json({
        error: { code: 'INVALID_PRICING_MODE', message: 'Este producto no usa fórmula dinámica.' }
      });
    }

    if (product.formula_vars) {
      const validVars: string[] = Array.isArray(product.formula_vars) ? product.formula_vars : [];
      const inputKeys = Object.keys(formula_inputs);
      const invalidKeys = inputKeys.filter(k => !validVars.includes(k));

      if (invalidKeys.length > 0) {
        return res.status(422).json({
          error: {
            code: 'INVALID_FORMULA_INPUTS',
            message: `Variables no reconocidas: ${invalidKeys.join(', ')}`
          }
        });
      }
    }

    try {
      validateAST(product.price_formula);
    } catch (astError: any) {
      return res.status(422).json({
        error: { code: 'FORMULA_INVALID', message: astError.message }
      });
    }

    let result: number;
    try {
      result = evaluate(product.price_formula, formula_inputs);
      if (typeof result !== 'number' || !isFinite(result) || result < 0) {
        throw new Error('Resultado inválido');
      }
      if (result > 1e12) {
        throw new Error('Resultado excede el máximo permitido');
      }
    } catch (evalError: any) {
      return res.status(422).json({
        error: { code: 'FORMULA_EVALUATION_ERROR', message: evalError.message || 'Error al evaluar la fórmula.' }
      });
    }

    return res.json({
      unit_price: Math.round(result * 100) / 100,
      total_price: Math.round(result * 100) / 100
    });

  } catch (err: any) {
    console.error('Error en POST /price/calculate:', err);
    return res.status(500).json({
      error: { code: 'INTERNAL_ERROR', message: 'Error interno del servidor.' }
    });
  }
});

export default router;