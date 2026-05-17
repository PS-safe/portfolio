"use client";

import { Loader2 } from "lucide-react";
import { useEffect, useRef, useState } from "react";

type Props = {
  open: boolean;
  title: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

export function DeleteConfirm({ open, title, onClose, onConfirm }: Props) {
  const ref = useRef<HTMLDialogElement>(null);
  const [working, setWorking] = useState(false);

  useEffect(() => {
    if (open) {
      ref.current?.showModal();
      setWorking(false);
    } else {
      ref.current?.close();
    }
  }, [open]);

  async function go() {
    setWorking(true);
    try {
      await onConfirm();
      onClose();
    } finally {
      setWorking(false);
    }
  }

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      className="m-auto w-full max-w-sm rounded-lg border border-border bg-card p-0 text-foreground backdrop:bg-black/40 backdrop:backdrop-blur-sm"
    >
      <div className="p-5">
        <h2 className="text-base font-semibold">Delete this task?</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          “<span className="font-medium text-foreground">{title}</span>” will be removed.
          This can&apos;t be undone.
        </p>
        <div className="mt-5 flex items-center justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={working}
            className="rounded-md border border-border bg-background px-3 py-1.5 text-sm transition-colors hover:bg-muted disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={go}
            disabled={working}
            className="inline-flex items-center gap-2 rounded-md bg-red-600 px-3 py-1.5 text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {working && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />}
            Delete
          </button>
        </div>
      </div>
    </dialog>
  );
}
