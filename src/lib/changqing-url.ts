import type { MusicSource, MusicTrack } from "@/types/music";

type ChangqingSource = "cq_kg" | "cq_qq" | "cq_wy" | "cq_kw" | "cq_mg";
type ChangqingQuality = "128k" | "320k" | "flac";

const SOURCE_CONFIG: Record<
  ChangqingSource,
  {
    base: string;
    idField: "hash" | "songmid";
    label: Record<ChangqingQuality, string>;
  }
> = {
  cq_kg: {
    base: "https://music.haitangw.cc/kgqq1/kg.php",
    idField: "hash",
    label: { "128k": "standard", "320k": "exhigh", flac: "lossless" },
  },
  cq_qq: {
    base: "http://175.27.166.236/kgqq1/qq.php",
    idField: "songmid",
    label: { "128k": "standard", "320k": "exhigh", flac: "lossless" },
  },
  cq_wy: {
    base: "http://175.27.166.236/wy1/wy.php",
    idField: "songmid",
    label: { "128k": "standard", "320k": "exhigh", flac: "lossless" },
  },
  cq_kw: {
    base: "https://musicapi.haitangw.net/music1/kw.php",
    idField: "songmid",
    label: { "128k": "standard", "320k": "exhigh", flac: "lossless" },
  },
  cq_mg: {
    base: "https://music.haitangw.cc/musicapi1/mg.php",
    idField: "songmid",
    label: { "128k": "standard", "320k": "exhigh", flac: "lossless" },
  },
};

const BASE_SOURCE_TO_CHANGQING: Partial<Record<MusicSource, ChangqingSource>> =
  {
    kugou: "cq_kg",
    qq: "cq_qq",
    netease: "cq_wy",
    kuwo: "cq_kw",
    migu: "cq_mg",
  };

export function mapBitrateToChangqingQuality(br?: number): ChangqingQuality {
  if (!br || br <= 128) return "128k";
  if (br <= 320) return "320k";
  return "flac";
}

export function getChangqingSourceForBase(
  source: MusicSource
): ChangqingSource | null {
  return BASE_SOURCE_TO_CHANGQING[source] ?? null;
}

function stripKnownPrefix(id: string, source: ChangqingSource) {
  const prefixes: Record<ChangqingSource, string[]> = {
    cq_kg: ["kugou_", "kg_"],
    cq_qq: ["qq_", "tx_"],
    cq_wy: ["netease_", "wy_"],
    cq_kw: ["kuwo_", "kw_"],
    cq_mg: ["migu_", "mg_"],
  };

  for (const prefix of prefixes[source]) {
    if (id.startsWith(prefix)) return id.slice(prefix.length);
  }
  return id;
}

function resolveTrackId(
  source: ChangqingSource,
  track: Pick<MusicTrack, "id" | "url_id" | "lyric_id"> & {
    hash?: string;
    songmid?: string;
  }
) {
  const config = SOURCE_CONFIG[source];
  const raw =
    config.idField === "hash"
      ? track.hash || track.url_id || track.id
      : track.songmid || track.url_id || track.lyric_id || track.id;
  return raw ? stripKnownPrefix(String(raw), source) : "";
}

export function buildChangqingMusicUrl({
  source,
  track,
  br,
}: {
  source: ChangqingSource;
  track: Pick<MusicTrack, "id" | "url_id" | "lyric_id"> & {
    hash?: string;
    songmid?: string;
  };
  br?: number;
}): string | null {
  const config = SOURCE_CONFIG[source];
  const id = resolveTrackId(source, track);
  if (!id) return null;

  const quality = mapBitrateToChangqingQuality(br);
  const params = new URLSearchParams({
    type: "mp3",
    id,
    level: config.label[quality],
  });
  return `${config.base}?${params.toString()}`;
}
