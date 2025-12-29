import { Facebook, Twitter, Linkedin, MessageCircle, Share2 } from "lucide-react";
import { useState } from "react";

interface ShareButtonsProps {
  url: string;
  title: string;
  className?: string;
}

export const ShareButtons = ({ url, title, className = "" }: ShareButtonsProps) => {
  const [showButtons, setShowButtons] = useState(false);
  
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);

  const shareLinks = [
    {
      name: "Facebook",
      icon: Facebook,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: "hover:text-[#1877F2]",
    },
    {
      name: "X (Twitter)",
      icon: Twitter,
      url: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}`,
      color: "hover:text-foreground",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: `https://www.linkedin.com/shareArticle?mini=true&url=${encodedUrl}&title=${encodedTitle}`,
      color: "hover:text-[#0A66C2]",
    },
    {
      name: "WhatsApp",
      icon: MessageCircle,
      url: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}`,
      color: "hover:text-[#25D366]",
    },
  ];

  const handleShareClick = (e: React.MouseEvent, shareUrl: string) => {
    e.preventDefault();
    e.stopPropagation();
    window.open(shareUrl, "_blank", "width=600,height=400");
  };

  const toggleButtons = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShowButtons(!showButtons);
  };

  return (
    <div className={`relative ${className}`}>
      <button
        onClick={toggleButtons}
        className="p-2 rounded-full bg-background/80 backdrop-blur-sm text-muted-foreground hover:text-primary hover:bg-background transition-colors"
        aria-label="Partager"
      >
        <Share2 className="w-4 h-4" />
      </button>

      {showButtons && (
        <div 
          className="absolute bottom-full right-0 mb-2 flex gap-1 p-2 bg-card rounded-lg shadow-lg border border-border/50 animate-fade-in"
          onMouseLeave={() => setShowButtons(false)}
        >
          {shareLinks.map((link) => (
            <button
              key={link.name}
              onClick={(e) => handleShareClick(e, link.url)}
              className={`p-2 rounded-full text-muted-foreground ${link.color} transition-colors`}
              aria-label={`Partager sur ${link.name}`}
              title={`Partager sur ${link.name}`}
            >
              <link.icon className="w-4 h-4" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
};