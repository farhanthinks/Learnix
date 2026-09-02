export function slugify(name: string): string {
  return (
    name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "") || "subject"
  );
}

/** Appends "-2", "-3", ... until the candidate isn't in `existingSlugs`. */
export function uniqueSlug(base: string, existingSlugs: Set<string>): string {
  if (!existingSlugs.has(base)) return base;
  let suffix = 2;
  while (existingSlugs.has(`${base}-${suffix}`)) suffix++;
  return `${base}-${suffix}`;
}
