import { createClient } from './client';

export const uploadFile = async (file: File, bucket: string = 'case-files') => {
  const supabase = createClient();
  const fileExt = file.name.split('.').pop();
  const fileName = `${Math.random().toString(36).substring(2)}_${Date.now()}.${fileExt}`;
  const filePath = `${fileName}`;

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    throw error;
  }

  const { data: { publicUrl } } = supabase.storage
    .from(bucket)
    .getPublicUrl(filePath);

  return {
    path: filePath,
    url: publicUrl,
    name: file.name,
    type: file.type,
  };
};

export const deleteFile = async (path: string, bucket: string = 'case-files') => {
  const supabase = createClient();
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path]);

  if (error) {
    throw error;
  }
};
