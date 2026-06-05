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
  selectedOptions: Record<string, string>;
  onOptionsChange: (options: Record<string, string>) => void;
}

export default function SpecConfigurator({ features, variants, selectedOptions, onOptionsChange }: SpecConfiguratorProps) {
  if (!features || features.length === 0) {
    return <p className="text-gray-400 text-sm">Este producto no tiene opciones configurables.</p>;
  }

  const sortedFeatures = [...features].sort((a, b) => a.sort_order - b.sort_order);

  const handleSelect = (featureName: string, value: string) => {
    const newOptions = { ...selectedOptions, [featureName]: value };
    onOptionsChange(newOptions);
  };

  return (
    <div className="space-y-4">
      {sortedFeatures.map((feature) => (
        <div key={feature.name}>
          <label className="block text-sm font-medium text-gray-700 mb-2">{feature.name}</label>
          <div className="flex flex-wrap gap-2">
            {feature.attributes
              .sort((a, b) => a.sort_order - b.sort_order)
              .map((attr) => {
                const isSelected = selectedOptions[feature.name] === attr.value;
                return (
                  <button
                    key={attr.id}
                    onClick={() => handleSelect(feature.name, attr.value)}
                    className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors min-h-[48px] ${
                      isSelected
                        ? 'bg-primary text-white border-primary'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-primary hover:text-primary'
                    }`}
                  >
                    {attr.value}
                  </button>
                );
              })}
          </div>
        </div>
      ))}
    </div>
  );
}