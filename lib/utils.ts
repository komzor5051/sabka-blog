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
  return marked.parse(md, { async: false }) as string;
}
