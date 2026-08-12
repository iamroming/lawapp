"use client";
import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Share2, MessageCircle, Copy, Check } from "lucide-react";
import { shareOnWhatsApp } from "@/lib/whatsapp-share";
import toast from "react-hot-toast";

interface ShareDialogProps {
  type: "invoice" | "quotation" | "document" | "case";
  id: string;
  children?: React.ReactNode;
}

export function ShareDialog({ type, id, children }: ShareDialogProps) {
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleShare = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (data.error) {
        toast.error(data.error);
        return;
      }
      shareOnWhatsApp(data.shareText, data.clientPhone?.replace(/[^0-9]/g, ""));
    } catch {
      toast.error("Failed to generate share link");
    }
    setLoading(false);
  };

  const handleCopyLink = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/share", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, id }),
      });
      const data = await res.json();
      if (data.shareUrl) {
        await navigator.clipboard.writeText(data.shareUrl);
        setCopied(true);
        toast.success("Link copied!");
        setTimeout(() => setCopied(false), 2000);
      }
    } catch {
      toast.error("Failed to copy link");
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center gap-1">
      {children || (
        <Button
          variant="outline"
          size="sm"
          onClick={handleShare}
          disabled={loading}
          className="text-green-600 border-green-200 hover:bg-green-50"
        >
          <MessageCircle className="h-4 w-4 mr-1" />
          Share
        </Button>
      )}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8"
        onClick={handleCopyLink}
        disabled={loading}
        title="Copy link"
      >
        {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
      </Button>
    </div>
  );
}
