import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Trash2, MessageCircle, Loader2 } from 'lucide-react';
import { Comment } from '@/types/projects';
import { addProjectComment, deleteProjectComment } from '@/lib/projectRepository';

interface NotesTabProps {
  projectId: number;
  comments: Comment[];
}

export const NotesTab = ({ projectId, comments }: NotesTabProps) => {
  const queryClient = useQueryClient();
  const [newComment, setNewComment] = useState('');

  const addCommentMutation = useMutation({
    mutationFn: async () => {
      if (!newComment.trim()) return;

      return addProjectComment(projectId, {
        resourceType: 'project',
        content: newComment,
      });
    },
    onSuccess: () => {
      setNewComment('');
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  const deleteCommentMutation = useMutation({
    mutationFn: async (commentId: number) => deleteProjectComment(projectId, commentId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['project', projectId] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Add Comment Section */}
      <Card>
        <CardContent className="pt-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium">Add a note</label>
            <Textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share thoughts, findings, or next steps..."
              rows={4}
            />
            <Button
              onClick={() => addCommentMutation.mutate()}
              disabled={!newComment.trim() || addCommentMutation.isPending}
              className="gap-2"
            >
              {addCommentMutation.isPending && (
                <Loader2 className="h-4 w-4 animate-spin" />
              )}
              Post Note
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Comments List */}
      {comments.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-12">
            <MessageCircle className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <p className="text-muted-foreground mb-4">No notes yet.</p>
            <p className="text-sm text-muted-foreground text-center max-w-sm">
              Add notes to document findings, decisions, and collaboration with your team.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {comments.map((comment) => (
            <Card key={comment.id}>
              <CardContent className="pt-6">
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-medium text-sm">
                        {comment.author?.name || 'Anonymous'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(comment.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-red-600"
                      onClick={() => deleteCommentMutation.mutate(comment.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <p className="text-sm text-foreground">{comment.content}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};
