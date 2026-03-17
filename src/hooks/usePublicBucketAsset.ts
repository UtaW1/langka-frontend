import { useQuery } from '@tanstack/react-query'
import { resolvePublicBucketAsset, type ImageTransform } from '@/api/publicBucketAsset'

export function usePublicBucketAsset(
  imageUrl?: string,
  bucketName?: string,
  imageTransform?: ImageTransform,
) {
  return useQuery({
    queryKey: [
      'public-bucket-asset',
      imageUrl ?? '',
      bucketName ?? '',
      imageTransform?.width ?? null,
      imageTransform?.height ?? null,
      imageTransform?.quality ?? null,
    ],
    queryFn: () => resolvePublicBucketAsset(imageUrl as string, bucketName, imageTransform),
    enabled: Boolean(imageUrl),
    staleTime: 1000 * 60 * 60,
  })
}
