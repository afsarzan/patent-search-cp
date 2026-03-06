import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Loader2 } from 'lucide-react';
import { createProject } from '@/lib/projectRepository';

interface NewProjectModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const NewProjectModal = ({ onClose, onSuccess }: NewProjectModalProps) => {
  const queryClient = useQueryClient();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [defaultProvider, setDefaultProvider] = useState('USPTO');

  const createProjectMutation = useMutation({
    mutationFn: async () =>
      createProject({
        name,
        description: description || undefined,
        defaultProvider,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
      onSuccess();
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    createProjectMutation.mutate();
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Create a new project to organize your patent searches and collaborate with teammates.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Project Name *
            </label>
            <Input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., EV Battery Technology"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Description
            </label>
            <Textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Optional: describe the project goals"
              rows={3}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Default Patent Provider
            </label>
            <Select value={defaultProvider} onValueChange={setDefaultProvider}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="USPTO">USPTO</SelectItem>
                <SelectItem value="EPO">EPO</SelectItem>
                <SelectItem value="WIPO">WIPO</SelectItem>
                <SelectItem value="Google Patents">Google Patents</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!name.trim() || createProjectMutation.isPending}
            >
              {createProjectMutation.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Project
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
