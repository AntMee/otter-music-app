import type { IMusicProvider } from "../interface";
import type {
  MusicTrack,
  MusicSource,
  SearchIntent,
  SearchPageResult,
  SongLyric,
} from "@otter-music/shared";
import { getLxUrl } from "@/lib/utils/lx-api";

export class LxMiguProvider implements IMusicProvider {
  source: MusicSource = "lx_mg";

  constructor(private readonly baseProvider: IMusicProvider) {}

  async search(
    query: string,
    page: number,
    count: number,
    signal?: AbortSignal,
    intent?: SearchIntent | null
  ): Promise<SearchPageResult<MusicTrack>> {
    const result = await this.baseProvider.search(
      query,
      page,
      count,
      signal,
      intent
    );
    return this.withSource(result);
  }

  async getUrl(track: MusicTrack, br?: number): Promise<string | null> {
    const songId = stripPrefix(track.url_id || track.id, ["migu_", "mg_"]);
    return getLxUrl(this.source, songId, br);
  }

  async getPic(track: MusicTrack, size?: number): Promise<string | null> {
    return this.baseProvider.getPic(track, size);
  }

  async getLyric(track: MusicTrack): Promise<SongLyric | null> {
    return this.baseProvider.getLyric(track);
  }

  async searchArtist(
    query: string,
    page: number,
    count: number
  ): Promise<SearchPageResult<MusicTrack>> {
    if (!this.baseProvider.searchArtist) return this.search(query, page, count);
    return this.withSource(
      await this.baseProvider.searchArtist(query, page, count)
    );
  }

  async searchAlbum(
    query: string,
    page: number,
    count: number
  ): Promise<SearchPageResult<MusicTrack>> {
    if (!this.baseProvider.searchAlbum) return this.search(query, page, count);
    return this.withSource(
      await this.baseProvider.searchAlbum(query, page, count)
    );
  }

  private withSource<T extends MusicTrack>(
    result: SearchPageResult<T>
  ): SearchPageResult<MusicTrack> {
    return {
      ...result,
      items: result.items.map((track) => ({ ...track, source: this.source })),
    };
  }
}

function stripPrefix(id: string, prefixes: string[]) {
  for (const prefix of prefixes) {
    if (id.startsWith(prefix)) return id.slice(prefix.length);
  }
  return id;
}
