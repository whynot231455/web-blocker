import { NextResponse } from 'next/server';
import JSZip from 'jszip';

export async function GET() {
  try {
    // 1. Fetch the master branch zip from GitHub
    const repoZipResponse = await fetch('https://github.com/whynot231455/web-blocker/archive/refs/heads/master.zip');
    if (!repoZipResponse.ok) {
      throw new Error(`Failed to fetch extension source from GitHub: ${repoZipResponse.statusText}`);
    }
    const repoZipBuffer = await repoZipResponse.arrayBuffer();

    // 2. Load the repository zip in JSZip
    const sourceZip = await JSZip.loadAsync(repoZipBuffer);
    const targetZip = new JSZip();

    // 3. Extract only the extension/ folder files and copy them to the target zip root
    const prefix = 'web-blocker-master/extension/';
    let fileCount = 0;

    for (const [relativePath, file] of Object.entries(sourceZip.files)) {
      if (relativePath.startsWith(prefix) && !file.dir) {
        const fileData = await file.async('uint8array');
        // Clean path (strip 'web-blocker-master/extension/')
        const cleanPath = relativePath.slice(prefix.length);
        targetZip.file(cleanPath, fileData);
        fileCount++;
      }
    }

    if (fileCount === 0) {
      throw new Error('No files found in the extension folder of the repository.');
    }

    // 4. Inject the generated lib/config.js with env variables
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
    const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

    const configContent = `/**
 * AUTO-GENERATED FILE - DO NOT EDIT MANUALLY
 * Generated dynamically by website /api/download-extension endpoint
 */
globalThis.CTRL_BLCK_CONFIG = {
    supabaseUrl: '${supabaseUrl}',
    supabaseKey: '${supabaseKey}'
};
`;
    targetZip.file('lib/config.js', configContent);

    // 5. Generate the target zip file
    const outputBuffer = await targetZip.generateAsync({ type: 'arraybuffer' });

    // 6. Return the zip as a download
    return new NextResponse(outputBuffer, {
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': 'attachment; filename=ctrl-blck-extension.zip',
      },
    });
  } catch (error: any) {
    console.error('Download extension error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate extension zip' },
      { status: 500 }
    );
  }
}
