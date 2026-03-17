import apiClient from './client'

export interface ImageTransform {
  width?: number
  height?: number
  quality?: number
}

interface PublicBucketAssetRequest {
  image_url: string
  bucket_name?: string
  image_transform?: ImageTransform
}

function extractResolvedUrl(payload: any): string | undefined {
  if (typeof payload === 'string') return payload
  if (typeof payload?.download_url === 'string') return payload.download_url
  if (typeof payload?.image_url === 'string') return payload.image_url
  if (typeof payload?.url === 'string') return payload.url
  if (typeof payload?.data?.download_url === 'string') return payload.data.download_url
  if (typeof payload?.data?.image_url === 'string') return payload.data.image_url
  if (typeof payload?.data?.url === 'string') return payload.data.url
  return undefined
}

export async function resolvePublicBucketAsset(
  imageUrl: string,
  bucketName?: string,
  imageTransform?: ImageTransform,
): Promise<string> {
  const payload: PublicBucketAssetRequest = {
    image_url: imageUrl,
  }

  if (bucketName) {
    payload.bucket_name = bucketName
  }

  if (imageTransform) {
    payload.image_transform = imageTransform
  }

  try {
    const response = await apiClient.post<any>('/public_bucket_asset', payload)
    return extractResolvedUrl(response.data) ?? imageUrl
  } catch {
    return imageUrl
  }
}
