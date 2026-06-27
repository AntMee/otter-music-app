import { beforeEach, describe, expect, it, vi } from "vitest";

const mockedFetch = vi.fn();
global.fetch = mockedFetch;

let isWebProd = false;

vi.mock("@/lib/api/config", () => ({
  IS_NATIVE: false,
  get IS_WEB_PROD() {
    return isWebProd;
  },
  getProxyUrl: (url: string) => `/proxy?url=${encodeURIComponent(url)}`,
}));

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

import { LxKugouProvider } from "./lx-kugou-provider";

describe("LxKugouProvider", () => {
  beforeEach(() => {
    vi.resetAllMocks();
    isWebProd = false;
    vi.stubEnv("DEV", true);
    mockedFetch.mockResolvedValue(
      new Response(
        JSON.stringify({
          data: {
            total: 1,
            lists: [
              {
                FileHash: "ABC",
                SongName: "Song",
                SingerName: "Artist",
                AlbumName: "Album",
              },
            ],
          },
        }),
        { status: 200 }
      )
    );
  });

  it("uses the Vite fetch proxy in web development", async () => {
    const provider = new LxKugouProvider();

    const result = await provider.search("Song", 1, 20);

    expect(result.items).toHaveLength(1);
    const fetchUrl = mockedFetch.mock.calls[0][0] as string;
    expect(fetchUrl).toMatch(/^\/api\/fetch\?url=/);
    expect(decodeURIComponent(fetchUrl)).toContain(
      "https://songsearch.kugou.com/song_search_v2?"
    );
  });
});
