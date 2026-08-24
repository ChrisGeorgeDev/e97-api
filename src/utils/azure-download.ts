/**
 * Streams a file back from Azure Blob Storage using Strapi's own upload
 * credential (shared key) — never a client-facing SAS or public URL. This is
 * what makes the container-privacy switch actually meaningful: once the
 * container stops allowing anonymous reads, this is the only remaining way
 * to read a blob's bytes.
 */

import { BlobServiceClient, newPipeline, StorageSharedKeyCredential } from '@azure/storage-blob';

let cachedClient: BlobServiceClient | null = null;

function getAzureBlobServiceClient(): BlobServiceClient {
  if (cachedClient) return cachedClient;

  const account = process.env.AZURE_STORAGE_ACCOUNT ?? '';
  const accountKey = process.env.AZURE_STORAGE_ACCOUNT_KEY ?? '';
  const sharedKeyCredential = new StorageSharedKeyCredential(account, accountKey);
  const pipeline = newPipeline(sharedKeyCredential);

  cachedClient = new BlobServiceClient(`https://${account}.blob.core.windows.net`, pipeline);
  return cachedClient;
}

/**
 * Derives the blob's path within the container directly from the stored
 * file URL, rather than reconstructing it from defaultPath/hash/ext — so
 * this doesn't depend on knowing the upload provider's naming convention,
 * only on reading back wherever it actually put the file.
 */
function getBlobPathFromUrl(fileUrl: string): string {
  const containerName = process.env.AZURE_STORAGE_CONTAINER ?? '';
  const { pathname } = new URL(fileUrl);
  const prefix = `/${containerName}/`;
  return pathname.startsWith(prefix) ? pathname.slice(prefix.length) : pathname.replace(/^\//, '');
}

export async function streamAzureFileToCtx(
  ctx: any,
  fileUrl: string,
  {
    filename,
    disposition,
    contentType,
  }: { filename: string; disposition: 'inline' | 'attachment'; contentType?: string }
): Promise<void> {
  const containerName = process.env.AZURE_STORAGE_CONTAINER ?? '';
  const blobPath = getBlobPathFromUrl(fileUrl);
  const blockBlobClient = getAzureBlobServiceClient()
    .getContainerClient(containerName)
    .getBlockBlobClient(blobPath);

  const downloadResponse = await blockBlobClient.download();
  if (!downloadResponse.readableStreamBody) {
    ctx.notFound();
    return;
  }

  ctx.set('Content-Type', contentType ?? downloadResponse.contentType ?? 'application/octet-stream');
  ctx.set('Content-Disposition', `${disposition}; filename="${filename.replace(/"/g, "'")}"`);
  ctx.body = downloadResponse.readableStreamBody;
}
