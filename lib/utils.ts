import { marked } from "marked";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[ёЁ]/g, "е")
    .replace(/[а-яА-Я]/g, (ch) => {
      const map: Record<string, string> = {
        а:"a",б:"b",в:"v",г:"g",д:"d",е:"e",ж:"zh",з:"z",и:"i",й:"y",
        к:"k",л:"l",м:"m",н:"n",о:"o",п:"p",р:"r",с:"s",т:"t",у:"u",
        ф:"f",х:"kh",ц:"ts",ч:"ch",ш:"sh",щ:"shch",ъ:"",ы:"y",ь:"",
        э:"e",ю:"yu",я:"ya",
      };
      return map[ch.toLowerCase()] ?? ch;
    })
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 80);
}

export function renderMarkdown(md: string): string {
  const renderer = new marked.Renderer();
  const headingIds = new Map<string, number>();

  renderer.heading = ({ text, depth }: { text: string; depth: number }) => {
    const plain = text.replace(/<[^>]*>/g, "");
    let id = slugify(plain);
    // Deduplicate IDs
    const count = headingIds.get(id) ?? 0;
    headingIds.set(id, count + 1);
    if (count > 0) id = `${id}-${count}`;
    return `<h${depth} id="${id}">${text}</h${depth}>\n`;
  };

  return marked.parse(md, { async: false, renderer }) as string;
}
