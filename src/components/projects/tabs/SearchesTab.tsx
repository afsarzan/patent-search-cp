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
import {
  deleteSavedSearch,
  triggerSavedSearchAlert,
  updateSavedSearchWatchFrequency,
} from '@/lib/projectRepository';

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

  const watchFrequencyMutation = useMutation({
    mutationFn: async (params: { searchId: number; watchFrequency: 'NONE' | 'DAILY' | 'WEEKLY' }) =>
      updateSavedSearchWatchFrequency(projectId, params.searchId, {
        watchFrequency: params.watchFrequency,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const triggerAlertMutation = useMutation({
    mutationFn: async (searchId: number) => triggerSavedSearchAlert(projectId, searchId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

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
              <TableHead>Watchlist</TableHead>
              <TableHead className="w-32 text-right">Actions</TableHead>
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
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{search.resultCount}</span>
                    {(search.newSinceLastRun || 0) > 0 && (
                      <Badge variant="default" className="text-[10px] uppercase tracking-wide">
                        +{search.newSinceLastRun} new
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  {new Date(search.runAt).toLocaleDateString()}
                </TableCell>
                <TableCell>
                  <div className="space-y-2">
                    <select
                      className="h-8 rounded border bg-background px-2 text-xs"
                      value={search.watchFrequency || 'NONE'}
                      onChange={(event) =>
                        watchFrequencyMutation.mutate({
                          searchId: search.id,
                          watchFrequency: event.target.value as 'NONE' | 'DAILY' | 'WEEKLY',
                        })
                      }
                    >
                      <option value="NONE">No alerts</option>
                      <option value="DAILY">Daily</option>
                      <option value="WEEKLY">Weekly</option>
                    </select>
                    {search.lastAlertRunAt && (
                      <p className="text-[11px] text-muted-foreground">
                        Last alert: {new Date(search.lastAlertRunAt).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                </TableCell>
                <TableCell className="flex justify-end gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-8 w-8 p-0"
                    onClick={() => triggerAlertMutation.mutate(search.id)}
                    disabled={triggerAlertMutation.isPending}
                    title="Run alert now"
                  >
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
