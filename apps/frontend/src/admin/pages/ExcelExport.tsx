import { API_URL, TENANT_SLUG } from '../../catalog/utils/api';

export default function ExcelExport() {
  const handleDownload = () => {
    window.open(`${API_URL}/api/v1/excel/export?slug=${TENANT_SLUG}`, '_blank');
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