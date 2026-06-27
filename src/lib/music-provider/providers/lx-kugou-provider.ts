import type {
  MusicTrack,
  SearchIntent,
  SearchPageResult,
  SongLyric,
  MusicSource,
} from "@otter-music/shared";
import { getLxUrl } from "@/lib/utils/lx-api";
import { logger } from "@/lib/logger";
import { IS_NATIVE, IS_WEB_PROD, getProxyUrl } from "@/lib/api/config";

const PAGE_SIZE = 20;
const SEARCH_URL = "https://songsearch.kugou.com/song_search_v2";

interface KugouSearchItem {
  FileHash?: string;
  SongName?: string;
  OriSongName?: string;
  SingerName?: string;
  Singers?: Array<{ name?: string }>;
  AlbumName?: string;
  AlbumID?: string | number;
  Duration?: number;
  Image?: string;
  HQFileHash?: string;
  SQFileHash?: string;
  ResFileHash?: string;
  Grp?: KugouSearchItem[];
}

interface KugouSearchResponse {
  data?: {
    lists?: KugouSearchItem[];
    total?: number;
  };
}

export class LxKugouProvider {
  source: MusicSource = "lx_kg";

  async search(
    query: string,
    page: number,
    count: number,
    signal?: AbortSignal,
    _intent?: SearchIntent | null
  ): Promise<SearchPageResult<MusicTrack>> {
    const params = new URLSearchParams({
      keyword: query,
      page: String(page),
      pagesize: String(count || PAGE_SIZE),
      userid: "0",
      clientver: "",
      platform: "WebFilter",
      filter: "2",
      iscorrection: "1",
      privilege_filter: "0",
      area_code: "1",
    });

    const searchUrl = `${SEARCH_URL}?${params.toString()}`;
    const fetchUrl =
      !IS_NATIVE && import.meta.env.DEV
        ? `/api/fetch?url=${encodeURIComponent(searchUrl)}`
        : IS_WEB_PROD
          ? getProxyUrl(searchUrl)
          : searchUrl;

    const res = await fetch(fetchUrl, { signal });
    if (!res.ok) throw new Error(`Kugou search failed: HTTP ${res.status}`);
    const json = (await res.json()) as KugouSearchResponse;
    const list = json.data?.lists ?? [];
    const pageSize = count || PAGE_SIZE;
    const total = json.data?.total ?? 0;

    return {
      items: list.map((item) => normalizeKugouTrack(item, this.source)),
      hasMore: page * pageSize < total,
    };
  }

  async getUrl(track: MusicTrack, br?: number): Promise<string | null> {
    const hash = stripPrefix(track.url_id || track.id, ["kugou_", "kg_"]);
    return getLxUrl(this.source, hash, br);
  }

  async getPic(track: MusicTrack): Promise<string | null> {
    return track.pic_id || null;
  }

  async getLyric(_track: MusicTrack): Promise<SongLyric | null> {
    return null;
  }

  async searchArtist(
    query: string,
    page: number,
    count: number
  ): Promise<SearchPageResult<MusicTrack>> {
    return this.search(query, page, count);
  }

  async searchAlbum(
    query: string,
    page: number,
    count: number
  ): Promise<SearchPageResult<MusicTrack>> {
    return this.search(query, page, count);
  }
}

function normalizeKugouTrack(
  item: KugouSearchItem,
  source: MusicSource
): MusicTrack {
  const fallback = item.Grp?.[0] ?? {};
  const hash = item.FileHash ?? fallback.FileHash ?? "";
  const title = item.SongName ?? item.OriSongName ?? fallback.SongName ?? "";
  const artist =
    item.SingerName ??
    fallback.SingerName ??
    item.Singers?.[0]?.name ??
    fallback.Singers?.[0]?.name ??
    "";
  const image = item.Image ?? fallback.Image ?? "";

  if (!hash) {
    logger.warn("lx-kugou-provider", "Missing Kugou hash in search item", item);
  }

  return {
    id: `lx_kg_${hash || title}`,
    name: title,
    artist: artist ? [artist] : [],
    album: item.AlbumName ?? fallback.AlbumName ?? "",
    pic_id: image ? image.replace("{size}", "1080") : "",
    url_id: hash,
    lyric_id: hash,
    source,
    album_id: String(item.AlbumID ?? fallback.AlbumID ?? ""),
  };
}

function stripPrefix(id: string, prefixes: string[]) {
  for (const prefix of prefixes) {
    if (id.startsWith(prefix)) return id.slice(prefix.length);
  }
  return id;
}
