import { NextRequest, NextResponse } from 'next/server';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import { google } from 'googleapis';

const execAsync = promisify(exec);

const PHOTO_FOLDER_ID = '1DygrjRD7ln3SWH9KDtADZXr1rPduevwq';

// Get authenticated drive client
async function getDriveClient() {
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { image, filename } = data;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    // Extract base64 data
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const newFilename = `photo_${timestamp}_${randomStr}.jpg`;

    // Compress image
    let compressedBuffer: Buffer;
    try {
      compressedBuffer = await compressImage(base64Data);
    } catch (compressError) {
      console.error('Compression failed, using original:', compressError);
      compressedBuffer = Buffer.from(base64Data, 'base64');
    }

    // ALWAYS save locally first as backup
    const uploadsDir = path.join(process.cwd(), 'public', 'uploads');
    await fs.mkdir(uploadsDir, { recursive: true });
    const localFilePath = path.join(uploadsDir, newFilename);
    await fs.writeFile(localFilePath, compressedBuffer);
    console.log('Photo saved locally:', localFilePath);

    // Check if Google is configured
    const isGoogleConfigured = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
                                process.env.GOOGLE_PRIVATE_KEY &&
                                process.env.GOOGLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');

    if (isGoogleConfigured) {
      try {
        // Try to upload to Google Drive
        const drive = await getDriveClient();
        const { Readable } = await import('stream');
        
        const fileMetadata = {
          name: newFilename,
          parents: [PHOTO_FOLDER_ID],
        };

        const media = {
          mimeType: 'image/jpeg',
          body: Readable.from(compressedBuffer),
        };

        const file = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
        });

        const fileId = file.data.id;
        
        // Make file public (anyone with link can view)
        await drive.permissions.create({
          fileId: fileId!,
          requestBody: {
            role: 'reader',
            type: 'anyone',
          },
        });

        // Get the direct link
        const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

        console.log('Photo uploaded to Drive:', directUrl);

        return NextResponse.json({
          success: true,
          url: directUrl,
          filename: newFilename,
          driveId: fileId,
          localUrl: `/uploads/${newFilename}`, // Also return local URL
        });
      } catch (driveError) {
        console.error('Drive upload failed, using local storage:', driveError);
        // Return local URL since we already saved locally
        return NextResponse.json({
          success: true,
          url: `/uploads/${newFilename}`,
          filename: newFilename,
        });
      }
    }

    // Return local URL
    const publicUrl = `/uploads/${newFilename}`;
    console.log('Photo saved locally (no Google config):', publicUrl);

    return NextResponse.json({
      success: true,
      url: publicUrl,
      filename: newFilename,
    });
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image: ' + (error as Error).message },
      { status: 500 }
    );
  }
}

// Compress image using Python PIL with temp files (avoiding command line size limits)
async function compressImage(base64Data: string): Promise<Buffer> {
  const tempDir = path.join(process.cwd(), 'temp');
  await fs.mkdir(tempDir, { recursive: true });
  
  const timestamp = Date.now();
  const inputFile = path.join(tempDir, `input_${timestamp}.txt`);
  const outputFile = path.join(tempDir, `output_${timestamp}.jpg`);
  const scriptFile = path.join(tempDir, `compress_${timestamp}.py`);
  
  // Python script for compression using file I/O
  const pythonScript = `
import base64
import io
import sys
from PIL import Image

input_file = "${inputFile}"
output_file = "${outputFile}"

try:
    # Read base64 from file
    with open(input_file, 'r') as f:
        base64_data = f.read().strip()
    
    # Decode and compress
    image_data = base64.b64decode(base64_data)
    image = Image.open(io.BytesIO(image_data))

    # Convert to RGB if necessary (for JPEG)
    if image.mode in ('RGBA', 'P'):
        image = image.convert('RGB')

    # Compress - max width 1200px, quality 75%
    max_width = 1200
    if image.width > max_width:
        ratio = max_width / image.width
        new_height = int(image.height * ratio)
        image = image.resize((max_width, new_height), Image.Resampling.LANCZOS)

    # Save compressed to file
    image.save(output_file, format='JPEG', quality=75, optimize=True)
    print("SUCCESS")
except Exception as e:
    print(f"ERROR:{e}")
    sys.exit(1)
`;

  try {
    // Write input data and script
    await fs.writeFile(inputFile, base64Data);
    await fs.writeFile(scriptFile, pythonScript);
    
    // Execute compression
    const { stdout, stderr } = await execAsync(
      `/home/z/.venv/bin/python3 "${scriptFile}"`,
      { timeout: 30000 }
    );
    
    // Clean up input and script
    await fs.unlink(inputFile).catch(() => {});
    await fs.unlink(scriptFile).catch(() => {});
    
    if (stdout.trim() === 'SUCCESS') {
      // Read compressed image
      const compressedBuffer = await fs.readFile(outputFile);
      await fs.unlink(outputFile).catch(() => {});
      return compressedBuffer;
    } else {
      throw new Error('Compression failed: ' + stdout);
    }
  } catch (error) {
    // Clean up all temp files
    await fs.unlink(inputFile).catch(() => {});
    await fs.unlink(scriptFile).catch(() => {});
    await fs.unlink(outputFile).catch(() => {});
    
    // Return original if compression fails
    console.error('Compression error, using original:', error);
    return Buffer.from(base64Data, 'base64');
  }
}
