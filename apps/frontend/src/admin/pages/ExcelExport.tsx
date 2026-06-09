import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

export default function ExcelExport() {
  const handleDownload = async () => {
    try {
      const res = await fetch(`${API_URL}/api/v1/excel/export`, {
        headers: { 'X-Tenant-Slug': TENANT_SLUG }
      });
      if (!res.ok) throw new Error('Error al descargar');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'catalogo_maestro.xlsx';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Error al descargar el Excel. Verifica que el backend esté corriendo.');
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Exportar Excel</h1>

      <div className="bg-white rounded-2xl shadow-sm p-6 max-w-lg">
        <p className="text-gray-500 mb-4">
          Descarga el catálogo completo en formato Excel con 5 hojas: Products, Features, Attributes, Variants y Formulas.
        </p>
        <p className="text-sm text-gray-400 mb-6">
          El archivo incluye todos los productos activos del catálogo. Los productos eliminados (soft delete) no se incluyen.
        </p>
        <button
          onClick={handleDownload}
          className="w-full bg-green-600 text-white py-3 rounded-xl font-semibold hover:bg-green-700 transition-colors"
        >
          Descargar Excel Maestro
        </button>
      </div>
    </div>
  );
}