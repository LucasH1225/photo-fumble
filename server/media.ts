import sharp from 'sharp';
import { fileTypeFromBuffer } from 'file-type';
import { parseBuffer } from 'music-metadata';
import { GameError, requireRule } from './engine.js';
import type { Mode } from '../shared/types.js';

sharp.concurrency(1);
sharp.cache({ memory: 32, files: 0 });
export interface Mask {
  x: number;
  y: number;
  width: number;
  height: number;
}
export function byteRange(header: string, size: number): [number, number] | undefined {
  const match = /^bytes=(\d*)-(\d*)$/.exec(header);
  if (!match || (!match[1] && !match[2])) return;
  const start = match[1] ? Number(match[1]) : Math.max(0, size - Number(match[2]));
  const end = match[1] && match[2] ? Math.min(Number(match[2]), size - 1) : size - 1;
  if (
    !Number.isSafeInteger(start) ||
    !Number.isSafeInteger(end) ||
    start < 0 ||
    start >= size ||
    end < start
  )
    return;
  return [start, end];
}
let processing = Promise.resolve();
export function processMedia(buffer: Buffer, mode: Mode, masks: Mask[]) {
  const task = processing.then(async () => {
    try {
      return await transform(buffer, mode, masks);
    } catch (error) {
      if (error instanceof GameError) throw error;
      throw new GameError(
        mode === 'voice'
          ? 'This recording could not be read. Try a valid MP3, M4A, or WAV file.'
          : 'This image could not be read. Use a JPEG, PNG, or WebP under 40 megapixels.',
      );
    }
  });
  processing = task.then(
    () => {},
    () => {},
  );
  return task;
}
async function transform(
  buffer: Buffer,
  mode: Mode,
  masks: Mask[],
): Promise<{ data: Buffer; mime: string; extension: string; blur?: Buffer }> {
  const type = await fileTypeFromBuffer(buffer);
  requireRule(type, 'This file type could not be read.');
  if (mode === 'voice') {
    requireRule(
      buffer.length <= 20 * 1024 * 1024 &&
        [
          'audio/mpeg',
          'audio/mp4',
          'video/mp4',
          'audio/x-m4a',
          'audio/wav',
          'audio/x-wav',
        ].includes(type.mime),
      'Upload an MP3, M4A, or WAV recording under 20 MB.',
    );
    const metadata = await parseBuffer(buffer, { mimeType: type.mime, size: buffer.length });
    requireRule(
      metadata.format.duration &&
        metadata.format.duration <= 60.1 &&
        metadata.format.numberOfChannels,
      'Use an audio recording no longer than 60 seconds.',
    );
    requireRule(
      !metadata.format.trackInfo?.some((track) => track.type === 1),
      'Upload an audio recording rather than a video.',
    );
    return {
      data: buffer,
      mime: type.ext === 'mp3' ? 'audio/mpeg' : type.ext === 'wav' ? 'audio/wav' : 'audio/mp4',
      extension: type.ext === 'mp3' ? 'mp3' : type.ext === 'wav' ? 'wav' : 'm4a',
    };
  }
  requireRule(
    buffer.length <= 10 * 1024 * 1024 &&
      ['image/jpeg', 'image/png', 'image/webp'].includes(type.mime),
    'Upload a JPEG, PNG, or WebP under 10 MB. For HEIC, export as JPEG first.',
  );
  const normalized = await sharp(buffer, { limitInputPixels: 40_000_000, animated: false })
    .rotate()
    .resize({ width: 2048, height: 2048, fit: 'inside', withoutEnlargement: true })
    .webp({ quality: 88 })
    .toBuffer({ resolveWithObject: true });
  let data = normalized.data;
  if (mode === 'chat' && masks.length) {
    const { width, height } = normalized.info;
    const rectangles = masks
      .map(
        (m) =>
          `<rect x="${Math.floor(m.x * width)}" y="${Math.floor(m.y * height)}" width="${Math.ceil(m.width * width)}" height="${Math.ceil(m.height * height)}" fill="#182443"/>`,
      )
      .join('');
    data = await sharp(data)
      .composite([
        { input: Buffer.from(`<svg width="${width}" height="${height}">${rectangles}</svg>`) },
      ])
      .webp({ quality: 88 })
      .toBuffer();
  }
  let blur: Buffer | undefined;
  if (mode === 'impostor') {
    const tiny = await sharp(data)
      .resize({ width: 24, height: 24, fit: 'inside' })
      .blur(1.2)
      .webp()
      .toBuffer();
    blur = await sharp(tiny).resize({ width: 1024, height: 1024, fit: 'inside' }).webp().toBuffer();
  }
  return { data, mime: 'image/webp', extension: 'webp', blur };
}
