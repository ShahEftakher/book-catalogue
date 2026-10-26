import { cn } from "@/lib/utils";

type Props = {
  src: string | null | undefined;
  title: string;
  lang?: string;
  className?: string;
};

/** Book cover with a typographic placeholder when there's no image. */
export function CoverImage({ src, title, lang, className }: Props) {
  if (!src) {
    return (
      <div
        lang={lang}
        className={cn(
          "flex aspect-[2/3] items-center justify-center rounded-md bg-gradient-to-br from-stone-200 to-stone-300 p-3 text-center text-sm font-medium text-stone-700",
          className,
        )}
      >
        <span className="line-clamp-5">{title}</span>
      </div>
    );
  }
  return (
    // Covers come from many hosts (Open Library, Google, Blob), so a plain <img> keeps it simple.
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Cover of ${title}`}
      loading="lazy"
      className={cn("aspect-[2/3] w-full rounded-md bg-muted object-cover shadow-sm", className)}
    />
  );
}
