import { toast } from "react-hot-toast";
import React from "react";

export function undoToast(message: string, onUndo: () => void, duration = 8000) {
  return toast(
    (t) => (
      <div className="flex items-center gap-3">
        <span className="flex-1 text-sm">{message}</span>
        <button
          onClick={() => {
            onUndo();
            toast.dismiss(t.id);
          }}
          className="text-sm font-semibold text-blue-600 hover:text-blue-800"
        >
          Undo
        </button>
        <button
          onClick={() => toast.dismiss(t.id)}
          className="text-gray-400 hover:text-gray-600"
        >
          ×
        </button>
      </div>
    ),
    { duration }
  );
}

export async function softDeleteWithUndo(
  table: string,
  id: string,
  label: string,
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>
) {
  const { error } = await supabase
    .from(table)
    .update({ deleted_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    toast.error("Failed to delete");
    return false;
  }

  undoToast(`${label} deleted`, async () => {
    await supabase.from(table).update({ deleted_at: null }).eq("id", id);
    toast.success(`${label} restored`);
  });

  return true;
}

export async function restoreItem(
  table: string,
  id: string,
  supabase: ReturnType<typeof import("@/lib/supabase/client").createClient>
) {
  const { error } = await supabase.from(table).update({ deleted_at: null }).eq("id", id);
  if (!error) toast.success("Restored successfully");
  return !error;
}
