"use client";

import { useTranslation } from "@/i18n/provider";
import { locales, localeNames, type Locale } from "@/i18n/config";
import { Select } from "@/components/ui/select";
import { Globe } from "lucide-react";

export function LanguageSwitcher() {
  const { locale, setLocale } = useTranslation();

  return (
    <div className="flex items-center gap-2">
      <Globe className="h-4 w-4 text-[var(--text-secondary)]" />
      <Select
        options={locales.map((l) => ({ value: l, label: localeNames[l] }))}
        value={locale}
        onChange={(e) => setLocale(e.target.value as Locale)}
        className="w-auto text-sm"
      />
    </div>
  );
}
