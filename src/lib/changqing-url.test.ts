import { describe, expect, it } from "vitest";
import {
  buildChangqingMusicUrl,
  getChangqingSourceForBase,
  mapBitrateToChangqingQuality,
} from "./changqing-url";

describe("changqing-url", () => {
  it("maps app bitrates to Changqing quality keys", () => {
    expect(mapBitrateToChangqingQuality(128)).toBe("128k");
    expect(mapBitrateToChangqingQuality(192)).toBe("320k");
    expect(mapBitrateToChangqingQuality(999)).toBe("flac");
  });

  it("builds Changqing urls with the provider-specific id field", () => {
    expect(
      buildChangqingMusicUrl({
        source: "cq_kg",
        track: {
          id: "KGHASH",
          url_id: "KGHASH",
          lyric_id: "",
          hash: "KGHASH",
          songmid: "ignored",
        },
        br: 320,
      })
    ).toBe(
      "https://music.haitangw.cc/kgqq1/kg.php?type=mp3&id=KGHASH&level=exhigh"
    );

    expect(
      buildChangqingMusicUrl({
        source: "cq_qq",
        track: {
          id: "QQMID",
          url_id: "QQMID",
          lyric_id: "",
          hash: "ignored",
          songmid: "QQMID",
        },
        br: 999,
      })
    ).toBe(
      "http://175.27.166.236/kgqq1/qq.php?type=mp3&id=QQMID&level=lossless"
    );
  });

  it("links existing base sources to Changqing override sources", () => {
    expect(getChangqingSourceForBase("kuwo")).toBe("cq_kw");
    expect(getChangqingSourceForBase("qq")).toBe("cq_qq");
    expect(getChangqingSourceForBase("bilibili")).toBeNull();
  });
});
