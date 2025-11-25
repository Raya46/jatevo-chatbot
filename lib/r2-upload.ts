import { AwsClient } from "aws4fetch";

type UploadResult = {
  url: string;
  key: string;
  etag?: string;
};

type BucketConfig = {
  name: string;
  publicUrl: string;
};

const accessKeyId = process.env.R2_ACCESS_KEY_ID || "";
const secretAccessKey = process.env.R2_SECRET_ACCESS_KEY || "";
const accountId = process.env.R2_ACCOUNT_ID || "";
const endpoint = `https://${accountId}.r2.cloudflarestorage.com`;

const defaultBucketConfig: BucketConfig = {
  name: process.env.R2_BUCKET_NAME || "",
  publicUrl: process.env.R2_PUBLIC_URL || "",
};

const bucketConfigs: Record<string, BucketConfig> = {
  "jatevo-web": {
    name: process.env.R2_BUCKET_NAME || "",
    publicUrl: process.env.R2_PUBLIC_URL || "",
  },
};

const isR2Configured = !!(
  accessKeyId &&
  secretAccessKey &&
  accountId &&
  defaultBucketConfig.name &&
  defaultBucketConfig.publicUrl
);

if (!isR2Configured) {
  // R2 configuration missing - image upload will be disabled
}

const s3 = isR2Configured
  ? new AwsClient({
      accessKeyId,
      secretAccessKey,
      service: "s3",
      region: "auto",
    })
  : null;

export class R2Upload {
  private getBucketConfig(bucketType?: string): BucketConfig {
    if (!bucketType) {
      return defaultBucketConfig;
    }

    const config = bucketConfigs[bucketType];
    if (!(config?.name && config.publicUrl)) {
      // Fallback to default if specific bucket is not configured
      return defaultBucketConfig;
    }

    return config;
  }

  async uploadImage(
    file: File,
    options?: {
      fileName?: string;
      bucketType?: string;
    }
  ): Promise<UploadResult> {
    if (!(isR2Configured && s3)) {
      throw new Error("R2 credentials are not configured");
    }

    const { fileName, bucketType } = options ?? {};
    const bucketConfig = this.getBucketConfig(bucketType);
    const key = fileName || this.generateUniqueFileName(file.name);

    const buffer = Buffer.from(await file.arrayBuffer());

    try {
      const response = await s3.fetch(
        `${endpoint}/${bucketConfig.name}/${key}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": file.type,
            "Content-Length": buffer.length.toString(),
          },
          body: buffer,
        }
      );

      if (!response.ok) {
        throw new Error(`Upload failed: ${response.statusText}`);
      }

      const etag = response.headers.get("etag") || undefined;
      const imageUrl = `${bucketConfig.publicUrl}/${key}`;

      return {
        url: imageUrl,
        key,
        etag,
      };
    } catch (error) {
      throw new Error(
        `Failed to upload image: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async deleteImage(key: string, bucketType?: string): Promise<void> {
    if (!(isR2Configured && s3)) {
      return;
    }

    const bucketConfig = this.getBucketConfig(bucketType);

    try {
      const response = await s3.fetch(
        `${endpoint}/${bucketConfig.name}/${key}`,
        {
          method: "DELETE",
        }
      );

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.statusText}`);
      }
    } catch (_error) {
      // Silently handle deletion errors to prevent blocking main operations
    }
  }

  validateImageFile(file: File): { isValid: boolean; error?: string } {
    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!allowedTypes.includes(file.type)) {
      return {
        isValid: false,
        error:
          "Invalid file type. Only JPEG, PNG, WebP, and GIF images are allowed.",
      };
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      return {
        isValid: false,
        error: "File size too large. Maximum size is 5MB.",
      };
    }

    return { isValid: true };
  }

  generateUniqueFileName(originalName: string): string {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const extension = originalName.split(".").pop();
    const nameWithoutExtension = originalName.split(".").slice(0, -1).join(".");

    return `${timestamp}-${randomString}-${nameWithoutExtension}.${extension}`;
  }

  extractKeyFromUrl(url: string, bucketType?: string): string | null {
    if (!(isR2Configured && url)) {
      return null;
    }

    const bucketConfig = this.getBucketConfig(bucketType);

    if (url.startsWith(bucketConfig.publicUrl)) {
      return url.replace(`${bucketConfig.publicUrl}/`, "");
    }

    return null;
  }

  getAvailableBucketTypes(): string[] {
    return Object.keys(bucketConfigs).filter(
      (key) => bucketConfigs[key].name && bucketConfigs[key].publicUrl
    );
  }

  isBucketConfigured(bucketType: string): boolean {
    const config = bucketConfigs[bucketType];
    return !!(config?.name && config.publicUrl);
  }

  isConfigured(): boolean {
    return isR2Configured;
  }
}

export const r2Upload = new R2Upload();
