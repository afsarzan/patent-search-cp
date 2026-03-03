import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Users, UserPlus, Copy, Trash2, Loader2 } from 'lucide-react';
import { ProjectShare } from '@/types/projects';

interface TeamTabProps {
  projectId: number;
  shares: ProjectShare[];
  ownerId: number;
}

export const TeamTab = ({ projectId, shares, ownerId }: TeamTabProps) => {
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('VIEWER');
  const [copied, setCopied] = useState(false);

  const inviteCollaboratorMutation = useMutation({
    mutationFn: async () => {
      if (!inviteEmail.trim()) return;

      const res = await fetch(`/api/projects/${projectId}/shares`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userEmail: inviteEmail,
          role: inviteRole,
        }),
      });
      if (!res.ok) throw new Error('Failed to invite collaborator');
      return res.json();
    },
    onSuccess: () => {
      setInviteEmail('');
    },
  });

  const removeCollaboratorMutation = useMutation({
    mutationFn: async (shareId: number) => {
      const res = await fetch(`/api/projects/${projectId}/shares/${shareId}`, {
        method: 'DELETE',
      });
      if (!res.ok) throw new Error('Failed to remove collaborator');
      return res.json();
    },
  });

  const updateRoleMutation = useMutation({
    mutationFn: async ({ shareId, newRole }: { shareId: number; newRole: string }) => {
      const res = await fetch(`/api/projects/${projectId}/shares/${shareId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!res.ok) throw new Error('Failed to update role');
      return res.json();
    },
  });

  const copyShareLink = async () => {
    const shareLink = `${window.location.origin}/projects/${projectId}?token=shared`;
    await navigator.clipboard.writeText(shareLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const roleOptions = [
    { value: 'VIEWER', label: 'Viewer (view only)' },
    { value: 'EDITOR', label: 'Editor (edit searches & patents)' },
    { value: 'OWNER', label: 'Owner (full access)' },
  ];

  return (
    <div className="space-y-6">
      {/* Invite Section */}
      <Card>
        <CardHeader>
          <CardTitle>Invite Collaborators</CardTitle>
          <CardDescription>
            Add team members to help with research
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Input
              type="email"
              placeholder="colleague@example.com"
              value={inviteEmail}
              onChange={(e) => setInviteEmail(e.target.value)}
            />
            <Select value={inviteRole} onValueChange={setInviteRole}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {roleOptions.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value}>
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              onClick={() => inviteCollaboratorMutation.mutate()}
              disabled={!inviteEmail.trim() || inviteCollaboratorMutation.isPending}
              className="gap-2"
            >
              {inviteCollaboratorMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              <UserPlus className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Shareable Link */}
      <Card>
        <CardHeader>
          <CardTitle>Share with Link</CardTitle>
          <CardDescription>Generate a shareable link for quick access</CardDescription>
        </CardHeader>
        <CardContent>
          <Button
            variant="outline"
            onClick={copyShareLink}
            className="gap-2"
          >
            <Copy className="h-4 w-4" />
            {copied ? 'Copied!' : 'Copy Share Link'}
          </Button>
        </CardContent>
      </Card>

      {/* Team Members */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Team Members ({shares.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {shares.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              No collaborators yet. Invite someone to get started.
            </p>
          ) : (
            <div className="space-y-3">
              {shares.map((share) => (
                <div
                  key={share.id}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {share.user?.name || share.user?.email || 'Unknown'}
                    </p>
                    {share.user?.email && (
                      <p className="text-xs text-muted-foreground">
                        {share.user.email}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-3">
                    {share.userId === ownerId ? (
                      <Badge>Owner</Badge>
                    ) : (
                      <Select
                        value={share.role}
                        onValueChange={(newRole) =>
                          updateRoleMutation.mutate({ shareId: share.id, newRole })
                        }
                      >
                        <SelectTrigger className="w-40 h-9">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleOptions.slice(0, 2).map((opt) => (
                            <SelectItem key={opt.value} value={opt.value}>
                              {opt.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}

                    {share.userId !== ownerId && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 text-red-600"
                        onClick={() => removeCollaboratorMutation.mutate(share.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
