/**
 * Walrus storage service — upload and retrieve encrypted medical blobs.
 * Uses the Walrus HTTP publisher/aggregator API directly.
 */

const PUBLISHER = process.env.WALRUS_PUBLISHER_URL!;
const AGGREGATOR = process.env.WALRUS_AGGREGATOR_URL!;

export interface WalrusUploadResult {
  blobId: string;
  suiObjectId?: string;
}

/** Upload raw bytes to Walrus. Returns the blob ID. */
export async function uploadToWalrus(
  data: Buffer,
  epochs = 5
): Promise<WalrusUploadResult> {
  const res = await fetch(`${PUBLISHER}/v1/blobs?epochs=${epochs}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/octet-stream' },
    body: data as unknown as BodyInit,
  });
  if (!res.ok) throw new Error(`Walrus upload failed: ${res.statusText}`);
  const json = (await res.json()) as any;

  // Walrus returns either { newlyCreated: { blobObject: { blobId } } } or { alreadyCertified: { blobId } }
  const blobId: string =
    json.newlyCreated?.blobObject?.blobId ??
    json.alreadyCertified?.blobId;
  const suiObjectId: string | undefined =
    json.newlyCreated?.blobObject?.id;

  return { blobId, suiObjectId };
}

/** Retrieve a blob from Walrus by blob ID. */
export async function retrieveFromWalrus(blobId: string): Promise<Buffer> {
  const res = await fetch(`${AGGREGATOR}/v1/blobs/${blobId}`);
  if (!res.ok) throw new Error(`Walrus retrieve failed: ${res.statusText}`);
  return Buffer.from(await res.arrayBuffer());
}
