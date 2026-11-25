import { sceneSvg } from "@/lib/scene";

/** Placeholder illustration until real photos are uploaded. */
export function Scene({ seed, mood, yurt, horizon, className }: { seed: number; mood: number; yurt?: boolean; horizon?: number; className?: string }) {
  return <div className={className} style={{ position: "absolute", inset: 0 }} dangerouslySetInnerHTML={{ __html: sceneSvg(seed, mood, { yurt, horizon }) }} />;
}
