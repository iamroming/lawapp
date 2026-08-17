"use client";

import { useState } from "react";
import { Gift, Share2, Copy, Check, MessageSquare, Mail } from "lucide-react";

interface ReferralBannerProps {
  referralCode: string;
  userName: string;
}

export function ReferralBanner({ referralCode, userName }: ReferralBannerProps) {
  const [copied, setCopied] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "https://casefiles.app";
  const referralLink = `${appUrl}/signup?ref=${referralCode}`;

  const copyLink = async () => {
    await navigator.clipboard.writeText(referralLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const shareWhatsApp = () => {
    const text = `Hey! I use CaseFiles to manage my legal practice. Try it free for 14 days using my referral link: ${referralLink}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const shareEmail = () => {
    const subject = "Try CaseFiles - Legal Practice Management";
    const body = `Hey!\n\nI use CaseFiles to manage my legal practice and it's been great.\n\nTry it free for 14 days using my referral link:\n${referralLink}\n\nYou'll get:\n- Unlimited cases\n- WhatsApp hearing reminders\n- AI legal research\n- GST invoicing\n\nCheers!`;
    window.open(`mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`, "_blank");
  };

  return (
    <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-6 text-white">
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Gift className="h-6 w-6" />
            <h3 className="text-lg font-bold">Refer & Earn</h3>
          </div>
          <p className="text-amber-100 text-sm mb-3">
            Share with fellow lawyers. When they subscribe, you both get <strong>1 month free!</strong>
          </p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="bg-white/10 rounded-lg p-3 mb-4">
        <p className="text-xs text-amber-100 mb-2">Your unique referral link:</p>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={referralLink}
            readOnly
            className="flex-1 bg-white/20 rounded px-3 py-2 text-sm font-mono"
          />
          <button
            onClick={copyLink}
            className="bg-white text-amber-600 px-4 py-2 rounded-lg text-sm font-medium hover:bg-amber-50 flex items-center gap-1"
          >
            {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>
      </div>

      {/* Share Buttons */}
      <div className="flex gap-2">
        <button
          onClick={shareWhatsApp}
          className="bg-green-600 hover:bg-green-700 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <MessageSquare className="h-4 w-4" />
          WhatsApp
        </button>
        <button
          onClick={shareEmail}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Mail className="h-4 w-4" />
          Email
        </button>
        <button
          onClick={copyLink}
          className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg text-sm font-medium flex items-center gap-2"
        >
          <Share2 className="h-4 w-4" />
          Share
        </button>
      </div>
    </div>
  );
}
