import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PatentLegalStatus } from '@/types/projects';

export interface PatentDetailData {
  patentNumber?: string;
  title: string;
  assignee: string;
  abstract: string;
  filingDate: string;
  grantDate: string;
  provider: string;
  url?: string;
  legalStatus?: PatentLegalStatus;
  independentClaims?: string[];
  dependentClaimsSummary?: string;
}

interface PatentDetailModalProps {
  patent: PatentDetailData | null;
  isOpen: boolean;
  onClose: () => void;
  highlightTerms?: string[];
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function highlightText(text: string, highlightTerms: string[]) {
  const filteredTerms = Array.from(
    new Set(highlightTerms.map((term) => term.trim()).filter((term) => term.length > 1))
  );

  if (filteredTerms.length === 0) {
    return text;
  }

  const splitPattern = new RegExp(`(${filteredTerms.map(escapeRegExp).join('|')})`, 'ig');
  const testPattern = new RegExp(`(${filteredTerms.map(escapeRegExp).join('|')})`, 'i');
  const parts = text.split(splitPattern);

  return parts.map((part, index) =>
    testPattern.test(part) ? (
      <mark key={`${part}-${index}`} className="rounded bg-amber-200 px-0.5 text-foreground">
        {part}
      </mark>
    ) : (
      <span key={`${part}-${index}`}>{part}</span>
    )
  );
}

export function extractHighlightTerms(query: string | undefined) {
  if (!query) return [];

  return query
    .split(/[^A-Za-z0-9_:+.-]+/)
    .map((term) => term.trim())
    .filter((term) => {
      if (!term) return false;
      const normalized = term.toUpperCase();
      return normalized !== 'AND' && normalized !== 'OR' && normalized !== 'NOT';
    })
    .map((term) => term.includes(':') ? term.split(':').slice(1).join(':') : term)
    .filter(Boolean);
}

function renderClaimList(claims: string[], highlightTerms: string[]) {
  return (
    <ol className="space-y-3 list-decimal pl-5">
      {claims.map((claim, index) => (
        <li key={`${index}-${claim}`} className="text-sm leading-6 text-foreground">
          {highlightText(claim, highlightTerms)}
        </li>
      ))}
    </ol>
  );
}

export function PatentDetailModal({ patent, isOpen, onClose, highlightTerms = [] }: PatentDetailModalProps) {
  const legalStatusLabel: Record<PatentLegalStatus, string> = {
    PENDING: 'Pending',
    GRANTED: 'Granted',
    EXPIRED: 'Expired',
    LAPSED: 'Lapsed',
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex flex-wrap items-center gap-2">
            <span>{patent?.patentNumber || 'Patent details'}</span>
            {patent?.legalStatus && (
              <Badge variant={patent.legalStatus === 'GRANTED' ? 'default' : patent.legalStatus === 'PENDING' ? 'secondary' : 'destructive'}>
                {legalStatusLabel[patent.legalStatus]}
              </Badge>
            )}
          </DialogTitle>
          <DialogDescription>
            Independent claims and dependent claim summary for research review.
          </DialogDescription>
        </DialogHeader>

        {patent && (
          <ScrollArea className="max-h-[70vh] pr-4">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Title</p>
                  <p className="font-medium text-foreground">{patent.title}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Assignee</p>
                  <p className="font-medium text-foreground">{patent.assignee}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Filing date</p>
                  <p className="text-sm text-foreground">{patent.filingDate}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-wide text-muted-foreground">Grant date</p>
                  <p className="text-sm text-foreground">{patent.grantDate}</p>
                </div>
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Abstract</p>
                <p className="text-sm leading-6 text-muted-foreground">{patent.abstract}</p>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">Independent claims</p>
                    <p className="text-sm text-muted-foreground">
                      Claim terms highlighted from your current search.
                    </p>
                  </div>
                  {highlightTerms.length > 0 && (
                    <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                      Highlighting {highlightTerms.length} term{highlightTerms.length === 1 ? '' : 's'}
                    </Badge>
                  )}
                </div>

                {patent.independentClaims && patent.independentClaims.length > 0 ? (
                  renderClaimList(patent.independentClaims, highlightTerms)
                ) : (
                  <p className="rounded-lg border border-dashed p-4 text-sm text-muted-foreground">
                    No independent claims are available in the mock dataset for this patent yet.
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">Dependent claims summary</p>
                {patent.dependentClaimsSummary ? (
                  <p className="text-sm leading-6 text-foreground">{highlightText(patent.dependentClaimsSummary, highlightTerms)}</p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    No dependent claim summary is available in the mock dataset for this patent yet.
                  </p>
                )}
              </div>

              {patent.url && (
                <div className="pt-2">
                  <a
                    href={patent.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm font-medium text-primary hover:underline"
                  >
                    Open source record
                  </a>
                </div>
              )}
            </div>
          </ScrollArea>
        )}
      </DialogContent>
    </Dialog>
  );
}