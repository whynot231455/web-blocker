import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { ImageResponse } from 'next/og';

export const alt = 'CTRL+BLCK: website blocker and focus mode Chrome extension';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

async function loadPixelFont() {
  try {
    // Rendered at build time from the website workspace root.
    return await readFile(path.join(process.cwd(), 'src/app/fonts/PressStart2P-Regular.ttf'));
  } catch {
    return null; // Falls back to the default font rather than failing the build.
  }
}

export default async function Image() {
  const font = await loadPixelFont();

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          background: '#ffffff',
          border: '16px solid #000000',
          padding: '0 72px',
          fontFamily: '"Press Start 2P", sans-serif',
          color: '#000000',
        }}
      >
        <div style={{ display: 'flex', fontSize: 40, letterSpacing: 2 }}>CTRL + BLCK</div>
        <div style={{ display: 'flex', flexDirection: 'column', marginTop: 48, fontSize: 54, lineHeight: 1.3 }}>
          <span>Block distracting</span>
          <span style={{ background: '#000000', color: '#ffffff', padding: '8px 20px', marginTop: 16, alignSelf: 'flex-start' }}>
            websites.
          </span>
        </div>
        <div style={{ display: 'flex', marginTop: 56, fontSize: 20, lineHeight: 1.6, color: '#444444' }}>
          Free website blocker and focus mode for Chrome
        </div>
        <div style={{ display: 'flex', position: 'absolute', right: 72, top: 64, width: 56, height: 56, background: '#FF4141', border: '6px solid #000000' }} />
      </div>
    ),
    {
      ...size,
      fonts: font ? [{ name: 'Press Start 2P', data: font, style: 'normal', weight: 400 }] : undefined,
    }
  );
}
