import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { SearchComparisonResponse } from '@/types/projects';
import { FilingTrendsChart } from '@/components/charts/FilingTrendsChart';
import { AssigneeDistributionChart } from '@/components/charts/AssigneeDistributionChart';
import { compareSavedSearches } from '@/lib/projectRepository';

interface SearchComparisonViewProps {
  projectId: number;
  searchIds: number[];
  onBack: () => void;
}

export const SearchComparisonView = ({
  projectId,
  searchIds,
  onBack,
}: SearchComparisonViewProps) => {
  const { data: comparisonData, isLoading } = useQuery({
    queryKey: ['comparison', projectId, searchIds],
    queryFn: () => compareSavedSearches(projectId, searchIds),
    enabled: searchIds.length > 0,
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!comparisonData || !comparisonData.searches) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <p className="text-muted-foreground">No comparison data available</p>
        </CardContent>
      </Card>
    );
  }

  const { searches, mergedTimeline, assigneeComparison, overlap, statistics } =
    comparisonData;

  const searchLabels = searches.reduce(
    (acc, search) => {
      acc[String(search.id)] = `${search.queryString} (${search.resultCount})`;
      return acc;
    },
    {} as Record<string, string>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-4 gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Back
        </Button>
        <h1 className="text-3xl font-bold text-foreground mb-2">
          Comparing {searches.length} Searches
        </h1>
      </div>

      {/* Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {searches.map((search) => (
          <Card key={search.id}>
            <CardContent className="pt-6">
              <h3 className="font-semibold text-sm mb-4 line-clamp-2">
                {search.queryString}
              </h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-muted-foreground">Results</span>
                  <span className="font-medium">{search.resultCount.toLocaleString()}</span>
                </div>
                {search.earliestFilingYear && search.latestFilingYear && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Year Range</span>
                    <span className="font-medium text-sm">
                      {search.earliestFilingYear}–{search.latestFilingYear}
                    </span>
                  </div>
                )}
                {statistics[String(search.id)] && (
                  <div className="flex justify-between">
                    <span className="text-sm text-muted-foreground">Avg Year</span>
                    <span className="font-medium">
                      {Math.round(statistics[String(search.id)].avgFilingYear)}
                    </span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filing Trends */}
      {mergedTimeline && mergedTimeline.length > 0 && (
        <FilingTrendsChart
          timeline={mergedTimeline}
          searchLabels={searchLabels}
        />
      )}

      {/* Assignee Distribution */}
      {assigneeComparison && assigneeComparison.length > 0 && (
        <AssigneeDistributionChart
          assignees={assigneeComparison}
          searchLabels={searchLabels}
          topN={15}
        />
      )}

      {/* Overlap Summary */}
      <Card>
        <CardContent className="pt-6">
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Overlap Analysis
          </h3>
          <div className="space-y-4">
            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Shared Assignees ({overlap.sharedAssignees.length})
              </p>
              {overlap.sharedAssignees.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {overlap.sharedAssignees.slice(0, 8).map((assignee) => (
                    <Badge key={assignee} variant="secondary">
                      {assignee}
                    </Badge>
                  ))}
                  {overlap.sharedAssignees.length > 8 && (
                    <Badge variant="outline">
                      +{overlap.sharedAssignees.length - 8} more
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No shared assignees</p>
              )}
            </div>

            <div>
              <p className="text-sm font-medium text-foreground mb-2">
                Shared Technology Classes ({overlap.sharedCpcClasses.length})
              </p>
              {overlap.sharedCpcClasses.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {overlap.sharedCpcClasses.slice(0, 10).map((cpc) => (
                    <Badge key={cpc} variant="secondary">
                      {cpc}
                    </Badge>
                  ))}
                  {overlap.sharedCpcClasses.length > 10 && (
                    <Badge variant="outline">
                      +{overlap.sharedCpcClasses.length - 10} more
                    </Badge>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No shared CPC classes</p>
              )}
            </div>

            <div className="pt-2 border-t">
              <p className="text-sm text-muted-foreground">
                Estimated Overlap:{' '}
                <span className="font-semibold text-foreground">
                  {overlap.estimatedOverlapPercentage}%
                </span>
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
