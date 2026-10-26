import { renderAppIcon } from "@/lib/app-icon";

const SIZES = [192, 512];

export async function GET(_req: Request, ctx: RouteContext<"/icons/[size]">) {
  const size = Number((await ctx.params).size);
  if (!SIZES.includes(size)) return new Response("Not found", { status: 404 });
  return renderAppIcon(size);
}
