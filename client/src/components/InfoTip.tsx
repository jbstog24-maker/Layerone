import { Info } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

/**
 * Small ⓘ button that pops open a plain-English explanation of what the
 * user needs to do. Works on dark cards; tap-friendly for mobile.
 */
export default function InfoTip({
  title,
  children,
  className = "",
}: {
  title?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={title ? `What to do: ${title}` : "What do I need to do?"}
          onClick={e => e.stopPropagation()}
          className={`inline-flex items-center justify-center w-5 h-5 rounded-full text-slate-400 hover:text-white hover:bg-white/10 transition-colors shrink-0 ${className}`}
        >
          <Info className="w-4 h-4" />
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="center"
        className="w-64 bg-[#0d1f35] border-[#1e3a5f] text-slate-200 p-3"
        onClick={e => e.stopPropagation()}
      >
        {title && (
          <p className="text-xs font-semibold text-white mb-1">{title}</p>
        )}
        <div className="text-xs leading-relaxed text-slate-300">{children}</div>
      </PopoverContent>
    </Popover>
  );
}
