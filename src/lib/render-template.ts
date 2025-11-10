type Dict = Record<string, string | number | undefined>;

const PLACEHOLDER = /\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g;

export function renderTemplate(tpl: string, data: Dict) {
  return tpl.replace(PLACEHOLDER, (_, key: string) => {
    const v = data[key];
    if (v === undefined || v === null) {
      if (process.env.NODE_ENV !== 'production') {
        console.warn(`[template] missing key: ${key}`);
      }
      return ''; // avoid "undefined" in UI
    }
    return String(v);
  });
}
