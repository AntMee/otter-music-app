import { musicApi } from "@/lib/music-api";
import type { MusicSource, MusicTrack } from "@/types/music";
import { isArtistMatch, isNameMatch } from "@/lib/utils/music-key";

export interface PlaylistSourceSwitchProgress {
  done: number;
  total: number;
  matched: number;
  failed: number;
}

function mergePlaylistMatch(
  original: MusicTrack,
  match: MusicTrack
): MusicTrack {
  return {
    ...match,
    name: original.name,
    artist: original.artist,
    album: original.album || match.album,
    artist_ids: original.artist_ids || match.artist_ids,
    album_id: original.album_id || match.album_id,
  };
}

export async function switchPlaylistSource({
  tracks,
  targetSource,
  onProgress,
}: {
  tracks: MusicTrack[];
  targetSource: MusicSource;
  onProgress?: (progress: PlaylistSourceSwitchProgress) => void;
}): Promise<{ tracks: MusicTrack[]; matched: number; failed: number }> {
  let matched = 0;
  let failed = 0;
  const switched: MusicTrack[] = [];

  for (const track of tracks) {
    if (track.source === targetSource) {
      switched.push(track);
      matched += 1;
    } else {
      const match = await musicApi.searchBestMatch({
        query: `${track.name} ${track.artist[0] || ""}`.trim(),
        sources: [targetSource],
        targetTrack: track,
        predicate: (item) =>
          isNameMatch(track.name, item.name) &&
          isArtistMatch(track.artist, item.artist),
      });

      if (match) {
        switched.push(mergePlaylistMatch(track, match));
        matched += 1;
      } else {
        switched.push(track);
        failed += 1;
      }
    }

    onProgress?.({
      done: switched.length,
      total: tracks.length,
      matched,
      failed,
    });
  }

  return { tracks: switched, matched, failed };
}
