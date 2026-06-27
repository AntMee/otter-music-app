import { describe, expect, it, vi } from "vitest";

import type { IMusicProvider } from "../interface";
import type { MusicSource, MusicTrack } from "@/types/music";
import { AggregateProvider } from "./aggregate-provider";

vi.mock("@/lib/logger", () => ({
  logger: {
    warn: vi.fn(),
  },
}));

const track: MusicTrack = {
  id: "netease_1",
  name: "七里香",
  artist: ["周杰伦"],
  album: "七里香",
  pic_id: "",
  url_id: "1",
  lyric_id: "1",
  source: "netease",
};

function provider(
  result: Promise<{ items: MusicTrack[]; hasMore: boolean }>
): IMusicProvider {
  return {
    source: "netease",
    search: () => result,
    getUrl: async () => null,
    getPic: async () => null,
    getLyric: async () => null,
  };
}

describe("AggregateProvider", () => {
  it("ignores rejected source searches and keeps successful results", async () => {
    const providers: Partial<Record<MusicSource, IMusicProvider>> = {
      netease: provider(Promise.resolve({ items: [track], hasMore: true })),
      lx_kg: provider(Promise.reject(new TypeError("Failed to fetch"))),
    };
    const aggregate = new AggregateProvider(
      (source) => providers[source]!,
      () => ["netease", "lx_kg"]
    );

    const result = await aggregate.search("七里香", 1, 20);

    expect(result.hasMore).toBe(false);
    expect(result.items).toHaveLength(1);
    expect(result.items[0]).toMatchObject(track);
  });
});
