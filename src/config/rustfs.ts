import { S3Client } from '@aws-sdk/client-s3';

export const rustfsClient = new S3Client({
  endpoint: process.env.RUSTFS_ENDPOINT || 'http://localhost:9000', 
  region: 'us-east-1', 
  credentials: {
    accessKeyId: process.env.RUSTFS_ACCESS_KEY || 'minioadmin',
    secretAccessKey: process.env.RUSTFS_SECRET_KEY || 'minioadmin',
  },
  forcePathStyle: true, 
});

export const RUSTFS_BUCKET_NAME = process.env.RUSTFS_BUCKET || 'whatsapp-media';