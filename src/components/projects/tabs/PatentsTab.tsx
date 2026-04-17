import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trash2, ExternalLink, CheckCheck } from 'lucide-react';
import { PatentReference, Collection, PatentReviewStatus, PatentLegalStatus } from '@/types/projects';
import {
  bulkUpdatePatentReviewStatus,
  deletePinnedPatent,
  updatePatentReviewStatus,
} from '@/lib/projectRepository';

interface PatentsTabProps {
  projectId: number;
  patents: PatentReference[];
  collections: Collection[];
}

const REVIEW_STATUS_OPTIONS: Array<{ value: PatentReviewStatus; label: string }> = [
  { value: 'TO_REVIEW', label: 'To Review' },
  { value: 'RELEVANT', label: 'Relevant' },
  { value: 'KEY_PRIOR_ART', label: 'Key Prior Art' },
  { value: 'EXCLUDED', label: 'Excluded' },
];

const STATUS_BADGE_VARIANT: Record<PatentReviewStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  TO_REVIEW: 'secondary',
  RELEVANT: 'default',
  KEY_PRIOR_ART: 'outline',
  EXCLUDED: 'destructive',
};

const LEGAL_STATUS_LABEL: Record<PatentLegalStatus, string> = {
  PENDING: 'Pending',
  GRANTED: 'Granted',
  EXPIRED: 'Expired',
  LAPSED: 'Lapsed',
};

const LEGAL_STATUS_VARIANT: Record<PatentLegalStatus, 'secondary' | 'default' | 'outline' | 'destructive'> = {
  PENDING: 'secondary',
  GRANTED: 'default',
  EXPIRED: 'destructive',
  LAPSED: 'outline',
};

function getRiskLabel(status?: PatentLegalStatus) {
  if (status === 'PENDING') return 'Pending review';
  if (status === 'EXPIRED' || status === 'LAPSED') return 'Higher risk';
  return 'Lower risk';
}

function getStatusLabel(status: PatentReviewStatus) {
  return REVIEW_STATUS_OPTIONS.find((option) => option.value === status)?.label || status;
}

export const PatentsTab = ({
  projectId,
  patents,
  collections,
}: PatentsTabProps) => {
  const queryClient = useQueryClient();
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'ALL' | PatentReviewStatus>('ALL');
  const [selectedPatentIds, setSelectedPatentIds] = useState<number[]>([]);
  const [bulkStatus, setBulkStatus] = useState<PatentReviewStatus>('TO_REVIEW');
  const [bulkStatusReason, setBulkStatusReason] = useState('');
  const [statusDraftByPatent, setStatusDraftByPatent] = useState<Record<number, PatentReviewStatus>>({});
  const [reasonDraftByPatent, setReasonDraftByPatent] = useState<Record<number, string>>({});

  const deletePatentMutation = useMutation({
    mutationFn: async (patentRefId: number) => deletePinnedPatent(projectId, patentRefId),
    onMutate: async (patentRefId: number) => {
      setSelectedPatentIds((prev) => prev.filter((id) => id !== patentRefId));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async (params: {
      patentReferenceId: number;
      status: PatentReviewStatus;
      statusReason?: string;
    }) => updatePatentReviewStatus(projectId, params.patentReferenceId, params),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const bulkUpdateStatusMutation = useMutation({
    mutationFn: async (params: {
      patentReferenceIds: number[];
      status: PatentReviewStatus;
      statusReason?: string;
    }) => bulkUpdatePatentReviewStatus(projectId, params),
    onSuccess: () => {
      setSelectedPatentIds([]);
      setBulkStatusReason('');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    },
  });

  const statusCounts = useMemo(() => {
    const patentsInScope = selectedCollection
      ? patents.filter((patent) => patent.collectionIds?.includes(selectedCollection))
      : patents;

    return patentsInScope.reduce(
      (acc, patent) => {
        acc.ALL += 1;
        acc[patent.status] += 1;
        return acc;
      },
      {
        ALL: 0,
        TO_REVIEW: 0,
        RELEVANT: 0,
        KEY_PRIOR_ART: 0,
        EXCLUDED: 0,
      } as Record<'ALL' | PatentReviewStatus, number>
    );
  }, [patents, selectedCollection]);

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

  const filteredPatents = patents.filter((patent) => {
    const matchesCollection = selectedCollection
      ? patent.collectionIds?.includes(selectedCollection)
      : true;
    const matchesStatus = selectedStatusFilter === 'ALL' || patent.status === selectedStatusFilter;
    return matchesCollection && matchesStatus;
  });

  const filteredPatentIds = filteredPatents.map((patent) => patent.id);
  const allFilteredSelected =
    filteredPatentIds.length > 0 && filteredPatentIds.every((id) => selectedPatentIds.includes(id));

  const togglePatentSelection = (patentId: number) => {
    setSelectedPatentIds((prev) =>
      prev.includes(patentId) ? prev.filter((id) => id !== patentId) : [...prev, patentId]
    );
  };

  const handleSelectAllFiltered = (checked: boolean) => {
    if (!checked) {
      setSelectedPatentIds((prev) => prev.filter((id) => !filteredPatentIds.includes(id)));
      return;
    }

    setSelectedPatentIds((prev) => {
      const next = new Set(prev);
      filteredPatentIds.forEach((id) => next.add(id));
      return Array.from(next);
    });
  };

  return (
    <div className="space-y-6">
      <Tabs
        value={selectedStatusFilter}
        onValueChange={(value) => setSelectedStatusFilter(value as 'ALL' | PatentReviewStatus)}
      >
        <TabsList className="w-full flex-wrap h-auto">
          <TabsTrigger value="ALL">All ({statusCounts.ALL})</TabsTrigger>
          <TabsTrigger value="TO_REVIEW">To Review ({statusCounts.TO_REVIEW})</TabsTrigger>
          <TabsTrigger value="RELEVANT">Relevant ({statusCounts.RELEVANT})</TabsTrigger>
          <TabsTrigger value="KEY_PRIOR_ART">Key Prior Art ({statusCounts.KEY_PRIOR_ART})</TabsTrigger>
          <TabsTrigger value="EXCLUDED">Excluded ({statusCounts.EXCLUDED})</TabsTrigger>
        </TabsList>
      </Tabs>

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

      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <Checkbox
                checked={allFilteredSelected}
                onCheckedChange={(checked) => handleSelectAllFiltered(checked === true)}
              />
              <Label className="text-sm text-muted-foreground">
                Select all visible ({filteredPatents.length})
              </Label>
            </div>
            <Badge variant="secondary">Selected {selectedPatentIds.length}</Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-[220px_1fr_auto] gap-3 items-end">
            <div className="space-y-2">
              <Label>Bulk status</Label>
              <Select value={bulkStatus} onValueChange={(value) => setBulkStatus(value as PatentReviewStatus)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {REVIEW_STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="bulk-status-reason">Rationale note (optional)</Label>
              <Textarea
                id="bulk-status-reason"
                value={bulkStatusReason}
                onChange={(event) => setBulkStatusReason(event.target.value)}
                placeholder="Add context for this triage decision..."
                rows={2}
              />
            </div>

            <Button
              className="gap-2"
              disabled={selectedPatentIds.length === 0 || bulkUpdateStatusMutation.isPending}
              onClick={() =>
                bulkUpdateStatusMutation.mutate({
                  patentReferenceIds: selectedPatentIds,
                  status: bulkStatus,
                  statusReason: bulkStatusReason || undefined,
                })
              }
            >
              <CheckCheck className="h-4 w-4" />
              Apply To Selected
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Patents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPatents.map((patent) => (
          <Card key={patent.id} className="hover:shadow-lg transition-shadow">
            <CardContent className="pt-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      checked={selectedPatentIds.includes(patent.id)}
                      onCheckedChange={() => togglePatentSelection(patent.id)}
                    />
                    <span className="text-xs text-muted-foreground">Select</span>
                  </div>
                  <Badge variant={STATUS_BADGE_VARIANT[patent.status]} className="text-xs">
                    {getStatusLabel(patent.status)}
                  </Badge>
                </div>

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
                  <Badge variant={LEGAL_STATUS_VARIANT[patent.patentData.legalStatus || 'GRANTED']} className="text-xs">
                    {LEGAL_STATUS_LABEL[patent.patentData.legalStatus || 'GRANTED']}
                  </Badge>
                </div>

                <p className="text-xs text-muted-foreground">Risk signal: {getRiskLabel(patent.patentData.legalStatus)}</p>

                {patent.notes && (
                  <div className="bg-muted p-2 rounded text-xs">
                    <p className="text-muted-foreground">{patent.notes}</p>
                  </div>
                )}

                {patent.statusReason && (
                  <div className="bg-muted p-2 rounded text-xs">
                    <p className="text-muted-foreground">Status note: {patent.statusReason}</p>
                  </div>
                )}

                <div className="space-y-2 rounded border p-3">
                  <Label className="text-xs">Update review status</Label>
                  <Select
                    value={statusDraftByPatent[patent.id] || patent.status}
                    onValueChange={(value) =>
                      setStatusDraftByPatent((prev) => ({
                        ...prev,
                        [patent.id]: value as PatentReviewStatus,
                      }))
                    }
                  >
                    <SelectTrigger className="h-9">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {REVIEW_STATUS_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Textarea
                    value={reasonDraftByPatent[patent.id] ?? patent.statusReason ?? ''}
                    onChange={(event) =>
                      setReasonDraftByPatent((prev) => ({
                        ...prev,
                        [patent.id]: event.target.value,
                      }))
                    }
                    placeholder="Optional rationale note"
                    rows={2}
                  />

                  <Button
                    size="sm"
                    className="w-full"
                    disabled={updateStatusMutation.isPending}
                    onClick={() =>
                      updateStatusMutation.mutate({
                        patentReferenceId: patent.id,
                        status: statusDraftByPatent[patent.id] || patent.status,
                        statusReason: (reasonDraftByPatent[patent.id] ?? patent.statusReason ?? '') || undefined,
                      })
                    }
                  >
                    Save Status
                  </Button>
                </div>

                <div className="flex gap-2 pt-2">
                  <Button
                    size="sm"
                    variant="outline"
                    className="flex-1 gap-1 h-8"
                    asChild
                  >
                    <a
                      href={patent.patentData.url || `https://patents.google.com/patent/${patent.patentId}`}
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

      {filteredPatents.length === 0 && (
        <Card className="border-dashed">
          <CardContent className="py-10 text-center text-sm text-muted-foreground">
            No patents match the selected collection and status filters.
          </CardContent>
        </Card>
      )}
    </div>
  );
};
