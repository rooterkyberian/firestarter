#!/usr/bin/env node

/**
 * Package the extension into a zip file for distribution
 */

import { createWriteStream } from 'fs';
import { readdir, stat } from 'fs/promises';
import { join, relative } from 'path';
import { createGzip } from 'zlib';
import archiver from 'archiver';

const OUTPUT_DIR = 'dist';
const OUTPUT_FILE = 'firestarter-extension.zip';

async function packageExtension() {
  console.log('📦 Packaging extension...');

  // Create a file to stream archive data to
  const output = createWriteStream(OUTPUT_FILE);
  const archive = archiver('zip', {
    zlib: { level: 9 }, // Maximum compression
  });

  // Listen for all archive data to be written
  output.on('close', () => {
    const sizeInMB = (archive.pointer() / 1024 / 1024).toFixed(2);
    console.log(`✅ Extension packaged successfully!`);
    console.log(`📦 File: ${OUTPUT_FILE}`);
    console.log(`📊 Size: ${sizeInMB} MB`);
    console.log(`\nYou can now:`);
    console.log(`1. Load unpacked extension from "${OUTPUT_DIR}" folder`);
    console.log(`2. Upload "${OUTPUT_FILE}" to Chrome Web Store`);
  });

  // Catch warnings
  archive.on('warning', (err) => {
    if (err.code === 'ENOENT') {
      console.warn('⚠️ Warning:', err);
    } else {
      throw err;
    }
  });

  // Catch errors
  archive.on('error', (err) => {
    throw err;
  });

  // Pipe archive data to the file
  archive.pipe(output);

  // Append files from dist directory
  archive.directory(OUTPUT_DIR, false);

  // Finalize the archive
  await archive.finalize();
}

packageExtension().catch((error) => {
  console.error('❌ Error packaging extension:', error);
  process.exit(1);
});
