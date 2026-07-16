import sharp from "sharp";

// dHash (difference hash): reduz a imagem a 9x8 pixels em tons de cinza e
// compara cada pixel com o vizinho da direita. O resultado (64 bits) é
// parecido mesmo se a foto for recomprimida, redimensionada ou tiver um
// nome de arquivo diferente — ao contrário de comparar bytes/tamanho.
const HASH_WIDTH = 9;
const HASH_HEIGHT = 8;

export async function computeImageHash(buffer: Buffer): Promise<string> {
  const { data } = await sharp(buffer)
    .resize(HASH_WIDTH, HASH_HEIGHT, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true });

  let bits = "";
  for (let row = 0; row < HASH_HEIGHT; row++) {
    for (let col = 0; col < HASH_WIDTH - 1; col++) {
      const left = data[row * HASH_WIDTH + col];
      const right = data[row * HASH_WIDTH + col + 1];
      bits += left > right ? "1" : "0";
    }
  }

  // 64 bits -> 16 dígitos hexadecimais
  let hex = "";
  for (let i = 0; i < bits.length; i += 4) {
    hex += parseInt(bits.slice(i, i + 4), 2).toString(16);
  }
  return hex;
}

export function hammingDistance(hashA: string, hashB: string): number {
  if (hashA.length !== hashB.length) return Number.POSITIVE_INFINITY;
  let distance = 0;
  for (let i = 0; i < hashA.length; i++) {
    const diff = parseInt(hashA[i], 16) ^ parseInt(hashB[i], 16);
    distance += diff.toString(2).split("1").length - 1;
  }
  return distance;
}

// 64 bits no total; até 8 bits diferentes (~12%) ainda conta como "a mesma foto"
export const DUPLICATE_THRESHOLD = 8;
