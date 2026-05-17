// TS port of github.com/PS-safe/queryhelper's Spec→Page contract,
// applied here against Neon for the /lab dashboard. Same shape, same
// allowlist-by-construction posture: the caller declares which fields
// are exposed via Config, and Parse rejects anything else.

export type OrderBy = { field: string; desc: boolean };

export type Spec = {
  page: number;
  pageSize: number;
  search: string;
  filters: Record<string, string[]>;
  order: OrderBy[];
};

export type Config = {
  searchableFields: string[];
  filterableFields: string[];
  orderableFields: string[];
  defaultPageSize: number;
  maxPageSize: number;
  defaultOrder: OrderBy[];
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const RESERVED = new Set(["page", "page_size", "search", "order"]);

export type ParseResult =
  | { ok: true; spec: Spec }
  | { ok: false; error: string };

export function parse(params: URLSearchParams, cfg: Config): ParseResult {
  const spec: Spec = {
    page: 1,
    pageSize: cfg.defaultPageSize > 0 ? cfg.defaultPageSize : 20,
    search: "",
    filters: {},
    order: [],
  };

  const pageRaw = params.get("page");
  if (pageRaw !== null) {
    const n = Number(pageRaw);
    if (!Number.isInteger(n) || n < 1) {
      return { ok: false, error: `page = ${JSON.stringify(pageRaw)} is not a positive integer` };
    }
    spec.page = n;
  }

  const sizeRaw = params.get("page_size");
  if (sizeRaw !== null) {
    const n = Number(sizeRaw);
    if (!Number.isInteger(n) || n < 1) {
      return { ok: false, error: `page_size = ${JSON.stringify(sizeRaw)} is not a positive integer` };
    }
    spec.pageSize = Math.min(n, cfg.maxPageSize > 0 ? cfg.maxPageSize : 100);
  }

  const search = params.get("search")?.trim() ?? "";
  if (search && cfg.searchableFields.length > 0) spec.search = search;

  const orderRaw = params.get("order");
  if (orderRaw) {
    for (const part of orderRaw.split(",").map((s) => s.trim()).filter(Boolean)) {
      const desc = part.startsWith("-");
      const field = desc ? part.slice(1) : part;
      if (!cfg.orderableFields.includes(field)) {
        return { ok: false, error: `${JSON.stringify(field)} is not orderable` };
      }
      spec.order.push({ field, desc });
    }
  }
  if (spec.order.length === 0) spec.order = [...cfg.defaultOrder];

  for (const [key, value] of params.entries()) {
    if (RESERVED.has(key)) continue;
    if (!cfg.filterableFields.includes(key)) {
      return { ok: false, error: `${JSON.stringify(key)} is not filterable` };
    }
    const parts = value.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length > 0) {
      const existing = spec.filters[key] ?? [];
      spec.filters[key] = existing.concat(parts);
    }
  }

  return { ok: true, spec };
}

/** specToURLParams writes a Spec back into a URLSearchParams (used by the
 *  client when filter/sort/page chips change — the URL is the source of
 *  truth, see PLAN §4). Defaults are omitted to keep URLs short. */
export function specToURLParams(spec: Spec, cfg: Config): URLSearchParams {
  const p = new URLSearchParams();
  if (spec.page !== 1) p.set("page", String(spec.page));
  if (spec.pageSize !== cfg.defaultPageSize) p.set("page_size", String(spec.pageSize));
  if (spec.search) p.set("search", spec.search);
  for (const [field, vals] of Object.entries(spec.filters)) {
    if (vals.length > 0) p.set(field, vals.join(","));
  }
  const orderEq =
    spec.order.length === cfg.defaultOrder.length &&
    spec.order.every((o, i) => cfg.defaultOrder[i].field === o.field && cfg.defaultOrder[i].desc === o.desc);
  if (!orderEq && spec.order.length > 0) {
    p.set("order", spec.order.map((o) => (o.desc ? `-${o.field}` : o.field)).join(","));
  }
  return p;
}
