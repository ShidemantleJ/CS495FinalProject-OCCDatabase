export const createImage = (url) =>
    new Promise((resolve, reject) => {
      const image = new Image()
      image.addEventListener('load', () => resolve(image))
      image.addEventListener('error', (error) => reject(error))
      image.setAttribute('crossOrigin', 'anonymous')
      image.src = url
    })
  
  export default async function getCroppedImg(imageSrc, pixelCrop) {
    const image = await createImage(imageSrc)
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
  
    if (!ctx) {
      return null
    }
  
    canvas.width = pixelCrop.width
    canvas.height = pixelCrop.height
  
    ctx.drawImage(
      image,
      pixelCrop.x,
      pixelCrop.y,
      pixelCrop.width,
      pixelCrop.height,
      0,
      0,
      pixelCrop.width,
      pixelCrop.height
    )
  
    return new Promise((resolve) => {
      canvas.toBlob((blob) => {
        resolve(blob)
      }, 'image/jpeg')
    })
  }

export async function handleRecrop({
    photoUrl,
    bucketName,
    setUploading,
    setError,
    setImageSrc,
    databaseAPI
}) {
    if (!photoUrl) return;

    setError(null);
    setUploading(true);

    try {
        let urlToCrop = photoUrl;
        if (!urlToCrop.startsWith('http')) {
            const { data } = await databaseAPI.createSignedUrl(bucketName, urlToCrop, 60); // 60s URL expiry
            if (data?.signedUrl) {
                urlToCrop = data.signedUrl;
            } else {
                throw new Error("Could not get image URL for re-cropping.");
            }
        }
        setImageSrc(urlToCrop);
    } catch (err) {
        setError(err.message || "Failed to load image for re-cropping.");
    } finally {
        setUploading(false);
    }
}