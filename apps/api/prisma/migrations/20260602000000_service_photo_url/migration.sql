-- Add cover photo URL to Service (nullable, managed via admin panel, stored in Vercel Blob as WebP)
ALTER TABLE "Service" ADD COLUMN "photoUrl" TEXT;
