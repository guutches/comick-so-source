// Minimal ComicK source pointing to comick.so
// NOTE: This is a simplified skeleton so you can wire it up in your repo quickly.
// You may need to adapt function names/types to match your existing base Source class.

const BASE = "https://comick.so";

export default class ComicK {
  constructor(cheerio, requestManager, createRequestObject) {
    this.cheerio = cheerio;
    this.requestManager = requestManager;
    this.createRequestObject = createRequestObject;
    this.id = "comick";
    this.name = "ComicK (SO)";
    this.version = "1.0.0";
    this.author = "You";
  }

  async getMangaDetails(mangaId) {
    // Adjust URL pattern to the actual comick.so manga detail path if needed
    const url = `${BASE}/comic/${mangaId}`;
    const req = this.createRequestObject({ url, method: "GET" });
    const res = await this.requestManager.schedule(req, 1);
    const $ = this.cheerio.load(res.data);

    const title = $("h1, .title, [data-test='title']").first().text().trim() || mangaId;
    const image = $("img[alt='cover'], .cover img, .thumbnail img").first().attr("src") || "";
    const desc = $("meta[name='description']").attr("content") || $(".summary, .description").text().trim() || "";

    const tags = [];
    $(".genres a, .tag a, [data-test='genre'] a").each((_, el) => {
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

  async getChapters(mangaId) {
    const url = `${BASE}/comic/${mangaId}`;
    const req = this.createRequestObject({ url, method: "GET" });
    const res = await this.requestManager.schedule(req, 1);
    const $ = this.cheerio.load(res.data);

    const chapters = [];

    // Common patterns; adjust selectors to comick.so once you inspect its HTML
    $(".chapter, .chapters li, [data-test='chapter-list'] a").each((i, el) => {
      const a = $(el).is("a") ? $(el) : $(el).find("a").first();
      const href = a.attr("href") || "";
      const id = href.split("/").filter(Boolean).pop();
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

  async getChapterDetails(mangaId, chapterId) {
    const url = `${BASE}/chapter/${chapterId}`;
    const req = this.createRequestObject({ url, method: "GET" });
    const res = await this.requestManager.schedule(req, 1);
    const $ = this.cheerio.load(res.data);

    const pages = [];

    // Direct images
    $("img.page, .reader img, .page img").each((_, el) => {
      const src = $(el).attr("data-src") || $(el).attr("src");
      if (src) pages.push(src);
    });

    // Fallback: JSON in scripts
    if (pages.length === 0) {
      const scripts = $("script").toArray().map(s => $(s).html() || "");
      const blob = scripts.find(t => /pages|images/i.test(t));
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

  async searchRequest(query) {
    const q = (query?.title || "").trim();
    const url = `${BASE}/search?q=${encodeURIComponent(q)}`;
    const req = this.createRequestObject({ url, method: "GET" });
    const res = await this.requestManager.schedule(req, 1);
    const $ = this.cheerio.load(res.data);

    const results = [];
    $(".search .item, .result .item, .manga-item").each((_, el) => {
      const a = $(el).find("a").first();
      const href = a.attr("href") || "";
      const id = href.split("/").filter(Boolean).pop();
      const title = $(el).find(".title, h3, h4").first().text().trim();
      const img = $(el).find("img").attr("data-src") || $(el).find("img").attr("src");
      if (id && title) results.push({ id, title, image: img });
    });

    return { results, metadata: {} };
  }
}
