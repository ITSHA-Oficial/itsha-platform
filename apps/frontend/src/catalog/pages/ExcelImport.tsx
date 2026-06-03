import { useState, FormEvent } from 'react';
import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

export default function ExcelImport() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [diff, setDiff] = useState<any>(null);
  const [importId, setImportId] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<string | null>(null);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (!file) return;

    setUploading(true);
    setError(null);
    setDiff(null);
    setImportId(null);
    setResult(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await fetch(`${API_URL}/api/v1/excel/import`, {
        method: 'POST',
        headers: { 'X-Tenant-Slug': TENANT_SLUG },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || 'Error al procesar el archivo.');
      }

      const data = await res.json();
      setDiff(data.diff);
      setImportId(data.import_id);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setUploading(false);
    }
  };

  const handleConfirm = async () => {
    if (!importId) return;

    setConfirming(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch(`${API_URL}/api/v1/excel/confirm/${importId}`, {
        method: 'POST',
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err?.error?.message || 'Error al confirmar la importación.');
      }

      const data = await res.json();
      setResult(data.message);
      setDiff(null);
      setImportId(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setConfirming(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Importar Excel</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selecciona el archivo Excel (.xlsx)
            </label>
            <input
              type="file"
              accept=".xlsx,.xls"
              onChange={e => setFile(e.target.files?.[0] || null)}
              className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
            <p className="text-xs text-gray-400 mt-1">Máximo 1,000 productos. Tamaño máximo del archivo: 10 MB.</p>
          </div>

          <button
            type="submit"
            disabled={!file || uploading}
            className="w-full bg-blue-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {uploading ? 'Procesando...' : 'Subir y previsualizar'}
          </button>
        </form>

        {error && (
          <div className="mt-4 px-4 py-2 bg-red-50 text-red-600 rounded-lg text-sm">{error}</div>
        )}

        {result && (
          <div className="mt-4 px-4 py-2 bg-green-50 text-green-600 rounded-lg text-sm">{result}</div>
        )}

        {diff && (
          <div className="mt-6 space-y-4">
            <h3 className="font-semibold text-gray-800">Resultado de la previsualización</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-xl p-4">
                <p className="text-sm text-green-700">Productos nuevos</p>
                <p className="text-2xl font-bold text-green-800">{diff.products_added?.length || 0}</p>
                <ul className="mt-2 text-xs text-green-600">
                  {(diff.products_added || []).slice(0, 5).map((name: string, i: number) => (
                    <li key={i}>+ {name}</li>
                  ))}
                  {(diff.products_added?.length || 0) > 5 && <li>... y {diff.products_added.length - 5} más</li>}
                </ul>
              </div>

              <div className="bg-yellow-50 rounded-xl p-4">
                <p className="text-sm text-yellow-700">Productos modificados</p>
                <p className="text-2xl font-bold text-yellow-800">{diff.products_updated?.length || 0}</p>
              </div>

              <div className="bg-blue-50 rounded-xl p-4">
                <p className="text-sm text-blue-700">Variantes nuevas</p>
                <p className="text-2xl font-bold text-blue-800">{diff.variants_added || 0}</p>
              </div>

              <div className="bg-purple-50 rounded-xl p-4">
                <p className="text-sm text-purple-700">Características</p>
                <p className="text-2xl font-bold text-purple-800">{diff.features_count || 0}</p>
              </div>
            </div>

            <button
              onClick={handleConfirm}
              disabled={confirming}
              className="w-full bg-green-600 text-white py-2 rounded-lg text-sm font-medium hover:bg-green-700 disabled:opacity-50"
            >
              {confirming ? 'Aplicando cambios...' : 'Confirmar importación'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
