import { IMusicProvider } from "./interface";
import { MusicSource } from "@/types/music";
import { LocalProvider } from "./providers/local-provider";
import { AggregateProvider } from "./providers/aggregate-provider";
import { PodcastProvider } from "./providers/podcast-provider";
import { JooxProvider } from "./providers/joox-provider";
import { KuwoProvider } from "./providers/kuwo-provider";
import { KugouApiProvider } from "./providers/kugou-api-provider";
import { MiguApiProvider } from "./providers/migu-api-provider";
import { NeteaseProvider } from "./providers/netease-provider";
import { QqApiProvider } from "./providers/qq-api-provider";
import { NeteaseApiProvider } from "./providers/netease-api-provider";
import { BilibiliApiProvider } from "./providers/bilibili-api-provider";
import { LxKuwoProvider } from "./providers/lx-kuwo-provider";
import { LxQqProvider } from "./providers/lx-qq-provider";
import { LxNeteaseProvider } from "./providers/lx-netease-provider";
import { LxKugouProvider } from "./providers/lx-kugou-provider";
import { LxMiguProvider } from "./providers/lx-migu-provider";
import { ChangqingProvider } from "./providers/changqing-provider";
import { getAggregatedSourcesForSearch } from "@/hooks/use-aggregated-sources";

export class MusicProviderFactory {
  private static instances = new Map<string, IMusicProvider>();

  static getProvider(source: MusicSource): IMusicProvider {
    if (this.instances.has(source)) {
      return this.instances.get(source)!;
    }

    let provider: IMusicProvider;

    switch (source) {
      case "all":
        // Pass the factory method itself as the resolver to avoid circular dependency
        provider = new AggregateProvider(
          (s) => this.getProvider(s),
          () => getAggregatedSourcesForSearch()
        );
        break;
      case "_netease":
        provider = new NeteaseApiProvider(); // 网易云官方 API
        break;
      case "local":
        provider = new LocalProvider();
        break;
      case "podcast":
        provider = new PodcastProvider();
        break;
      case "joox":
        provider = new JooxProvider();
        break;
      case "kuwo":
        provider = new KuwoProvider();
        break;
      case "kugou":
        provider = new KugouApiProvider();
        break;
      case "migu":
        provider = new MiguApiProvider();
        break;
      case "netease":
        provider = new NeteaseProvider();
        break;
      case "qq":
        provider = new QqApiProvider();
        break;
      case "bilibili":
        provider = new BilibiliApiProvider();
        break;
      case "lx_kuwo":
        provider = new LxKuwoProvider();
        break;
      case "lx_qq":
        provider = new LxQqProvider();
        break;
      case "lx_kuwo_huibq":
        provider = new LxKuwoProvider("lx_kuwo_huibq");
        break;
      case "lx_qq_huibq":
        provider = new LxQqProvider("lx_qq_huibq");
        break;
      case "lx_wy":
        provider = new LxNeteaseProvider(this.getProvider("netease"));
        break;
      case "lx_kg":
        provider = new LxKugouProvider();
        break;
      case "lx_mg":
        provider = new LxMiguProvider(this.getProvider("migu"));
        break;
      case "cq_kg":
        provider = new ChangqingProvider("cq_kg", this.getProvider("kugou"));
        break;
      case "cq_qq":
        provider = new ChangqingProvider("cq_qq", this.getProvider("qq"));
        break;
      case "cq_wy":
        provider = new ChangqingProvider("cq_wy", this.getProvider("netease"));
        break;
      case "cq_kw":
        provider = new ChangqingProvider("cq_kw", this.getProvider("kuwo"));
        break;
      case "cq_mg":
        provider = new ChangqingProvider("cq_mg", this.getProvider("migu"));
        break;
      default:
        throw new Error(`不支持的音乐源: ${source}`);
    }

    this.instances.set(source, provider);
    return provider;
  }
}
