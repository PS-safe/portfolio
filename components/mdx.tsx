import { MDXRemote, type MDXRemoteProps } from "next-mdx-remote/rsc";
import type { ComponentPropsWithoutRef } from "react";
import { TryShortenForm } from "./try-shorten-form";
import { TryOtpForm } from "./try-otp-form";
import { TryRateLimitForm } from "./try-ratelimit-form";
import { TryWebhookForm } from "./try-webhook-form";

const components: MDXRemoteProps["components"] = {
  TryShortenForm,
  TryOtpForm,
  TryRateLimitForm,
  TryWebhookForm,
  h1: (p: ComponentPropsWithoutRef<"h1">) => (
    <h1 className="mt-8 mb-4 text-3xl font-bold tracking-tight text-foreground" {...p} />
  ),
  h2: (p: ComponentPropsWithoutRef<"h2">) => (
    <h2 className="mt-10 mb-3 text-xl font-semibold tracking-tight text-foreground" {...p} />
  ),
  h3: (p: ComponentPropsWithoutRef<"h3">) => (
    <h3 className="mt-6 mb-2 text-base font-semibold text-foreground" {...p} />
  ),
  p: (p: ComponentPropsWithoutRef<"p">) => (
    <p className="my-4 leading-7 text-foreground/90" {...p} />
  ),
  a: (p: ComponentPropsWithoutRef<"a">) => (
    <a className="text-accent underline-offset-4 hover:underline" {...p} />
  ),
  ul: (p: ComponentPropsWithoutRef<"ul">) => (
    <ul className="my-4 ml-6 list-disc space-y-1 text-foreground/90" {...p} />
  ),
  ol: (p: ComponentPropsWithoutRef<"ol">) => (
    <ol className="my-4 ml-6 list-decimal space-y-1 text-foreground/90" {...p} />
  ),
  li: (p: ComponentPropsWithoutRef<"li">) => <li className="leading-7" {...p} />,
  strong: (p: ComponentPropsWithoutRef<"strong">) => (
    <strong className="font-semibold text-foreground" {...p} />
  ),
  code: (p: ComponentPropsWithoutRef<"code">) => (
    <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[0.9em] text-foreground" {...p} />
  ),
  pre: (p: ComponentPropsWithoutRef<"pre">) => (
    <pre className="my-5 overflow-x-auto rounded-lg border border-border bg-muted p-4 text-sm leading-6" {...p} />
  ),
  table: (p: ComponentPropsWithoutRef<"table">) => (
    <div className="my-5 overflow-x-auto">
      <table className="w-full border-collapse text-sm" {...p} />
    </div>
  ),
  th: (p: ComponentPropsWithoutRef<"th">) => (
    <th className="border-b border-border px-3 py-2 text-left font-semibold" {...p} />
  ),
  td: (p: ComponentPropsWithoutRef<"td">) => (
    <td className="border-b border-border/60 px-3 py-2 align-top" {...p} />
  ),
  hr: (p: ComponentPropsWithoutRef<"hr">) => (
    <hr className="my-8 border-border" {...p} />
  ),
  blockquote: (p: ComponentPropsWithoutRef<"blockquote">) => (
    <blockquote className="my-5 border-l-2 border-accent pl-4 italic text-muted-foreground" {...p} />
  ),
};

export function Mdx({ source }: { source: string }) {
  return (
    <div className="font-sans">
      <MDXRemote source={source} components={components} />
    </div>
  );
}
