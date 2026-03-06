import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Trash2, ExternalLink } from 'lucide-react';
import { PatentReference, Collection } from '@/types/projects';
import { deletePinnedPatent } from '@/lib/projectRepository';

interface PatentsTabProps {
  projectId: number;
  patents: PatentReference[];
  collections: Collection[];
}

export const PatentsTab = ({
  projectId,
  patents,
  collections,
}: PatentsTabProps) => {
  const queryClient = useQueryClient();
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);

  const deletePatentMutation = useMutation({
    mutationFn: async (patentRefId: number) => deletePinnedPatent(projectId, patentRefId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  if (patents.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No patents pinned yet.</p>
          <p className="text-sm text-muted-foreground">
            Pin patents from search results to organize them by collection.
          </p>
        </CardContent>
      </Card>
    );
  }

  const filteredPatents = selectedCollection
    ? patents.filter((p) => p.collectionIds?.includes(selectedCollection))
    : patents;

  return (
    <div className="space-y-6">
      {/* Collections Sidebar */}
      {collections.length > 0 && (
        <div className="flex gap-2">
          <Button
            variant={selectedCollection === null ? 'default' : 'outline'}
            onClick={() => setSelectedCollection(null)}
          >
            All Patents ({patents.length})
          </Button>
          {collections.map((collection) => (
            <Button
              key={collection.id}
              variant={selectedCollection === collection.id ? 'default' : 'outline'}
              onClick={() => setSelectedCollection(collection.id)}
            >
              {collection.name}
            </Button>
          ))}
        </div>
      )}

      {/* Patents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatents.map((patent) => (
          <Card key={patent.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div>
                  <h3 className="font-semibold line-clamp-2 text-foreground">
                    {patent.patentData.title}
                  </h3>
                  <p className="text-sm text-muted-foreground mt-1">
                    {patent.patentData.assignee}
                  </p>
                </div>

                <p className="text-xs text-muted-foreground line-clamp-2">
                  {patent.patentData.abstract}
                </p>

                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {patent.patentData.provider}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {patent.patentData.filingDate}
                  </Badge>
                </div>

                {patent.notes && (
                  <div className="bg-muted p-2 rounded text-xs">
                    <p className="text-muted-foreground">{patent.notes}</p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1 h-8"
                    asChild
                  >
                    <a
                      href={`https://patents.google.com/patent/${patent.patentId}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <ExternalLink className="h-3 w-3" />
                      View
                    </a>
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600"
                    onClick={() => deletePatentMutation.mutate(patent.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};
