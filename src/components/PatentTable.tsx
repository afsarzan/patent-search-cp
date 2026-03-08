import { useState } from 'react';
import { Patent } from '@/lib/patentApi';
import { ExternalLink, Users, Building2, Calendar, Pin } from 'lucide-react';
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

interface PatentTableProps {
  patents: Patent[];
  total: number;
}

export function PatentTable({ patents, total }: PatentTableProps) {
  const [selectedPatent, setSelectedPatent] = useState<Patent | null>(null);

  if (patents.length === 0) {
    return null;
  }

  return (
    <div className="w-full animate-fade-in">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-foreground">Search Results</h2>
          <p className="text-muted-foreground mt-1">
            Found <span className="font-medium text-foreground">{total.toLocaleString()}</span> patents
          </p>
        </div>
        <Badge variant="secondary" className="text-sm px-4 py-2">
          Showing {patents.length} of {total.toLocaleString()}
        </Badge>
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
                <TableHead className="font-semibold text-foreground w-48 text-center">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {patents.map((patent, index) => (
                <TableRow 
                  key={patent.id} 
                  className="hover:bg-muted/30 transition-colors"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <TableCell className="font-mono text-sm font-medium text-primary">
                    {patent.patentNumber}
                  </TableCell>
                  <TableCell>
                    <div className="space-y-2">
                      <h3 className="font-medium text-foreground leading-tight">
                        {patent.title}
                      </h3>
                      <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                        {patent.abstract}
                      </p>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <Users className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <div className="text-sm text-muted-foreground">
                        {patent.inventors.slice(0, 3).map((inventor, i) => (
                          <div key={i} className="leading-tight">{inventor}</div>
                        ))}
                        {patent.inventors.length > 3 && (
                          <div className="text-xs text-muted-foreground/70">
                            +{patent.inventors.length - 3} more
                          </div>
                        )}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-start gap-2">
                      <Building2 className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
                      <span className="text-sm text-muted-foreground line-clamp-2">
                        {patent.assignee}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm text-muted-foreground">
                        {patent.grantDate}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-xs whitespace-nowrap">
                      {patent.provider}
                    </Badge>
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
              ))}
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
