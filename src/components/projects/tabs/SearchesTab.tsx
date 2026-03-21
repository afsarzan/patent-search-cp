import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Trash2, Play, BarChart3 } from 'lucide-react';
import { SavedSearch } from '@/types/projects';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { deleteSavedSearch } from '@/lib/projectRepository';

interface SearchesTabProps {
  projectId: number;
  searches: SavedSearch[];
  selectedSearchIds: number[];
  onSelectSearch: (id: number) => void;
  onCompare: (searchIds: number[]) => void;
}

export const SearchesTab = ({
  projectId,
  searches,
  selectedSearchIds,
  onSelectSearch,
  onCompare,
}: SearchesTabProps) => {
  const queryClient = useQueryClient();
  const deleteSearchMutation = useMutation({
    mutationFn: async (searchId: number) => deleteSavedSearch(projectId, searchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  if (searches.length === 0) {
    return (
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <p className="text-muted-foreground mb-4">No searches saved yet.</p>
          <p className="text-sm text-muted-foreground">
            Run a search from the main page and save it to this project.
          </p>
        </CardContent>
      </Card>
    );
  }

  const allSelected = searches.length > 0 && selectedSearchIds.length === searches.length;

  return (
    <div className="space-y-4">
      {selectedSearchIds.length > 0 && (
        <Button
          className="gap-2"
          onClick={() => onCompare(selectedSearchIds)}
          disabled={selectedSearchIds.length < 2}
        >
          <BarChart3 className="h-4 w-4" />
          Compare {selectedSearchIds.length} Searches
        </Button>
      )}

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="w-12">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={(checked) => {
                    if (checked === true) {
                      searches.forEach((s) => onSelectSearch(s.id));
                    } else {
                      selectedSearchIds.forEach((id) => onSelectSearch(id));
                    }
                  }}
                />
              </TableHead>
              <TableHead>Query</TableHead>
              <TableHead>Providers</TableHead>
              <TableHead>Results</TableHead>
              <TableHead>Run Date</TableHead>
              <TableHead className="w-24 text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {searches.map((search) => (
              <TableRow key={search.id}>
                <TableCell>
                  <Checkbox
                    checked={selectedSearchIds.includes(search.id)}
                    onChange={() => onSelectSearch(search.id)}
                  />
                </TableCell>
                <TableCell>
                  <div>
                    <p className="font-medium">{search.queryString}</p>
                    {search.notes && (
                      <p className="text-xs text-muted-foreground mt-1">
                        {search.notes}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    {search.providers.map((provider) => (
                      <Badge key={provider} variant="secondary" className="text-xs">
                        {provider}
                      </Badge>
                    ))}
                  </div>
                </TableCell>
                <TableCell>
                  <span className="font-medium">{search.resultCount}</span>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(search.runAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button size="sm" variant="ghost" className="h-8 w-8 p-0">
                    <Play className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700"
                    onClick={() => deleteSearchMutation.mutate(search.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
