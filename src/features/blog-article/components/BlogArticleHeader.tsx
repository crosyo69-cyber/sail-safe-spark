import { Calendar, Clock, Facebook, Twitter, Linkedin, MessageCircle } from "lucide-react";
import type { BlogArticle } from "@/features/blog";
import avatarYoanne from "@/assets/avatar-yoanne-cros.jpg?webp";

interface Props {
  article: BlogArticle;
  slug: string | undefined;
}

export const BlogArticleHeader = ({ article, slug }: Props) => (
  <header className="max-w-3xl mx-auto mb-12">
    <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
      <span className="bg-primary/10 text-primary px-3 py-1 rounded-full font-medium">
        {article.category}
      </span>
      <span className="flex items-center gap-1">
        <Calendar className="w-4 h-4" />
        {new Date(article.date).toLocaleDateString("fr-FR", {
          day: "numeric",
          month: "long",
          year: "numeric",
        })}
      </span>
      <span className="flex items-center gap-1">
        <Clock className="w-4 h-4" />
        {article.readTime}
      </span>
    </div>

    <h1 className="font-display text-3xl sm:text-4xl md:text-5xl font-bold text-foreground mb-6">
      {article.title}
    </h1>

    <p className="text-xl text-muted-foreground mb-6">
      {article.excerpt}
    </p>

    <div className="flex items-center justify-between border-t border-b border-border py-4">
      <div className="flex items-center gap-3">
        <img
          src={avatarYoanne}
          alt="Yoanne Cros, moniteur diplômé d'État - KiteSurf Passion Hyères"
          className="w-10 h-10 rounded-full object-cover object-top"
        />
        <div>
          <span className="block font-medium text-foreground">Yoanne Cros</span>
          <span className="text-sm text-muted-foreground">Moniteur Diplômé d'État</span>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-muted-foreground mr-2 hidden sm:inline">Partager :</span>
        <a
          href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(`https://www.kitesurfpassion.fr/blog/${slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full text-muted-foreground hover:text-[#1877F2] hover:bg-[#1877F2]/10 transition-colors"
          aria-label="Partager sur Facebook"
        >
          <Facebook className="w-5 h-5" />
        </a>
        <a
          href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(`https://www.kitesurfpassion.fr/blog/${slug}`)}&text=${encodeURIComponent(article.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
          aria-label="Partager sur X"
        >
          <Twitter className="w-5 h-5" />
        </a>
        <a
          href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(`https://www.kitesurfpassion.fr/blog/${slug}`)}&title=${encodeURIComponent(article.title)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full text-muted-foreground hover:text-[#0A66C2] hover:bg-[#0A66C2]/10 transition-colors"
          aria-label="Partager sur LinkedIn"
        >
          <Linkedin className="w-5 h-5" />
        </a>
        <a
          href={`https://wa.me/?text=${encodeURIComponent(article.title + ' ' + `https://www.kitesurfpassion.fr/blog/${slug}`)}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 rounded-full text-muted-foreground hover:text-[#25D366] hover:bg-[#25D366]/10 transition-colors"
          aria-label="Partager sur WhatsApp"
        >
          <MessageCircle className="w-5 h-5" />
        </a>
      </div>
    </div>
  </header>
);
