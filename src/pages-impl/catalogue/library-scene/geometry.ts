import { RoundedBoxGeometry } from "three/examples/jsm/geometries/RoundedBoxGeometry.js";

/**
 * A box with softly rounded edges that textures like a plain BoxGeometry. three's
 * RoundedBoxGeometry leaves some faces with collapsed texture coordinates, which breaks normal
 * mapping there (the faces render white). Here every face gets a planar projection, in the same
 * orientation BoxGeometry uses, chosen by the face's material group (+x, -x, +y, -y, +z, -z).
 */
export function roundedBox(width: number, height: number, depth: number, segments: number, radius: number) {
  const g = new RoundedBoxGeometry(width, height, depth, segments, radius);
  const pos = g.attributes.position;
  const uv = g.attributes.uv;
  const index = g.index; // (non-indexed in current three, but don't rely on it)
  type P = { x: number; y: number; z: number };
  const project = [
    ({ y, z }: P) => [-z / depth + 0.5, y / height + 0.5],
    ({ y, z }: P) => [z / depth + 0.5, y / height + 0.5],
    ({ x, z }: P) => [x / width + 0.5, -z / depth + 0.5],
    ({ x, z }: P) => [x / width + 0.5, z / depth + 0.5],
    ({ x, y }: P) => [x / width + 0.5, y / height + 0.5],
    ({ x, y }: P) => [-x / width + 0.5, y / height + 0.5],
  ];
  for (const group of g.groups) {
    const face = project[group.materialIndex ?? 0];
    for (let i = group.start; i < group.start + group.count; i++) {
      const v = index ? index.getX(i) : i;
      const [u, w] = face({ x: pos.getX(v), y: pos.getY(v), z: pos.getZ(v) });
      uv.setXY(v, u, w);
    }
  }
  uv.needsUpdate = true;
  return g;
}
