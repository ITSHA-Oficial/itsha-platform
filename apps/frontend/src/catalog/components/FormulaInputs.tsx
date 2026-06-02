import { useState } from 'react';

interface FormulaInputsProps {
  formulaVars: string[];
  onInputsChange: (inputs: Record<string, number>) => void;
}

export default function FormulaInputs({ formulaVars, onInputsChange }: FormulaInputsProps) {
  const [values, setValues] = useState<Record<string, string>>({});

  if (!formulaVars || formulaVars.length === 0) {
    return <p className="text-gray-400 text-sm">Este producto no tiene variables configurables.</p>;
  }

  const handleChange = (varName: string, rawValue: string) => {
    // Permitir solo números y punto decimal
    const cleanValue = rawValue.replace(/[^0-9.]/g, '');
    const newValues = { ...values, [varName]: cleanValue };
    setValues(newValues);

    // Convertir a números y notificar al padre
    const numValues: Record<string, number> = {};
    Object.entries(newValues).forEach(([key, val]) => {
      const num = parseFloat(val);
      if (!isNaN(num) && num >= 0) {
        numValues[key] = num;
      }
    });
    onInputsChange(numValues);
  };

  return (
    <div className="space-y-4">
      {formulaVars.map((varName) => (
        <div key={varName}>
          <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{varName}</label>
          <input
            type="text"
            inputMode="decimal"
            value={values[varName] || ''}
            onChange={(e) => handleChange(varName, e.target.value)}
            placeholder={`Ingresa ${varName}`}
            className="w-full px-4 py-3 rounded-lg border border-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent min-h-[48px]"
          />
        </div>
      ))}
    </div>
  );
}