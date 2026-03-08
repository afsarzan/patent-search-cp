import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Loader2 } from 'lucide-react';
import { Patent } from '@/lib/patentApi';
import { Project, Collection } from '@/types/projects';
import {
  createProject,
  createProjectCollection,
  listProjectCollections,
  listProjects,
  pinPatentToProject,
} from '@/lib/projectRepository';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface PinPatentModalProps {
  isOpen: boolean;
  onClose: () => void;
  patent: Patent | null;
}

export function PinPatentModal({ isOpen, onClose, patent }: PinPatentModalProps) {
  const queryClient = useQueryClient();

  const [projectMode, setProjectMode] = useState<'existing' | 'new'>('existing');
  const [selectedProjectId, setSelectedProjectId] = useState('');
  const [newProjectName, setNewProjectName] = useState('');
  const [newProjectDescription, setNewProjectDescription] = useState('');

  const [collectionMode, setCollectionMode] = useState<'none' | 'existing' | 'new'>('none');
  const [selectedCollectionId, setSelectedCollectionId] = useState('');
  const [newCollectionName, setNewCollectionName] = useState('');
  const [notes, setNotes] = useState('');

  const { data: projectsData } = useQuery<{ projects: Project[] }>({
    queryKey: ['projects'],
    queryFn: listProjects,
    enabled: isOpen,
  });

  const targetProjectId =
    projectMode === 'existing' && selectedProjectId ? Number.parseInt(selectedProjectId, 10) : null;

  const { data: collectionsData } = useQuery<{ collections: Collection[] }>({
    queryKey: ['project-collections', targetProjectId],
    queryFn: async () => {
      if (!targetProjectId) return { collections: [] };
      return listProjectCollections(targetProjectId);
    },
    enabled: isOpen && projectMode === 'existing' && !!targetProjectId,
  });

  const resetState = () => {
    setProjectMode('existing');
    setSelectedProjectId('');
    setNewProjectName('');
    setNewProjectDescription('');
    setCollectionMode('none');
    setSelectedCollectionId('');
    setNewCollectionName('');
    setNotes('');
  };

  const closeModal = () => {
    resetState();
    onClose();
  };

  const isValidProject = projectMode === 'existing' ? selectedProjectId !== '' : newProjectName.trim() !== '';
  const isValidCollection =
    collectionMode === 'none' ||
    (collectionMode === 'existing' ? selectedCollectionId !== '' : newCollectionName.trim() !== '');

  const pinMutation = useMutation({
    mutationFn: async () => {
      if (!patent) throw new Error('No patent selected');

      let projectId = targetProjectId;
      if (projectMode === 'new') {
        const project = await createProject({
          name: newProjectName,
          description: newProjectDescription || undefined,
          defaultProvider: patent.provider,
        });
        projectId = project.id;
      }

      if (!projectId) throw new Error('No project selected');

      let collectionId: number | undefined;
      if (collectionMode === 'existing' && selectedCollectionId) {
        collectionId = Number.parseInt(selectedCollectionId, 10);
      }

      if (collectionMode === 'new' && newCollectionName.trim()) {
        const collection = await createProjectCollection(projectId, {
          name: newCollectionName,
        });
        collectionId = collection.id;
      }

      await pinPatentToProject(projectId, {
        patent,
        notes: notes || undefined,
        collectionId,
      });

      return projectId;
    },
    onSuccess: (projectId) => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
      closeModal();
    },
  });

  return (
    <Dialog open={isOpen} onOpenChange={closeModal}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Pin Patent to Project</DialogTitle>
          <DialogDescription>
            {patent ? `Add ${patent.patentNumber} to a project for tracking.` : 'Choose where to save this patent.'}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-3">
            <Label className="text-base font-semibold">Project</Label>
            <RadioGroup value={projectMode} onValueChange={(v) => setProjectMode(v as 'existing' | 'new')}>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="existing" id="pin-existing-project" />
                <Label htmlFor="pin-existing-project" className="font-normal cursor-pointer">
                  Add to existing project
                </Label>
              </div>

              {projectMode === 'existing' && (
                <div className="ml-6">
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project..." />
                    </SelectTrigger>
                    <SelectContent>
                      {projectsData?.projects.map((project) => (
                        <SelectItem key={project.id} value={String(project.id)}>
                          {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2 mt-3">
                <RadioGroupItem value="new" id="pin-new-project" />
                <Label htmlFor="pin-new-project" className="font-normal cursor-pointer">
                  Create a new project
                </Label>
              </div>

              {projectMode === 'new' && (
                <div className="ml-6 space-y-2">
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

          <div className="space-y-3">
            <Label className="text-base font-semibold">Collection (optional)</Label>
            <RadioGroup
              value={collectionMode}
              onValueChange={(v) => setCollectionMode(v as 'none' | 'existing' | 'new')}
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="none" id="pin-no-collection" />
                <Label htmlFor="pin-no-collection" className="font-normal cursor-pointer">
                  No collection
                </Label>
              </div>

              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="existing" id="pin-existing-collection" />
                <Label htmlFor="pin-existing-collection" className="font-normal cursor-pointer">
                  Add to existing collection
                </Label>
              </div>

              {collectionMode === 'existing' && (
                <div className="ml-6">
                  <Select value={selectedCollectionId} onValueChange={setSelectedCollectionId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a collection..." />
                    </SelectTrigger>
                    <SelectContent>
                      {collectionsData?.collections.map((collection) => (
                        <SelectItem key={collection.id} value={String(collection.id)}>
                          {collection.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="flex items-center space-x-2 mt-2">
                <RadioGroupItem value="new" id="pin-new-collection" />
                <Label htmlFor="pin-new-collection" className="font-normal cursor-pointer">
                  Create a collection
                </Label>
              </div>

              {collectionMode === 'new' && (
                <div className="ml-6">
                  <Input
                    placeholder="Collection name"
                    value={newCollectionName}
                    onChange={(e) => setNewCollectionName(e.target.value)}
                  />
                </div>
              )}
            </RadioGroup>
          </div>

          <div className="space-y-2">
            <Label htmlFor="pin-notes">Notes (optional)</Label>
            <Textarea
              id="pin-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add context for this patent..."
              rows={3}
            />
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={closeModal}>Cancel</Button>
            <Button
              onClick={() => pinMutation.mutate()}
              disabled={!patent || !isValidProject || !isValidCollection || pinMutation.isPending}
            >
              {pinMutation.isPending && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Pin Patent
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
