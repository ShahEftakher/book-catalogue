// Downloads the Poly Haven (CC0) textures used by the 3D library: pnpm assets:fetch
// Files land in public/assets/polyhaven/<id>/<map>.jpg and are committed to the repo.
import { createHash } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const OUT = path.join(process.cwd(), "public/assets/polyhaven");
const UA = { "User-Agent": "book-catalogue (personal project)" };

// id → what it's used for in the scene
const TEXTURES: Record<string, string> = {
  castle_wall_slates: "Grey castle-stone walls, columns and window arches",
  large_grey_tiles: "Ground-floor flagstones",
  worn_planks: "Bookcases, gallery walkways, ceiling timbers, tables",
  brown_leather: "Book bindings (tinted per book)",
};
// Colour and OpenGL normal maps at 1k (phones) and 2k (desktop); AO/roughness/metal packed in one 1k "arm" map
const MAPS: [map: string, res: string, name: string][] = [
  ["Diffuse", "1k", "diff_1k"],
  ["Diffuse", "2k", "diff_2k"],
  ["nor_gl", "1k", "nor_1k"],
  ["nor_gl", "2k", "nor_2k"],
  ["arm", "1k", "arm"],
];
// Book leather is only ever seen small, so it skips the 2k maps
const LOW_RES_ONLY = new Set(["brown_leather"]);
// A dim stained-glass church interior, used as image-based lighting (reflections on metal, varnish, leather)
const HDRI = { id: "church_museum", res: "1k" };

type FileEntry = { url: string; md5: string };
type Info = { name: string; authors: Record<string, string> };

async function download(entry: FileEntry, file: string) {
  const body = Buffer.from(await (await fetch(entry.url, { headers: UA })).arrayBuffer());
  if (createHash("md5").update(body).digest("hex") !== entry.md5) throw new Error(`Checksum mismatch: ${entry.url}`);
  await writeFile(file, body);
  console.log(`${path.relative(OUT, file)}  ${(body.length / 1024).toFixed(0)} KB`);
}

async function credit(id: string, use: string, info: Info) {
  return `- **${info.name}** (\`${id}\`) by ${Object.keys(info.authors).join(", ")} — ${use}. https://polyhaven.com/a/${id}`;
}

async function main() {
  const credits: string[] = [];
  for (const [id, use] of Object.entries(TEXTURES)) {
    const files = (await (await fetch(`https://api.polyhaven.com/files/${id}`, { headers: UA })).json()) as Record<
      string,
      Record<string, Record<string, FileEntry>>
    >;
    const info = (await (await fetch(`https://api.polyhaven.com/info/${id}`, { headers: UA })).json()) as Info;
    await mkdir(path.join(OUT, id), { recursive: true });
    for (const [map, res, name] of MAPS) {
      if (res === "2k" && LOW_RES_ONLY.has(id)) continue;
      await download(files[map][res].jpg, path.join(OUT, id, `${name}.jpg`));
    }
    credits.push(await credit(id, use, info));
  }
  const hdri = (await (await fetch(`https://api.polyhaven.com/files/${HDRI.id}`, { headers: UA })).json()) as {
    hdri: Record<string, Record<string, FileEntry>>;
  };
  await download(hdri.hdri[HDRI.res].hdr, path.join(OUT, `${HDRI.id}_${HDRI.res}.hdr`));
  const hdriInfo = (await (await fetch(`https://api.polyhaven.com/info/${HDRI.id}`, { headers: UA })).json()) as Info;
  credits.push(await credit(HDRI.id, "Environment lighting (reflections)", hdriInfo));
  await writeFile(
    path.join(OUT, "CREDITS.md"),
    `# Poly Haven textures\n\nAll textures are CC0 (public domain) from https://polyhaven.com — credit is not required but given gladly.\n\n${credits.join("\n")}\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
