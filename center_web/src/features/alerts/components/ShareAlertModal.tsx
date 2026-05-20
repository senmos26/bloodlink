"use client";

import { useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import {
  Copy,
  Link2,
  Mail,
  MessageCircle,
  Facebook,
  Linkedin,
  Twitter,
  Check,
} from "lucide-react";

interface ShareAlertModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  url: string;
  alertMessage?: string;
}

export function ShareAlertModal({
  open,
  onOpenChange,
  url,
  alertMessage,
}: ShareAlertModalProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      toast.success("Lien copié dans le presse-papiers");
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Impossible de copier le lien");
    }
  };

  const shareText = encodeURIComponent(
    alertMessage || "Urgence don de sang sur BloodLink"
  );
  const shareUrl = encodeURIComponent(url);

  const socialLinks = [
    {
      name: "WhatsApp",
      icon: MessageCircle,
      href: `https://wa.me/?text=${shareText}%20${shareUrl}`,
      color: "bg-green-500 hover:bg-green-600",
    },
    {
      name: "LinkedIn",
      icon: Linkedin,
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
      color: "bg-blue-700 hover:bg-blue-800",
    },
    {
      name: "X",
      icon: Twitter,
      href: `https://twitter.com/intent/tweet?text=${shareText}&url=${shareUrl}`,
      color: "bg-slate-900 hover:bg-slate-800",
    },
    {
      name: "Facebook",
      icon: Facebook,
      href: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
      color: "bg-blue-600 hover:bg-blue-700",
    },
    {
      name: "Email",
      icon: Mail,
      href: `mailto:?subject=Urgence%20don%20de%20sang&body=${shareText}%0A%0A${shareUrl}`,
      color: "bg-gray-500 hover:bg-gray-600",
    },
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg font-bold">
            <Link2 className="h-5 w-5 text-primary" />
            Partager l&apos;alerte
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 py-2">
          {/* URL + Copier */}
          <div className="flex items-center gap-2">
            <Input
              value={url}
              readOnly
              className="flex-1 font-mono text-sm"
              onFocus={(e) => e.target.select()}
            />
            <Button
              size="icon"
              variant="outline"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4 text-green-600" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="rounded-xl border bg-white p-4 shadow-sm">
              <QRCodeSVG
                value={url}
                size={180}
                bgColor="#ffffff"
                fgColor="#0f172a"
                level="M"
                includeMargin={false}
              />
            </div>
            <span className="text-xs text-muted-foreground">
              Scanner pour ouvrir l&apos;alerte
            </span>
          </div>

          {/* Réseaux sociaux */}
          <div className="space-y-2">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Partager sur
            </p>
            <div className="flex items-center justify-center gap-3">
              {socialLinks.map((network) => (
                <a
                  key={network.name}
                  href={network.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  title={network.name}
                  className={`flex h-10 w-10 items-center justify-center rounded-full text-white transition-transform hover:scale-110 ${network.color}`}
                >
                  <network.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
