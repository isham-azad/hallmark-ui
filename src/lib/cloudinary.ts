import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

/** Upload a single image; folder e.g. "brands" or "brands/river-hill-tea". Returns secure_url. */
export async function uploadSingleImage(
    buffer: Buffer,
    mimeType: string,
    folder: string,
    publicId?: string
): Promise<string> {
    const base64 = `data:${mimeType || "image/jpeg"};base64,${buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(base64, {
        folder: `hallmark/${folder}`,
        public_id: publicId || undefined,
        overwrite: !!publicId,
    });
    return result.secure_url;
}

/** Delete an image by its Cloudinary URL (e.g. after brand/category delete). */
export async function deleteImageByUrl(url: string): Promise<void> {
    const pathOnly = url.split("?")[0];
    const match = pathOnly.match(/\/upload\/(?:v\d+\/)?(.+)$/);
    if (match) {
        const publicId = match[1].replace(/\.\w+$/, "");
        await cloudinary.uploader.destroy(publicId);
    }
}

/** Delete an empty folder. Delete any assets in it first (e.g. with deleteImageByUrl). */
export async function deleteFolder(folderPath: string): Promise<void> {
    const path = folderPath.replace(/^\/|\/$/g, "");
    if (!path) return;
    await new Promise<void>((resolve, reject) => {
        cloudinary.api.delete_folder(path, (err: Error) => {
            if (err) reject(err);
            else resolve();
        });
    });
}

export default cloudinary;
