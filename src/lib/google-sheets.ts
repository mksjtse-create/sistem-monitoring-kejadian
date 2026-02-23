import { google } from 'googleapis';

const SPREADSHEET_ID = '1zFcTvgm8yWcKaa6tp-RnkG-TOkGA285s6NzIMaEfTj8';
export const DRIVE_FOLDER_ID = '1Tm6M96DccEwVzU4wtBPjLKF0PGn5Msop';
export const PHOTO_FOLDER_ID = '1DygrjRD7ln3SWH9KDtADZXr1rPduevwq';

// Check if Google Sheets is configured
export function isGoogleConfigured(): boolean {
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  const key = process.env.GOOGLE_PRIVATE_KEY;
  
  const isConfigured = !!(email && key && 
    email.length > 10 &&
    key.includes('BEGIN PRIVATE KEY'));
  
  console.log('Google Config Check:', {
    hasEmail: !!email,
    emailLength: email?.length || 0,
    hasKey: !!key,
    keyLength: key?.length || 0,
    isConfigured
  });
  
  return isConfigured;
}

// Column headers for Input_Kejadian sheet
export const COLUMN_HEADERS = [
  'Header Timestamp',
  'Tanggal Kejadian',
  'Waktu Kejadian',
  'Shift Kejadian',
  'Gardu Kejadian',
  'Waktu Mengirformasikan',
  'Waktu Penanganan',
  'PETUGAS KSPT',
  'PETUGAS PULTOL',
  'Petugas Security',
  'PETUGAS IT',
  'PETUGAS TEKNISI',
  'Lokasi Kejadian',
  'Kronologi Kejadian',
  'Antrian Kendaraan',
  'Keluhan Pengguna Jalan',
  'Tindakan KSPT',
  'Tindakan IT',
  'Tindakan Teknisi',
  'Tindakan PulTol',
  'Tindakan Security',
  'A.Jenis Gangguan - Palang',
  'B.Jenis Gangguan Reader / Periferal',
  'C. Jenis Gangguan - Sistim',
  'D. Jenis Gangguan - Kelistrikan',
  'Status Tindakan',
  'Jumlah Alarm',
  'Jumlah Reset',
  'Foto Sebelum',
  'Foto Sesudah',
];

// Get authenticated client with both Sheets and Drive scopes
async function getAuthClient() {
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
    scopes: [
      'https://www.googleapis.com/auth/spreadsheets',
      'https://www.googleapis.com/auth/drive.file',
    ],
  });
  return auth;
}

// Get authenticated sheets client
async function getSheetClient() {
  const auth = await getAuthClient();
  const sheets = google.sheets({ version: 'v4', auth });
  return sheets;
}

// Get authenticated drive client
async function getDriveClient() {
  const auth = await getAuthClient();
  const drive = google.drive({ version: 'v3', auth });
  return drive;
}

// Get the actual sheet name for Input_Kejadian (with caching)
let cachedInputSheetName: string | null = null;
let cachedInputSheetGid: number | null = null;

async function getInputSheetInfo(): Promise<{ name: string; gid: number }> {
  if (cachedInputSheetName && cachedInputSheetGid !== null) {
    return { name: cachedInputSheetName, gid: cachedInputSheetGid };
  }
  
  const sheets = await getSheetClient();
  const spreadsheet = await sheets.spreadsheets.get({
    spreadsheetId: SPREADSHEET_ID,
  });
  
  const allSheets = spreadsheet.data.sheets?.map(s => ({
    title: s.properties?.title,
    gid: s.properties?.sheetId,
  }));
  console.log('All available sheets:', allSheets);
  
  const inputSheet = spreadsheet.data.sheets?.find(
    sheet => sheet.properties?.title?.toLowerCase() === 'input_kejadian' ||
             sheet.properties?.title?.toLowerCase().includes('input')
  );
  
  cachedInputSheetName = inputSheet?.properties?.title || 'Input_Kejadian';
  cachedInputSheetGid = inputSheet?.properties?.sheetId ?? 0;
  console.log('Using sheet name:', cachedInputSheetName, 'gid:', cachedInputSheetGid);
  return { name: cachedInputSheetName, gid: cachedInputSheetGid };
}

async function getInputSheetName(): Promise<string> {
  const info = await getInputSheetInfo();
  return info.name;
}

// Get the gid for Input_Kejadian sheet
export async function getInputSheetGid(): Promise<number> {
  const info = await getInputSheetInfo();
  return info.gid;
}

// Fetch all data from Input_Kejadian sheet
export async function fetchKejadianData() {
  try {
    const sheets = await getSheetClient();
    const sheetName = await getInputSheetName();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A2:AD`,
    });

    const rows = response.data.values || [];
    return rows.map((row, index) => {
      const obj: Record<string, string | number> = { id: index + 1 };
      COLUMN_HEADERS.forEach((header, i) => {
        obj[header] = row[i] || '';
      });
      return obj;
    });
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

// Fetch dropdown options from Bantuan sheet
export async function fetchDropdownOptions() {
  try {
    const sheets = await getSheetClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Bantuan!A:Z',
    });

    const rows = response.data.values || [];
    const options: Record<string, string[]> = {};
    
    if (rows.length > 0) {
      const headers = rows[0];
      headers.forEach((header: string, colIndex: number) => {
        if (header) {
          // Store with original header name
          options[header] = rows.slice(1)
            .map((row) => row[colIndex])
            .filter((val): val is string => !!val);
          
          // Also store with uppercase version for flexible matching
          const upperKey = header.toUpperCase();
          if (!options[upperKey]) {
            options[upperKey] = options[header];
          }
          
          // Store with normalized key (remove prefixes like A., B., etc.)
          const normalizedKey = header.replace(/^[A-D]\.\s*/i, '').replace(/^Jenis Gangguan\s*-\s*/i, 'Jenis Gangguan - ');
          if (!options[normalizedKey] && normalizedKey !== header) {
            options[normalizedKey] = options[header];
          }
        }
      });
    }
    
    console.log('Fetched dropdown options:', Object.keys(options));
    return options;
  } catch (error) {
    console.error('Error fetching dropdown options:', error);
    throw error;
  }
}

// Add new row to Input_Kejadian sheet
export async function addKejadianRow(data: Record<string, string | number>) {
  try {
    const sheets = await getSheetClient();
    const sheetName = await getInputSheetName();
    
    const row = COLUMN_HEADERS.map(header => data[header]?.toString() || '');
    
    // Add timestamp at the beginning
    row[0] = new Date().toISOString();
    
    console.log('Adding row to sheet:', sheetName);
    console.log('Row data:', row);
    
    await sheets.spreadsheets.values.append({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A:AD`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error adding row:', error);
    throw error;
  }
}

// Update row in Input_Kejadian sheet
export async function updateKejadianRow(rowIndex: number, data: Record<string, string | number>) {
  try {
    const sheets = await getSheetClient();
    const sheetName = await getInputSheetName();
    
    const row = COLUMN_HEADERS.map(header => data[header]?.toString() || '');
    
    await sheets.spreadsheets.values.update({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A${rowIndex + 2}:AD${rowIndex + 2}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [row],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating row:', error);
    throw error;
  }
}

// Delete row from Input_Kejadian sheet
export async function deleteKejadianRow(rowId: number) {
  try {
    const sheets = await getSheetClient();
    
    // Get the sheet metadata to find the sheet ID
    const spreadsheet = await sheets.spreadsheets.get({
      spreadsheetId: SPREADSHEET_ID,
      fields: 'sheets.properties(sheetId,title)',
    });
    
    // Log all sheets with their IDs for debugging
    const allSheets = spreadsheet.data.sheets?.map(s => ({
      title: s.properties?.title,
      sheetId: s.properties?.sheetId,
    }));
    console.log('All sheets with IDs:', JSON.stringify(allSheets, null, 2));
    
    // Try to find the sheet with exact match first, then case-insensitive
    let inputSheet = spreadsheet.data.sheets?.find(
      sheet => sheet.properties?.title === 'Input_Kejadian'
    );
    
    if (!inputSheet) {
      inputSheet = spreadsheet.data.sheets?.find(
        sheet => sheet.properties?.title?.toLowerCase() === 'input_kejadian' ||
                 sheet.properties?.title?.toLowerCase().includes('input')
      );
    }
    
    console.log('Found inputSheet:', JSON.stringify(inputSheet?.properties, null, 2));
    
    // Check if sheetId exists (it could be 0 which is valid)
    const sheetId = inputSheet?.properties?.sheetId;
    if (sheetId === undefined || sheetId === null || inputSheet === undefined) {
      throw new Error(`Sheet tidak ditemukan. Available sheets: ${allSheets?.map(s => s.title).join(', ')}`);
    }
    
    // rowId is 1-based (1 = first data row)
    const startIndex = rowId;
    
    console.log('Deleting row with sheetId:', sheetId, 'rowId:', rowId, 'startIndex:', startIndex);
    
    await sheets.spreadsheets.batchUpdate({
      spreadsheetId: SPREADSHEET_ID,
      requestBody: {
        requests: [
          {
            deleteDimension: {
              range: {
                sheetId: sheetId,
                dimension: 'ROWS',
                startIndex: startIndex,
                endIndex: startIndex + 1,
              },
            },
          },
        ],
      },
    });

    return { success: true };
  } catch (error) {
    console.error('Error deleting row:', error);
    throw error;
  }
}

// Initialize sheet with headers if needed
export async function initializeSheet() {
  try {
    const sheets = await getSheetClient();
    const sheetName = await getInputSheetName();
    
    // Check if headers exist
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: `${sheetName}!A1:AD1`,
    });

    if (!response.data.values || response.data.values.length === 0) {
      // Add headers
      await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `${sheetName}!A1:AD1`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
          values: [COLUMN_HEADERS],
        },
      });
    }

    return { success: true };
  } catch (error) {
    console.error('Error initializing sheet:', error);
    throw error;
  }
}

// Upload PDF to Google Drive
export async function uploadPDFToDrive(filePath: string, filename: string): Promise<string> {
  try {
    const drive = await getDriveClient();
    const fs = await import('fs');
    
    const fileMetadata = {
      name: filename,
      parents: [DRIVE_FOLDER_ID],
    };

    const media = {
      mimeType: 'application/pdf',
      body: fs.createReadStream(filePath),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
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

    // Return the direct link
    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    console.log('PDF uploaded to Drive:', directUrl);
    return directUrl;
  } catch (error) {
    console.error('Error uploading PDF to Drive:', error);
    throw error;
  }
}

// Upload photo to Google Drive
export async function uploadPhotoToDrive(imageBuffer: Buffer, filename: string): Promise<string> {
  try {
    const drive = await getDriveClient();
    const { Readable } = await import('stream');
    
    const fileMetadata = {
      name: filename,
      parents: [PHOTO_FOLDER_ID],
    };

    const media = {
      mimeType: 'image/jpeg',
      body: Readable.from(imageBuffer),
    };

    const file = await drive.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, webViewLink',
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

    // Return the direct link
    const directUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;
    
    console.log('Photo uploaded to Drive:', directUrl);
    return directUrl;
  } catch (error) {
    console.error('Error uploading photo to Drive:', error);
    throw error;
  }
}

// Fetch Output_Kejadian sheet for PDF format reference
export async function fetchOutputKejadianFormat() {
  try {
    const sheets = await getSheetClient();
    
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: SPREADSHEET_ID,
      range: 'Output_Kejadian!A1:Z5',
    });

    const rows = response.data.values || [];
    console.log('Output_Kejadian format:', rows);
    return rows;
  } catch (error) {
    console.error('Error fetching Output_Kejadian:', error);
    return [];
  }
}
