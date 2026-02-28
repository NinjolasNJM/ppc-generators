import { parse } from "marked";

export function Markdown({ children }: { children: string }) {
  const html = parse(children);
  // TODO: Handle async parsing from `marked.parse` and ensure this value is always a string.
  // @ts-expect-error `marked.parse` can return Promise<string> in current typings.
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
