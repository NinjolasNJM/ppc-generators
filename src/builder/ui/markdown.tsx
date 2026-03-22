import { parse } from "marked";

export function Markdown({ children }: { children: string }) {
  const html = parse(children, { async: false });
  return <div className="prose" dangerouslySetInnerHTML={{ __html: html }} />;
}
