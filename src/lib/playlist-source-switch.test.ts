import { describe, expect, it, vi } from "vitest";
import type { MusicSource, MusicTrack } from "@/types/music";
import { musicApi } from "@/lib/music-api";
import { switchPlaylistSource } from "./playlist-source-switch";

vi.mock("@/lib/music-api", () => ({
  musicApi: {
    searchBestMatch: vi.fn(),
  },
}));

const track = (
  id: string,
  source: MusicSource,
  name: string,
  artist: string[]
): MusicTrack => ({
  id,
  name,
  artist,
  album: "",
  pic_id: `pic-${id}`,
  url_id: `url-${id}`,
  lyric_id: `lyric-${id}`,
  source,
});

describe("switchPlaylistSource", () => {
  it("switches the whole playlist to target source while keeping original metadata", async () => {
    const original = track("kugou_A", "kugou", "我的纸飞机", [
      "GooGoo",
      "王之睿",
    ]);
    const bilibiliMatch = track("BV123", "bilibili", "我的纸飞机 - 投稿标题", [
      "一半耳机给你",
    ]);
    vi.mocked(musicApi.searchBestMatch).mockResolvedValue(bilibiliMatch);

    const result = await switchPlaylistSource({
      tracks: [original],
      targetSource: "bilibili",
    });

    expect(musicApi.searchBestMatch).toHaveBeenCalledWith(
      expect.objectContaining({
        query: "我的纸飞机 GooGoo",
        sources: ["bilibili"],
        targetTrack: original,
      })
    );
    expect(result).toMatchObject({ matched: 1, failed: 0 });
    expect(result.tracks[0]).toMatchObject({
      id: "BV123",
      source: "bilibili",
      name: "我的纸飞机",
      artist: ["GooGoo", "王之睿"],
    });
  });

  it("keeps the original track when no match is found", async () => {
    const original = track("kugou_A", "kugou", "我的纸飞机", [
      "GooGoo",
      "王之睿",
    ]);
    vi.mocked(musicApi.searchBestMatch).mockResolvedValue(null);

    const result = await switchPlaylistSource({
      tracks: [original],
      targetSource: "bilibili",
    });

    expect(result).toMatchObject({ matched: 0, failed: 1 });
    expect(result.tracks[0]).toBe(original);
  });
});
