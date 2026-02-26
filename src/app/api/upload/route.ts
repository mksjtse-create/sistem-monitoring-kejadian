import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';

const PHOTO_FOLDER_ID = '1DygrjRD7ln3SWH9KDtADZXr1rPduevwq';

// Get authenticated drive client
async function getDriveClient() {
  let privateKey = process.env.GOOGLE_PRIVATE_KEY || '';
  
  // Handle escaped newlines
  if (privateKey.includes('\\n')) {
    privateKey = privateKey.replace(/\\n/g, '\n');
  }
  
  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: privateKey,
    },
    scopes: ['https://www.googleapis.com/auth/drive.file'],
  });
  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const { image } = data;

    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      );
    }

    // Extract base64 data
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    
    // Generate unique filename
    const timestamp = Date.now();
    const randomStr = Math.random().toString(36).substring(7);
    const newFilename = `photo_${timestamp}_${randomStr}.jpg`;

    // Check if Google is configured
    const isGoogleConfigured = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL && 
                                process.env.GOOGLE_PRIVATE_KEY &&
                                process.env.GOOGLE_PRIVATE_KEY.includes('BEGIN PRIVATE KEY');

    console.log('Upload - Google configured:', isGoogleConfigured);

    if (isGoogleConfigured) {
      try {
        // Upload to Google Drive
        const drive = await getDriveClient();
        const { Readable } = await import('stream');
        
        const fileMetadata = {
          name: newFilename,
          parents: [PHOTO_FOLDER_ID],
        };

        const media = {
          mimeType: 'image/jpeg',
          body: Readable.from(imageBuffer),
        };

        const file = await drive.files.create({
          requestBody: fileMetadata,
          media: media,
          fields: 'id',
        });

        const fileId = file.data.id;
        
        if (!fileId) {
          throw new Error('Failed to get file ID from Drive');
        }
        
        // Make file public (anyone with link can view)
        await drive.permissions.create({
          fileId: fileId,
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
        });
      } catch (driveError) {
        console.error('Drive upload failed:', driveError);
        return NextResponse.json({
          success: false,
          error: 'Gagal upload ke Google Drive: ' + (driveError as Error).message,
        }, { status: 500 });
      }
    }

    // Google not configured
    return NextResponse.json({
      success: false,
      error: 'Google Drive belum dikonfigurasi',
    }, { status: 400 });
    
  } catch (error) {
    console.error('Error uploading image:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to upload image: ' + (error as Error).message },
      { status: 500 }
    );
  }
}
