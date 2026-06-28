import { describe, expect, it, vi } from "vitest";
import {
  buildKugouCodeCommandPayload,
  buildKugouCodePlaylistPayload,
  extractKugouCode,
  fetchKugouCodePlaylistDetail,
  isKugouCodeInput,
} from "./kugou";

describe("Kugou code playlist import", () => {
  it("recognizes plain numeric Kugou codes and KG prompt text", () => {
    expect(extractKugouCode("37619861")).toBe("37619861");
    expect(extractKugouCode("酷狗码：37619861")).toBe("37619861");
    expect(isKugouCodeInput("酷狗码：37619861")).toBe(true);
    expect(isKugouCodeInput("https://m.kugou.com/plist/list/37619861")).toBe(
      false
    );
  });

  it("builds the same command payload used by the Yuanli KG source", async () => {
    await expect(buildKugouCodeCommandPayload("37619861")).resolves.toEqual({
      appid: 1001,
      clientver: 9020,
      mid: "21511157a05844bd085308bc76ef3343",
      clienttime: 640612895,
      key: "36164c4015e704673c588ee202b9ecb8",
      data: "37619861",
    });
  });

  it("builds the playlist payload from parsed command info", async () => {
    await expect(
      buildKugouCodePlaylistPayload({
        id: "27",
        userid: "1389505608",
        collect_type: "0",
        count: 493,
      })
    ).resolves.toMatchObject({
      appid: 1001,
      clientver: 10112,
      mid: "70a02aad1ce4648e7dca77f2afa7b182",
      clienttime: 722219501,
      key: "381d7062030e8a5a94cfbe50bfe65433",
      data: {
        id: "27",
        type: 3,
        userid: "1389505608",
        collect_type: "0",
        page: 1,
        pagesize: 493,
      },
    });
  });

  it("fetches songs through the Kugou code command chain", async () => {
    const fetchJson = vi
      .fn()
      .mockResolvedValueOnce({
        status: 1,
        err_code: 0,
        data: {
          info: {
            id: "27",
            userid: "1389505608",
            collect_type: "0",
            name: "青听",
            img_size: "http://c1.kgimg.com/stdmusic/{size}/20230920/cover.jpg",
            count: 493,
          },
        },
      })
      .mockResolvedValueOnce({
        status: 1,
        err_code: 0,
        data: [
          {
            hash: "HASH_A",
            name: "周杰伦 - 七里香",
            filename: "周杰伦 - 七里香",
            author_name: "周杰伦",
            songname: "七里香",
            trans_param: {
              union_cover: "http://imge.kugou.com/stdmusic/{size}/song.jpg",
            },
          },
        ],
      });

    await expect(
      fetchKugouCodePlaylistDetail("酷狗码：37619861", fetchJson)
    ).resolves.toMatchObject({
      name: "青听",
      coverUrl: "http://c1.kgimg.com/stdmusic/300/20230920/cover.jpg",
      trackCount: 493,
      songs: [{ hash: "HASH_A", songname: "七里香" }],
    });

    expect(fetchJson).toHaveBeenCalledTimes(2);
    expect(fetchJson.mock.calls[0][0]).toBe("http://t.kugou.com/command/");
    expect(fetchJson.mock.calls[1][0]).toBe(
      "http://www2.kugou.kugou.com/apps/kucodeAndShare/app/"
    );
  });
});
