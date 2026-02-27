import { PatentProvider, PROVIDERS } from '@/lib/patentApi';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Globe, Building2, Scale, Search } from 'lucide-react';

interface ProviderSelectorProps {
  selectedProvider: PatentProvider;
  onProviderChange: (provider: PatentProvider) => void;
}

const providerIcons: Record<PatentProvider, React.ReactNode> = {
  'USPTO': <Building2 className="h-4 w-4" />,
  'EPO': <Scale className="h-4 w-4" />,
  'WIPO': <Globe className="h-4 w-4" />,
  'Google Patents': <Search className="h-4 w-4" />
};

export function ProviderSelector({ selectedProvider, onProviderChange }: ProviderSelectorProps) {
  return (
    <div className="w-full max-w-3xl mx-auto mb-6">
      <Tabs value={selectedProvider} onValueChange={(value) => onProviderChange(value as PatentProvider)}>
        <TabsList className="grid w-full grid-cols-4 h-auto">
          {PROVIDERS.map((provider) => (
            <TabsTrigger 
              key={provider.id} 
              value={provider.id}
              className="flex flex-col items-center gap-1 py-3 px-2 data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
            >
              <div className="flex items-center gap-2">
                {providerIcons[provider.id]}
                <span className="font-semibold text-sm">{provider.name}</span>
              </div>
              <span className="text-xs opacity-80 whitespace-nowrap">{provider.region}</span>
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
      <div className="mt-2 text-center">
        <p className="text-xs text-muted-foreground">
          {PROVIDERS.find(p => p.id === selectedProvider)?.description}
        </p>
      </div>
    </div>
  );
}
