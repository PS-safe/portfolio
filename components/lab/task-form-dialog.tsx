"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { LabTask, TaskStatus } from "@/lib/lab/db";

export type TaskFormInput = {
  title: string;
  body: string | null;
  status: TaskStatus;
};

type Props = {
  open: boolean;
  initial: LabTask | null; // null = create, otherwise edit
  onClose: () => void;
  onSubmit: (input: TaskFormInput) => Promise<void>;
};

// One form serves both create and edit. Uses the native <dialog> element
// so we inherit focus trapping, Esc to close, and a backdrop for free —
// no custom modal logic to maintain. The PLAN §5 motion vocab calls for
// fade + scale on open; that lives in globals.css if it's added later.
export function TaskFormDialog({ open, initial, onClose, onSubmit }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [status, setStatus] = useState<TaskStatus>("active");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setTitle(initial?.title ?? "");
      setBody(initial?.body ?? "");
      setStatus(initial?.status ?? "active");
      setError(null);
      ref.current?.showModal();
    } else {
      ref.current?.close();
    }
  }, [open, initial]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length === 0) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ title: title.trim(), body: body.length > 0 ? body : null, status });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to save.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      // Clicking the backdrop closes the dialog. Native behavior: a click
      // event whose target IS the <dialog> itself (rather than a child)
      // means the user clicked the backdrop area, not inside the panel.
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-full max-w-md rounded-lg border border-border bg-card p-0 text-foreground backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <form onSubmit={handleSubmit} className="p-6">
        <h2 className="text-lg font-semibold tracking-tight">
          {initial ? "Edit task" : "New task"}
        </h2>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="task-title" className="block text-xs font-medium">
              Title
            </label>
            <input
              id="task-title"
              type="text"
              required
              maxLength={200}
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              disabled={submitting}
              placeholder="Wire up Stripe checkout"
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="task-body" className="block text-xs font-medium">
              Body <span className="font-normal text-muted-foreground">(optional)</span>
            </label>
            <textarea
              id="task-body"
              rows={3}
              maxLength={2000}
              value={body}
              onChange={(e) => setBody(e.target.value)}
              disabled={submitting}
              placeholder="Test mode keys first; promote after smoke run."
              className="mt-1 block w-full resize-none rounded-md border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:border-accent focus:outline-none disabled:opacity-50"
            />
          </div>

          <div>
            <label htmlFor="task-status" className="block text-xs font-medium">
              Status
            </label>
            <select
              id="task-status"
              value={status}
              onChange={(e) => setStatus(e.target.value as TaskStatus)}
              disabled={submitting}
              className="mt-1 block w-full rounded-md border border-border bg-background px-3 py-2 text-sm focus:border-accent focus:outline-none disabled:opacity-50"
            >
              <option value="active">active</option>
              <option value="pending">pending</option>
              <option value="archived">archived</option>
            </select>
          </div>

          {error && (
            <p role="alert" className="rounded-md border border-red-500/30 bg-red-500/5 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              {error}
            </p>
          )}
        </div>

        <div className="mt-6 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={submitting || title.trim().length === 0}
            className="inline-flex items-center gap-2 rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-accent-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {submitting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            {initial ? "Save" : "Create"}
          </button>
        </div>
      </form>
    </dialog>
  );
}
