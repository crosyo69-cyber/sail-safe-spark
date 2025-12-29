import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import { MessageSquare, Send, Trash2, Loader2, User, Reply, X } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { z } from "zod";

const commentSchema = z.string().trim().min(3, "Le commentaire doit contenir au moins 3 caractères").max(1000, "Le commentaire est trop long (1000 caractères max)");

interface Comment {
  id: string;
  content: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  profile: {
    display_name: string | null;
  } | null;
  replies?: Comment[];
}

interface BlogCommentsProps {
  articleSlug: string;
}

export const BlogComments = ({ articleSlug }: BlogCommentsProps) => {
  const { user } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [replyingTo, setReplyingTo] = useState<Comment | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [articleSlug]);

  const fetchComments = async () => {
    setIsLoading(true);
    
    const { data: commentsData, error: commentsError } = await supabase
      .from("blog_comments")
      .select("id, content, created_at, user_id, parent_id")
      .eq("article_slug", articleSlug)
      .order("created_at", { ascending: true });

    if (commentsError) {
      console.error("Error fetching comments:", commentsError);
      setIsLoading(false);
      return;
    }

    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setIsLoading(false);
      return;
    }

    // Fetch profiles for all user_ids
    const userIds = [...new Set(commentsData.map(c => c.user_id))];
    const { data: profilesData } = await supabase
      .from("profiles")
      .select("user_id, display_name")
      .in("user_id", userIds);

    const profileMap = new Map(
      (profilesData || []).map(p => [p.user_id, p.display_name])
    );

    // Build nested structure
    const commentsWithProfiles: Comment[] = commentsData.map(c => ({
      ...c,
      profile: { display_name: profileMap.get(c.user_id) || null },
      replies: []
    }));

    // Organize into tree structure
    const commentMap = new Map<string, Comment>();
    const rootComments: Comment[] = [];

    commentsWithProfiles.forEach(comment => {
      commentMap.set(comment.id, comment);
    });

    commentsWithProfiles.forEach(comment => {
      if (comment.parent_id) {
        const parent = commentMap.get(comment.parent_id);
        if (parent) {
          parent.replies = parent.replies || [];
          parent.replies.push(comment);
        }
      } else {
        rootComments.push(comment);
      }
    });

    // Sort root comments by date (newest first)
    rootComments.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    setComments(rootComments);
    setIsLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast.error("Vous devez être connecté pour commenter");
      return;
    }

    try {
      commentSchema.parse(newComment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from("blog_comments")
      .insert({
        article_slug: articleSlug,
        user_id: user.id,
        content: newComment.trim(),
        parent_id: null,
      });

    setIsSubmitting(false);

    if (error) {
      toast.error("Erreur lors de l'envoi du commentaire");
      console.error("Error submitting comment:", error);
      return;
    }

    toast.success("Commentaire publié !");
    setNewComment("");
    fetchComments();
  };

  const handleReply = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !replyingTo) {
      return;
    }

    try {
      commentSchema.parse(replyContent);
    } catch (error) {
      if (error instanceof z.ZodError) {
        toast.error(error.errors[0].message);
        return;
      }
    }

    setIsSubmitting(true);

    const { error } = await supabase
      .from("blog_comments")
      .insert({
        article_slug: articleSlug,
        user_id: user.id,
        content: replyContent.trim(),
        parent_id: replyingTo.id,
      });

    setIsSubmitting(false);

    if (error) {
      toast.error("Erreur lors de l'envoi de la réponse");
      console.error("Error submitting reply:", error);
      return;
    }

    toast.success("Réponse publiée !");
    setReplyContent("");
    setReplyingTo(null);
    fetchComments();
  };

  const handleDelete = async (commentId: string) => {
    const { error } = await supabase
      .from("blog_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      toast.error("Erreur lors de la suppression");
      return;
    }

    toast.success("Commentaire supprimé");
    fetchComments();
  };

  const getInitials = (name: string | null) => {
    if (!name) return "?";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  const getTotalCount = (comments: Comment[]): number => {
    return comments.reduce((acc, comment) => {
      return acc + 1 + (comment.replies?.length || 0);
    }, 0);
  };

  const CommentItem = ({ comment, isReply = false }: { comment: Comment; isReply?: boolean }) => (
    <div className={`flex gap-3 p-4 bg-muted/30 rounded-lg ${isReply ? 'ml-8 mt-2' : ''}`}>
      <Avatar className={`flex-shrink-0 ${isReply ? 'h-8 w-8' : 'h-10 w-10'}`}>
        <AvatarFallback className="bg-primary/10 text-primary text-sm">
          {getInitials(comment.profile?.display_name)}
        </AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between gap-2 mb-1">
          <span className={`font-medium ${isReply ? 'text-xs' : 'text-sm'}`}>
            {comment.profile?.display_name || "Utilisateur"}
          </span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), {
              addSuffix: true,
              locale: fr,
            })}
          </span>
        </div>
        <p className={`text-foreground/90 whitespace-pre-wrap break-words ${isReply ? 'text-xs' : 'text-sm'}`}>
          {comment.content}
        </p>
        <div className="flex items-center gap-2 mt-2">
          {user && !isReply && (
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-primary h-7 px-2"
              onClick={() => {
                setReplyingTo(comment);
                setReplyContent("");
              }}
            >
              <Reply className="h-3 w-3 mr-1" />
              Répondre
            </Button>
          )}
          {user?.id === comment.user_id && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 h-7 px-2"
              onClick={() => handleDelete(comment.id)}
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Supprimer
            </Button>
          )}
        </div>

        {/* Reply form inline */}
        {replyingTo?.id === comment.id && (
          <form onSubmit={handleReply} className="mt-3 space-y-2">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span>Répondre à {comment.profile?.display_name || "Utilisateur"}</span>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="h-5 w-5 p-0"
                onClick={() => setReplyingTo(null)}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
            <Textarea
              placeholder="Votre réponse..."
              value={replyContent}
              onChange={(e) => setReplyContent(e.target.value)}
              className="min-h-[60px] resize-none text-sm"
              disabled={isSubmitting}
              autoFocus
            />
            <div className="flex justify-end">
              <Button type="submit" size="sm" disabled={isSubmitting || !replyContent.trim()}>
                {isSubmitting ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <>
                    <Send className="h-3 w-3 mr-1" />
                    Envoyer
                  </>
                )}
              </Button>
            </div>
          </form>
        )}

        {/* Nested replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-2 space-y-2">
            {comment.replies.map((reply) => (
              <CommentItem key={reply.id} comment={reply} isReply />
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <Card className="border-border/50">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <MessageSquare className="w-5 h-5 text-primary" />
          Commentaires ({getTotalCount(comments)})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Comment form */}
        {user ? (
          <form onSubmit={handleSubmit} className="space-y-3">
            <Textarea
              placeholder="Partagez votre avis sur cet article..."
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              className="min-h-[100px] resize-none"
              disabled={isSubmitting}
            />
            <div className="flex justify-end">
              <Button type="submit" disabled={isSubmitting || !newComment.trim()}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Envoi...
                  </>
                ) : (
                  <>
                    <Send className="mr-2 h-4 w-4" />
                    Publier
                  </>
                )}
              </Button>
            </div>
          </form>
        ) : (
          <div className="bg-muted/50 rounded-lg p-4 text-center">
            <p className="text-muted-foreground mb-3">
              Connectez-vous pour laisser un commentaire
            </p>
            <Button asChild>
              <Link to="/auth">
                <User className="mr-2 h-4 w-4" />
                Se connecter
              </Link>
            </Button>
          </div>
        )}

        {/* Comments list */}
        <div className="space-y-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
            </div>
          ) : comments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">
              Aucun commentaire pour le moment. Soyez le premier à réagir !
            </p>
          ) : (
            comments.map((comment) => (
              <CommentItem key={comment.id} comment={comment} />
            ))
          )}
        </div>
      </CardContent>
    </Card>
  );
};
