export const CLOUDINARY_CONFIG = {
  cloudName: 'dxys8ppb6',
  uploadPreset: 'ItemPosts',
  folder: 'campus_trade/listings',
  uploadUrl: (cloudName: string) => 
    `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
};
