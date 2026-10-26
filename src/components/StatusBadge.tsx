import { Badge } from "@/components/ui/badge";
import { STATUS_LABELS, type ReadingStatus } from "@/lib/constants";
import { cn } from "@/lib/utils";

const STYLES: Record<ReadingStatus, string> = {
  want_to_read: "bg-sky-100 text-sky-800",
  reading: "bg-amber-100 text-amber-800",
  read: "bg-emerald-100 text-emerald-800",
  abandoned: "bg-stone-200 text-stone-700",
};

export function StatusBadge({ status, className }: { status: ReadingStatus; className?: string }) {
  return (
    <Badge variant="secondary" className={cn(STYLES[status], className)}>
      {STATUS_LABELS[status]}
    </Badge>
  );
}
