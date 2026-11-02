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
// Diffuse colour + OpenGL normal map at 1k keeps the whole set around 6 MB
const MAPS = { Diffuse: "diff", nor_gl: "nor" } as const;

type FileEntry = { url: string; md5: string };

async function main() {
  const credits: string[] = [];
  for (const [id, use] of Object.entries(TEXTURES)) {
    const files = (await (await fetch(`https://api.polyhaven.com/files/${id}`, { headers: UA })).json()) as Record<
      string,
      Record<string, Record<string, FileEntry>>
    >;
    const info = (await (await fetch(`https://api.polyhaven.com/info/${id}`, { headers: UA })).json()) as {
      name: string;
      authors: Record<string, string>;
    };
    await mkdir(path.join(OUT, id), { recursive: true });
    for (const [map, name] of Object.entries(MAPS)) {
      const entry = files[map]["1k"].jpg;
      const body = Buffer.from(await (await fetch(entry.url, { headers: UA })).arrayBuffer());
      if (createHash("md5").update(body).digest("hex") !== entry.md5) throw new Error(`Checksum mismatch: ${entry.url}`);
      await writeFile(path.join(OUT, id, `${name}.jpg`), body);
      console.log(`${id}/${name}.jpg  ${(body.length / 1024).toFixed(0)} KB`);
    }
    credits.push(`- **${info.name}** (\`${id}\`) by ${Object.keys(info.authors).join(", ")} — ${use}. https://polyhaven.com/a/${id}`);
  }
  await writeFile(
    path.join(OUT, "CREDITS.md"),
    `# Poly Haven textures\n\nAll textures are CC0 (public domain) from https://polyhaven.com — credit is not required but given gladly.\n\n${credits.join("\n")}\n`,
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
