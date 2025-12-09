import { mkdir } from "fs/promises";
import { existsSync } from "fs";

export const upload_file = async (file: File): Promise<string> => {
  const upload_dir = "./uploads";

  if (!existsSync(upload_dir)) {
    await mkdir(upload_dir, { recursive: true });
  }

  const filename = `${Date.now()}-${file.name.replace(/\s+/g, "-")}`;
  const filepath = `${upload_dir}/${filename}`;

  const buffer = await file.arrayBuffer();
  await Bun.write(filepath, buffer);

  return `/uploads/${filename}`;
};
