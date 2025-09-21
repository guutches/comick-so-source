// Minimal ComicK source pointing to comick.so
// TypeScript-friendly: declares fields so tsc doesn't error.

const BASE = "https://comick.so";

export default class ComicK {
  // --- field declarations to satisfy TypeScript ---
  cheerio: any;
  requestManager: any;
  createRequestObject: any;

  id: string;
  name: string;
  version: string;
  author: string;

  constructor(cheerio: any, requestManager: any, createRequestObject: any) {
    this.cheerio = cheerio;
    this.requestManager = requestManager;
    this.createRequestObject = createRequestObject;

    this.id = "comick";
    this.name = "ComicK (SO)";
    this.version = "1.0.1";
    this.author = "guutches";
  }

  async getMangaDetails(mangaId: string) {
    const url = `${BASE}/comic/${mangaId}`;
    const req = this.createRequestObject({ url, method: "GET" });
    const res = await this.requestManager.schedule(req, 1);
    const $ = this.cheerio.load(res.data);

    const title = $("h1, .title, [data-test='title']").first().text().trim() || mangaId;
    const image = $("img[alt='cover'], .cover img, .thumbnail img").first().attr("src") || "";
    const desc = $("meta[name='description']").attr("content") || $(".summary, .description").text().trim() || "";

    const tags: { id: string; label: string }[] = [];
    $(".genres a, .tag a, [data-test='genre'] a").each((_: any, el: any) => {
      const t = $(el).text().trim();
      if (t) tags.push({ id: t.toLowerCase().replace(/\s+/g, "-"), label: t });
    });

    return {
      id: mangaId,
      titles: [title].filter(Boolean),
      image,
      desc,
      author: "",
      tags
    };
  }

  async getChapters(mangaId: string) {
    const url = `${BASE}/comic/${mangaId}`;
    const req = this.createRequestObject({ url, method: "GET" });
    const res = await this.requestManager.schedule(req, 1);
    const $ = this.cheerio.load(res.data);

    const chapters: any[] = [];

    $(".chapter, .chapters li, [data-test='chapter-list'] a").each((i: number, el: any) => {
      const a = $(el).is("a") ? $(el) : $(el).find("a").first();
      const href = a.attr("href") || "";
      const id = href.split("/").filter(Boolean).pop() || `${i+1}`;
      const name = a.text().trim() || `Ch ${i + 1}`;
      const numMatch = name.match(/(\d+(?:\.\d+)?)/);
      const chapNum = numMatch ? parseFloat(numMatch[1]) : i + 1;
      const dateText = $(el).find("time, .date").first().text().trim();
      const time = dateText ? Date.parse(dateText) || Date.now() : Date.now();

      chapters.push({ id, mangaId, name, chapNum, time });
    });

    chapters.sort((a, b) => (b.chapNum - a.chapNum) || (b.time - a.time));
    return chapters;
  }

  async getChapterDetails(mangaId: string, chapterId: string) {
    const url = `${BASE}/chapter/${chapterId}`;
    const req = this.createRequestObject({ url, method: "GET" });
    const res = await this.requestManager.schedule(req, 1);
    const $ = this.cheerio.load(res.data);

    const pages: string[] = [];

    $("img.page, .reader img, .page img").each((_: any, el: any) => {
      const src = $(el).attr("data-src") || $(el).attr("src");
      if (src) pages.push(src);
    });

    if (pages.length === 0) {
      const scripts = $("script").toArray().map((s: any) => $(s).html() || "");
      const blob = scripts.find((t: string) => /pages|images/i.test(t));
      if (blob) {
        try {
          const match = blob.match(/\{[^]*\}/);
          if (match) {
            const obj = JSON.parse(match[0]);
            const arr = obj.pages || obj.images || [];
            for (const p of arr) pages.push(typeof p === "string" ? p : p?.url);
          }
        } catch {}
      }
    }

    return {
      id: chapterId,
      mangaId,
      pages,
      longStrip: true
    };
  }

  async searchRequest(query: { title?: string }) {
    const q = (query?.title || "").trim();
    const url = `${BASE}/search?q=${encodeURIComponent(q)}`;
    const req = this.createRequestObject({ url, method: "GET" });
    const res = await this.requestManager.schedule(req, 1);
    const $ = this.cheerio.load(res.data);

    const results: any[] = [];
    $(".search .item, .result .item, .manga-item").each((_: any, el: any) => {
      const a = $(el).find("a").first();
      const href = a.attr("href") || "";
      const id = href.split("/").filter(Boolean).pop() || "";
      const title = $(el).find(".title, h3, h4").first().text().trim();
      const img = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
      if (id && title) results.push({ id, title, image: img });
    });

    return { results, metadata: {} };
  }
}
