export function baseStyles(accent: string): string {
  return `
:root {
  --accent: ${accent};
  --fg: #1a1a1a;
  --muted: #6b7280;
  --bg: #ffffff;
  --card: #f9fafb;
  --border: #e5e7eb;
}
* { box-sizing: border-box; margin: 0; padding: 0; }
body {
  font-family: ui-sans-serif, system-ui, -apple-system, sans-serif;
  color: var(--fg);
  background: var(--bg);
  line-height: 1.6;
  padding: 2rem 1rem;
}
.container { max-width: 720px; margin: 0 auto; }
.header { border-bottom: 2px solid var(--accent); padding-bottom: 1rem; margin-bottom: 2rem; }
.title { font-size: 2rem; font-weight: 700; }
.publisher { color: var(--muted); font-size: 0.875rem; margin-top: 0.25rem; font-family: ui-monospace, monospace; }
.section { margin-bottom: 2.5rem; }
.section-title { font-size: 1.25rem; font-weight: 600; margin-bottom: 0.75rem; color: var(--accent); }
.address { font-style: normal; }
table { width: 100%; border-collapse: collapse; }
table td { padding: 0.5rem 0; border-bottom: 1px solid var(--border); }
table td:first-child { font-weight: 500; text-transform: capitalize; }
table td:last-child { text-align: right; color: var(--muted); }
.menu-item { background: var(--card); border-radius: 0.5rem; padding: 1rem; margin-bottom: 0.75rem; }
.menu-item-header { display: flex; justify-content: space-between; align-items: baseline; gap: 1rem; }
.menu-item-name { font-weight: 600; }
.menu-item-price { color: var(--accent); font-weight: 600; white-space: nowrap; }
.menu-item-desc { color: var(--muted); font-size: 0.9375rem; margin-top: 0.25rem; }
.tags { display: flex; gap: 0.375rem; margin-top: 0.5rem; flex-wrap: wrap; }
.tag { font-size: 0.75rem; background: var(--bg); border: 1px solid var(--border); padding: 0.125rem 0.5rem; border-radius: 9999px; color: var(--muted); }
form { display: grid; gap: 0.75rem; }
label { font-size: 0.875rem; font-weight: 500; display: block; margin-bottom: 0.25rem; }
input { width: 100%; padding: 0.5rem 0.75rem; border: 1px solid var(--border); border-radius: 0.375rem; font-size: 1rem; font-family: inherit; }
button { background: var(--accent); color: white; padding: 0.75rem 1.5rem; border: none; border-radius: 0.375rem; font-size: 1rem; font-weight: 600; cursor: pointer; justify-self: start; }
.footer { margin-top: 3rem; padding-top: 1rem; border-top: 1px solid var(--border); color: var(--muted); font-size: 0.75rem; text-align: center; font-family: ui-monospace, monospace; }
.generic-value { background: var(--card); padding: 0.75rem; border-radius: 0.375rem; font-family: ui-monospace, monospace; font-size: 0.875rem; white-space: pre-wrap; overflow-x: auto; }
`;
}
