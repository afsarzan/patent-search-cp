import { useMemo, useState } from 'react';
import { Patent, getPatentFamilyId } from '@/lib/patentApi';
import { ExternalLink, Users, Building2, Calendar, Pin, ChevronDown, ChevronRight, GitBranch, ShieldAlert } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { PinPatentModal } from '@/components/projects/PinPatentModal';
import { PatentLegalStatus } from '@/types/projects';

interface PatentTableProps {
  patents: Patent[];
  total: number;
}

type PatentTableViewMode = 'flat' | 'family';

interface FamilyGroup {
  familyId: string;
  patents: Patent[];
  representative: Patent;
}

export function PatentTable({ patents, total }: PatentTableProps) {
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);
  const [viewMode, setViewMode] = useState<PatentTableViewMode>('flat');
  const [expandedFamilies, setExpandedFamilies] = useState<Record<string, boolean>>({});

  const familyGroups = useMemo<FamilyGroup[]>(() => {
    const groups = new Map<string, Patent[]>();

    patents.forEach((patent) => {
      const familyId = getPatentFamilyId(patent);
      const family = groups.get(familyId) || [];
      family.push(patent);
      groups.set(familyId, family);
    });

    return Array.from(groups.entries())
      .map(([familyId, members]) => {
        const representative =
          members.find((member) => member.isFamilyRepresentative) ||
          members.slice().sort((a, b) => a.filingDate.localeCompare(b.filingDate))[0];

        const sortedMembers = members.slice().sort((a, b) => {
          if (a.id === representative.id) return -1;
          if (b.id === representative.id) return 1;
          if (a.grantDate !== b.grantDate) {
            return a.grantDate > b.grantDate ? -1 : 1;
          }
          return a.patentNumber.localeCompare(b.patentNumber);
        });

        return {
          familyId,
          patents: sortedMembers,
          representative,
        };
      })
      .sort((a, b) => {
        if (a.patents.length !== b.patents.length) {
          return b.patents.length - a.patents.length;
        }
        if (a.representative.grantDate !== b.representative.grantDate) {
          return a.representative.grantDate > b.representative.grantDate ? -1 : 1;
        }
        return a.familyId.localeCompare(b.familyId);
      });
  }, [patents]);

  if (patents.length === 0) {
    return null;
  }

  const legalStatusLabel: Record<PatentLegalStatus, string> = {
    PENDING: 'Pending',
    GRANTED: 'Granted',
    EXPIRED: 'Expired',
    LAPSED: 'Lapsed',
  };

  const legalStatusVariant: Record<PatentLegalStatus, 'secondary' | 'default' | 'destructive' | 'outline'> = {
    PENDING: 'secondary',
    GRANTED: 'default',
    EXPIRED: 'destructive',
    LAPSED: 'outline',
  };

  const getRiskTone = (status?: PatentLegalStatus) => {
    if (status === 'PENDING') return 'Pending review';
    if (status === 'EXPIRED' || status === 'LAPSED') return 'Higher risk';
    return 'Lower risk';
  };

  const isFamilyExpanded = (familyId: string) => expandedFamilies[familyId] !== false;

  const toggleFamily = (familyId: string) => {
    setExpandedFamilies((prev) => ({
      ...prev,
      [familyId]: !isFamilyExpanded(familyId),
    }));
  };

  const renderPatentRow = (patent: Patent, index: number, rowKey?: string, nested = false) => (
    <TableRow
      key={rowKey || patent.id}
      className={`hover:bg-muted/30 transition-colors ${nested ? 'bg-background/60' : ''}`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <TableCell className="font-mono text-sm font-medium text-primary">
        <div className="flex items-center gap-2">
          {nested && <span className="text-muted-foreground">-</span>}
          <span>{patent.patentNumber}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-medium text-foreground leading-tight">{patent.title}</h3>
            {patent.isFamilyRepresentative && (
              <Badge variant="outline" className="text-[10px] uppercase tracking-wide">
                Representative
              </Badge>
            )}
            {patent.familySize && patent.familySize > 1 && (
              <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
                Family {patent.familyId}
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{patent.abstract}</p>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <div className="text-sm text-muted-foreground">
            {patent.inventors.slice(0, 3).map((inventor, inventorIndex) => (
              <div key={inventorIndex} className="leading-tight">{inventor}</div>
            ))}
            {patent.inventors.length > 3 && (
              <div className="text-xs text-muted-foreground/70">+{patent.inventors.length - 3} more</div>
            )}
          </div>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-start gap-2">
          <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
          <span className="text-sm text-muted-foreground line-clamp-2">{patent.assignee}</span>
        </div>
      </TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{patent.grantDate}</span>
        </div>
      </TableCell>
      <TableCell>
        <Badge variant="outline" className="text-xs whitespace-nowrap">
          {patent.provider}
        </Badge>
      </TableCell>
      <TableCell>
        <div className="space-y-2">
          <Badge variant={legalStatusVariant[patent.legalStatus || 'GRANTED']} className="text-xs whitespace-nowrap">
            {(patent.legalStatus && legalStatusLabel[patent.legalStatus]) || 'Granted'}
          </Badge>
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <ShieldAlert className="h-3.5 w-3.5" />
            {getRiskTone(patent.legalStatus)}
          </div>
        </div>
      </TableCell>
      <TableCell className="text-center">
        <div className="flex items-center justify-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            asChild
            className="hover:bg-primary/10 hover:text-primary"
          >
            <a
              href={patent.url}
              target="_blank"
              rel="noopener noreferrer"
              aria-label={`View patent ${patent.patentNumber}`}
            >
              <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
          <Button
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={() => setSelectedPatent(patent)}
          >
            <Pin className="h-3.5 w-3.5" />
            Pin
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );

  return (
    <div className="w-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Search Results</h2>
          <p className="text-muted-foreground mt-1">
            Found <span className="font-medium text-foreground">{total.toLocaleString()}</span> patents
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={viewMode === 'flat' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setViewMode('flat')}
          >
            Flat View
          </Button>
          <Button
            variant={viewMode === 'family' ? 'default' : 'outline'}
            size="sm"
            className="gap-1"
            onClick={() => setViewMode('family')}
          >
            <GitBranch className="h-3.5 w-3.5" />
            Family View
          </Button>
          <Badge variant="secondary" className="text-sm px-4 py-2">
            {viewMode === 'family'
              ? `${familyGroups.length} families`
              : `Showing ${patents.length} of ${total.toLocaleString()}`}
          </Badge>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border shadow-card overflow-hidden">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50 hover:bg-muted/50">
                <TableHead className="font-semibold text-foreground w-32">Patent #</TableHead>
                <TableHead className="font-semibold text-foreground min-w-[300px]">Title & Abstract</TableHead>
                <TableHead className="font-semibold text-foreground w-48">Inventors</TableHead>
                <TableHead className="font-semibold text-foreground w-48">Assignee</TableHead>
                <TableHead className="font-semibold text-foreground w-32">Date</TableHead>
                <TableHead className="font-semibold text-foreground w-24">Source</TableHead>
                <TableHead className="font-semibold text-foreground w-36">Legal Status</TableHead>
                <TableHead className="font-semibold text-foreground w-48 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {viewMode === 'flat'
                ? patents.map((patent, index) => renderPatentRow(patent, index))
                : familyGroups.flatMap((group, index) => {
                    const rows = [
                      <TableRow
                        key={`family-${group.familyId}`}
                        className="bg-muted/40 hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleFamily(group.familyId)}
                      >
                        <TableCell colSpan={8}>
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-2">
                              {isFamilyExpanded(group.familyId) ? (
                                <ChevronDown className="h-4 w-4 text-muted-foreground" />
                              ) : (
                                <ChevronRight className="h-4 w-4 text-muted-foreground" />
                              )}
                              <span className="font-medium text-foreground">{group.familyId}</span>
                              <Badge variant="secondary" className="text-xs">
                                {group.patents.length} member{group.patents.length > 1 ? 's' : ''}
                              </Badge>
                              <span className="text-xs text-muted-foreground hidden md:inline">
                                {group.representative.title}
                              </span>
                            </div>
                            <span className="text-xs text-muted-foreground">
                              Representative: {group.representative.patentNumber}
                            </span>
                          </div>
                        </TableCell>
                      </TableRow>,
                    ];

                    if (isFamilyExpanded(group.familyId)) {
                      rows.push(
                        ...group.patents.map((patent, memberIndex) =>
                          renderPatentRow(
                            patent,
                            index + memberIndex,
                            `family-member-${group.familyId}-${patent.id}`,
                            true
                          )
                        )
                      );
                    }

                    return rows;
                  })}
            </TableBody>
          </Table>
        </div>
      </div>

      <PinPatentModal
        isOpen={selectedPatent !== null}
        onClose={() => setSelectedPatent(null)}
        patent={selectedPatent}
      />
    </div>
  );
}
