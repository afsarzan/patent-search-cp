import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { archiveProject, deleteProject, updateProject } from '@/lib/projectRepository';
import { Project } from '@/types/projects';

interface ProjectSettingsModalProps {
  project: Project;
  isOpen: boolean;
  onClose: () => void;
  onArchived: () => void;
  onDeleted: () => void;
}

const PROVIDER_OPTIONS = ['USPTO', 'EPO', 'WIPO', 'Google Patents'] as const;

export const ProjectSettingsModal = ({
  project,
  isOpen,
  onClose,
  onArchived,
  onDeleted,
}: ProjectSettingsModalProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState(project.name);
  const [description, setDescription] = useState(project.description || '');
  const [defaultProvider, setDefaultProvider] = useState(project.defaultProvider || 'USPTO');

  const saveSettingsMutation = useMutation({
    mutationFn: async () =>
      updateProject(project.id, {
        name,
        description: description || undefined,
        defaultProvider,
      }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['project', project.id] });
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
    },
  });

  const archiveMutation = useMutation({
    mutationFn: async () => archiveProject(project.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      onArchived();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => deleteProject(project.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['projects'] });
      onDeleted();
    },
  });

  const isBusy = saveSettingsMutation.isPending || archiveMutation.isPending || deleteMutation.isPending;

  const handleOpenChange = (open: boolean) => {
    if (open) return;
    if (isBusy) return;
    onClose();
  };

  const handleSave = () => {
    if (!name.trim()) return;
    saveSettingsMutation.mutate();
  };

  const handleArchive = () => {
    const confirmed = window.confirm(
      'Archive this project? It will be removed from the active projects list.'
    );
    if (!confirmed) return;
    archiveMutation.mutate();
  };

  const handleDelete = () => {
    const confirmed = window.confirm(
      `Delete "${project.name}" permanently? This removes saved searches, pinned patents, notes, and shares.`
    );
    if (!confirmed) return;
    deleteMutation.mutate();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Project Settings</DialogTitle>
          <DialogDescription>Update project details and manage lifecycle actions.</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="project-settings-name">Project Name</Label>
            <Input
              id="project-settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-settings-description">Description</Label>
            <Textarea
              id="project-settings-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional project description"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>Default Provider</Label>
            <Select value={defaultProvider} onValueChange={setDefaultProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PROVIDER_OPTIONS.map((provider) => (
                  <SelectItem key={provider} value={provider}>
                    {provider}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="pt-2 border-t space-y-2">
            <p className="text-sm font-medium">Danger Zone</p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={handleArchive}
                disabled={isBusy}
                className="flex-1"
              >
                {archiveMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Archive Project
              </Button>
              <Button
                type="button"
                variant="destructive"
                onClick={handleDelete}
                disabled={isBusy}
                className="flex-1"
              >
                {deleteMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Delete Project
              </Button>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={isBusy}>
              Cancel
            </Button>
            <Button type="button" onClick={handleSave} disabled={!name.trim() || isBusy}>
              {saveSettingsMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
