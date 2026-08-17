import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function unwrap<T>(value: T | T[]): T {
  return Array.isArray(value) ? value[0] : value;
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatDateTime(date: string | Date): string {
  return new Date(date).toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function generateCaseNumber(): string {
  const year = new Date().getFullYear();
  const random = Math.floor(Math.random() * 9000) + 1000;
  const suffix = Math.floor(Math.random() * 100);
  // NOTE: For production, prefer using a server-side RPC (e.g. generate_case_number)
  // to guarantee uniqueness via database-level sequencing.
  return `CASE/${year}/${random}${suffix.toString().padStart(2, "0")}`;
}

export function getInitials(name: string): string {
  return name
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: "bg-yellow-500/15 text-yellow-500",
    active: "bg-blue-500/15 text-blue-500",
    "in-progress": "bg-purple-500/15 text-purple-500",
    "under-trial": "bg-orange-500/15 text-orange-500",
    won: "bg-green-500/15 text-green-500",
    lost: "bg-red-500/15 text-red-500",
    settled: "bg-emerald-500/15 text-emerald-500",
    closed: "bg-gray-500/15 text-gray-400",
    adjourned: "bg-indigo-500/15 text-indigo-500",
    dismissed: "bg-rose-500/15 text-rose-500",
  };
  return colors[status] || "bg-gray-500/15 text-gray-400";
}

export const caseStatuses = [
  "pending",
  "active",
  "in-progress",
  "under-trial",
  "won",
  "lost",
  "settled",
  "closed",
  "adjourned",
  "dismissed",
] as const;

export const caseTypes = [
  "Civil",
  "Criminal",
  "Family",
  "Corporate",
  "Property",
  "Labor",
  "Consumer",
  "Constitutional",
  "Tax",
  "Intellectual Property",
  "Environmental",
  "Other",
] as const;

export const courts = [
  "Supreme Court of India",
  "High Court",
  "District Court",
  "Sessions Court",
  "Magistrate Court",
  "Family Court",
  "Commercial Court",
  "Tribunal",
  "Consumer Forum",
  "Other",
] as const;

export const paymentStatuses = ["pending", "partial", "paid", "overdue"] as const;
