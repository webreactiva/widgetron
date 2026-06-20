import * as React from "react";
import { Play } from "@/lib/icons";

import { cn } from "@/lib/utils";
import { useLabels } from "@/lib/i18n";

export interface VideoClipLabels {
  /** Accessible label for the click-to-load play button on iframe embeds. */
  play: string;
}

export const DEFAULT_VIDEO_CLIP_LABELS: VideoClipLabels = {
  play: "Play video",
};

export interface VideoClipProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "title"> {
  /** Direct video file URL. Mutually exclusive with `youtube` / `vimeo`. */
  src?: string;
  /** YouTube embed id (privacy-friendly nocookie embed). */
  youtube?: string;
  /** Vimeo embed id (dnt embed). */
  vimeo?: string;
  /** Poster / cover image URL. For iframe embeds, doubles as the click-to-load thumbnail. */
  poster?: string;
  /** Accessible title (iframe title / video aria-label). */
  title?: React.ReactNode;
  /** CSS aspect ratio of the frame. Default "16/9". */
  aspect?: string;
  labels?: Partial<VideoClipLabels>;
}

function buildEmbedUrl(youtube?: string, vimeo?: string): string | null {
  if (youtube) {
    // youtube-nocookie does not set tracking cookies until the user interacts.
    return `https://www.youtube-nocookie.com/embed/${youtube}?autoplay=1`;
  }
  if (vimeo) {
    // dnt=1 disables Vimeo session analytics and tracking cookies.
    return `https://player.vimeo.com/video/${vimeo}?dnt=1&autoplay=1`;
  }
  return null;
}

/** Title string for the iframe element (falls back when `title` is a node/empty). */
function iframeTitleFrom(title: React.ReactNode): string {
  return typeof title === "string" && title.trim().length > 0
    ? title
    : "Video clip";
}

/**
 * VideoClip — a responsive, aseptic video embed. With `src` it renders a native
 * <video controls>. With `youtube` / `vimeo` it renders a privacy-friendly
 * (nocookie / dnt) iframe that loads only after the reader clicks the poster,
 * so no third-party request fires until they opt in. Defaults to a 16:9 frame.
 */
export function VideoClip({
  src,
  youtube,
  vimeo,
  poster,
  title,
  aspect = "16/9",
  labels,
  className,
  ...props
}: VideoClipProps) {
  const l = useLabels("videoClip", DEFAULT_VIDEO_CLIP_LABELS, labels);
  const [loaded, setLoaded] = React.useState(false);

  const embedUrl = buildEmbedUrl(youtube, vimeo);
  if (!src && !embedUrl) return null;

  const accessibleTitle = iframeTitleFrom(title);

  return (
    <div
      data-slot="video-clip"
      className={cn(
        "overflow-hidden rounded-lg border bg-card shadow-wgt",
        className,
      )}
      {...props}
    >
      <div className="relative w-full" style={{ aspectRatio: aspect }}>
        {src ? (
          <video
            src={src}
            poster={poster}
            controls
            playsInline
            preload="metadata"
            aria-label={accessibleTitle}
            className="absolute inset-0 size-full bg-black object-contain"
          />
        ) : loaded ? (
          <iframe
            src={embedUrl ?? undefined}
            title={accessibleTitle}
            allow="autoplay; fullscreen; picture-in-picture"
            allowFullScreen
            loading="lazy"
            className="absolute inset-0 size-full border-0"
          />
        ) : (
          <button
            type="button"
            onClick={() => setLoaded(true)}
            aria-label={l.play}
            className="group absolute inset-0 size-full bg-black outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
          >
            {poster && (
              <img
                src={poster}
                alt=""
                className="absolute inset-0 size-full object-cover opacity-90 transition-opacity group-hover:opacity-100"
              />
            )}
            <span className="absolute inset-0 grid place-items-center">
              <span className="grid size-16 place-items-center rounded-full bg-primary text-primary-foreground shadow-wgt transition-transform group-hover:scale-105">
                <Play className="ml-0.5 size-7" />
              </span>
            </span>
          </button>
        )}
      </div>
    </div>
  );
}

VideoClip.displayName = "VideoClip";
