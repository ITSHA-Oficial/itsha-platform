interface Feature {
  name: string;
  sort_order: number;
  attributes: { id: string; value: string; sort_order: number }[];
}

interface Variant {
  id: string;
  variant_signature: string;
  price: number;
  attributes: { feature_name: string; value: string }[];
}

interface SpecConfiguratorProps {
  features: Feature[];
  variants: Variant[];
  onOptionsChange: (options: Record<string, string>) => void;
}

export default function SpecConfigurator({ features, variants, onOptionsChange }: SpecConfiguratorProps) {
  if (!features || features.length === 0) {
    return <p className="text-gray-400 text-sm">Este producto no tiene opciones configurables.</p>;
  }

  const sortedFeatures = [...features].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <div className="space-y-4">
      {sortedFeatures.map((feature) => (
        <div key={feature.name}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{feature.name}</label>
          <div className="flex flex-wrap gap-2">
            {feature.attributes
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((attr) => (
                <button
                  key={attr.id}
                  onClick={() => {
                    const newOptions: Record<string, string> = {};
                    newOptions[feature.name] = attr.value;
                    onOptionsChange(newOptions);
                  }}
                  className="px-4 py-2 rounded-lg border border-gray-200 text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-600 transition-colors min-h-[48px]"
                >
                  {attr.value}
                </button>
              ))}
          </div>
        </div>
      ))}
    </div>
  );
}
