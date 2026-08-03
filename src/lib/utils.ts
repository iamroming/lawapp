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
  return `CASE/${year}/${random}`;
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
    pending: "bg-yellow-100 text-yellow-800",
    active: "bg-blue-100 text-blue-800",
    "in-progress": "bg-purple-100 text-purple-800",
    "under-trial": "bg-orange-100 text-orange-800",
    won: "bg-green-100 text-green-800",
    lost: "bg-red-100 text-red-800",
    settled: "bg-emerald-100 text-emerald-800",
    closed: "bg-gray-100 text-gray-800",
    adjourned: "bg-indigo-100 text-indigo-800",
    dismissed: "bg-rose-100 text-rose-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
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
