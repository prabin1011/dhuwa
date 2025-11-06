export async function unwrapParams<T>(p: T | Promise<T>): Promise<T> {
  return (p as any)?.then ? await (p as any) : (p as T);
}
