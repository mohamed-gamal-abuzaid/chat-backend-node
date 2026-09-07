import multer from 'multer';
import { 
  PutObjectCommand, 
  CreateBucketCommand, 
  HeadBucketCommand, 
  PutBucketPolicyCommand 
} from '@aws-sdk/client-s3';
import { rustfsClient, RUSTFS_BUCKET_NAME } from '../config/rustfs';
import path from 'path';

export const uploadMemory = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 20 * 1024 * 1024 }, 
});

export class UploadService {

  private async ensureBucketExists() {
    try {
    
      await rustfsClient.send(new HeadBucketCommand({ Bucket: RUSTFS_BUCKET_NAME }));
    } catch (error: any) {
      console.log(`Bucket non-existent. Creating '${RUSTFS_BUCKET_NAME}'...`);
      
    
      await rustfsClient.send(new CreateBucketCommand({ Bucket: RUSTFS_BUCKET_NAME }));

     
      const publicPolicy = JSON.stringify({
        Version: '2012-10-17',
        Statement: [
          {
            Effect: 'Allow',
            Principal: '*',
            Action: ['s3:GetObject'],
            Resource: [`arn:aws:s3:::${RUSTFS_BUCKET_NAME}/*`],
          },
        ],
      });

      try {
        await rustfsClient.send(
          new PutBucketPolicyCommand({
            Bucket: RUSTFS_BUCKET_NAME,
            Policy: publicPolicy,
          })
        );
      } catch (policyErr) {
        console.warn('Notice: Custom policy setting skipped by RustFS.');
      }
    }
  }

  async uploadToRustFS(file: Express.Multer.File): Promise<{ mediaUrl: string; type: 'image' | 'file' | 'audio' }> {
  
    await this.ensureBucketExists();

    const fileExtension = path.extname(file.originalname);
    const fileName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${fileExtension}`;

    const command = new PutObjectCommand({
      Bucket: RUSTFS_BUCKET_NAME,
      Key: fileName,
      Body: file.buffer,
      ContentType: file.mimetype,
    });

    await rustfsClient.send(command);


    let type: 'image' | 'file' | 'audio' = 'file';
    if (file.mimetype.startsWith('image/')) type = 'image';
    else if (file.mimetype.startsWith('audio/')) type = 'audio';

    const mediaUrl = `${process.env.RUSTFS_ENDPOINT || 'http://localhost:9000'}/${RUSTFS_BUCKET_NAME}/${fileName}`;

    return { mediaUrl, type };
  }
}