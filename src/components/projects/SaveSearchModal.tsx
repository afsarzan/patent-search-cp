import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Loader2 } from 'lucide-react';
import { Patent, PatentProvider } from '@/lib/patentApi';
import { Project } from '@/types/projects';
import { createProject, listProjects, saveSearchToProject } from '@/lib/projectRepository';

interface SaveSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSearch: {
    queryString: string;
    providers: PatentProvider[];
    filters?: Record<string, unknown>;
    results: Patent[];
    stats?: Record<string, unknown>;
  };
}

export const SaveSearchModal = ({
  isOpen,
  onClose,
  currentSearch,
}: SaveSearchModalProps) => {
  const queryClient = useQueryClient();
  const [projectMode, setProjectMode] = useState<'existing' | 'new'>('existing');
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');
  const [notes, setNotes] = useState('');

  const { data: projectsData } = useQuery<{ projects: Project[] }>({
    queryKey: ['projects'],
    queryFn: listProjects,
    enabled: isOpen && projectMode === 'existing',
  });

  const saveSearchMutation = useMutation({
    mutationFn: async () => {
      let projectId = selectedProjectId ? parseInt(selectedProjectId, 10) : null;

      // Create new project if needed
      if (projectMode === 'new') {
        const newProject = await createProject({
          name: newProjectName,
          description: newProjectDescription || undefined,
          defaultProvider: currentSearch.providers[0] || 'USPTO',
        });
        projectId = newProject.id;
      }

      if (!projectId) throw new Error('No project selected');

      // Save search to project
      return saveSearchToProject(projectId, {
        queryString: currentSearch.queryString,
        providers: currentSearch.providers,
        filters: currentSearch.filters || {},
        cachedResults: currentSearch.results,
        cachedStats: currentSearch.stats || {
          total: currentSearch.results.length,
          resultCount: currentSearch.results.length,
        },
        notes: notes || undefined,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onClose();
      // Reset form
      setProjectMode('existing');
      setSelectedProjectId('');
      setNewProjectName('');
      setNewProjectDescription('');
      setNotes('');
    },
  });

  const isValid =
    projectMode === 'existing'
      ? selectedProjectId !== ''
      : newProjectName.trim() !== '';

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Save Search to Project</DialogTitle>
          <DialogDescription>
            Add this search to your project for future reference
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          {/* Project Selection */}
          <div className="space-y-3">
            <Label className="text-base font-semibold">Project</Label>

            <RadioGroup value={projectMode} onValueChange={(v) => setProjectMode(v as 'existing' | 'new')}>
              {/* Existing Project */}
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="existing-project" />
                <Label htmlFor="existing-project" className="font-normal cursor-pointer">
                  Add to existing project
                </Label>
              </div>

              {projectMode === 'existing' && (
                <div className="ml-6 space-y-2">
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsData?.projects?.map((project: Project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              {/* New Project */}
              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="new" id="new-project" />
                <Label htmlFor="new-project" className="font-normal cursor-pointer">
                  Create a new project
                </Label>
              </div>

              {projectMode === 'new' && (
                <div className="ml-6 space-y-3">
                  <Input
                    placeholder="Project name"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                  <Textarea
                    placeholder="Optional project description"
                    value={newProjectDescription}
                    onChange={(e) => setNewProjectDescription(e.target.value)}
                    rows={2}
                  />
                </div>
              )}
            </RadioGroup>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (optional)</Label>
            <Textarea
              id="notes"
              placeholder="Why are you saving this search?"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-2 justify-end pt-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={() => saveSearchMutation.mutate()}
              disabled={!isValid || saveSearchMutation.isPending}
            >
              {saveSearchMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Search
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
