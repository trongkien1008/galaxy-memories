import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, 'imagekit.private.json');
const JSON_FILE = path.join(__dirname, 'images.json');
const JS_FILE = path.join(__dirname, 'images.js');
const API = 'https://api.imagekit.io/v1/files';
const PAGE_SIZE = 1000;

async function readConfig() {
  let raw;
  try {
    raw = JSON.parse(await fs.readFile(CONFIG_FILE, 'utf8'));
  } catch {
    throw new Error('Cannot read imagekit.private.json. Run SETUP-IMAGEKIT.bat first.');
  }

  const privateKey = String(process.env.IMAGEKIT_PRIVATE_KEY || raw.privateKey || '').trim();
  const endpoint = String(raw.urlEndpoint || 'https://ik.imagekit.io/akf').replace(/\/$/, '');
  const rootPath = '/' + String(raw.rootPath || '/YTC_Memories').replace(/^\/+|\/+$/g, '');
  const folders = Array.isArray(raw.folders) && raw.folders.length
    ? raw.folders.map(String)
    : ['1','2','3','4','5','6','7','8'];

  if (!privateKey || privateKey === 'private_xxxxxxxxxxxxxxxxx') {
    throw new Error('ImageKit Private Key is missing in imagekit.private.json.');
  }

  return { privateKey, endpoint, rootPath, folders };
}

function authHeader(privateKey) {
  return 'Basic ' + Buffer.from(privateKey + ':').toString('base64');
}

function normalizePath(value) {
  const cleaned = '/' + String(value || '').replace(/^\/+|\/+$/g, '');
  return cleaned === '/' ? '/' : cleaned;
}

function parentPath(filePath) {
  const clean = normalizePath(filePath);
  const i = clean.lastIndexOf('/');
  return i <= 0 ? '/' : clean.slice(0, i);
}

async function listFolder(privateKey, folderPath) {
  const wantedPath = normalizePath(folderPath);
  const out = [];

  for (let skip = 0; ; skip += PAGE_SIZE) {
    const url = new URL(API);
    url.searchParams.set('path', wantedPath);
    url.searchParams.set('type', 'file');
    url.searchParams.set('sort', 'ASC_NAME');
    url.searchParams.set('limit', String(PAGE_SIZE));
    url.searchParams.set('skip', String(skip));

    const res = await fetch(url, {
      headers: {
        Authorization: authHeader(privateKey),
        Accept: 'application/json'
      }
    });

    if (!res.ok) {
      const body = await res.text().catch(() => '');
      throw new Error(`ImageKit API returned ${res.status} for ${wantedPath}: ${body.slice(0, 400)}`);
    }

    const rows = await res.json();
    if (!Array.isArray(rows)) {
      throw new Error(`ImageKit returned invalid data for ${wantedPath}.`);
    }

    // Keep only files directly inside this folder. This also avoids duplicates
    // if the API account happens to return descendants for a path query.
    for (const row of rows) {
      if (!row || row.type !== 'file') continue;
      if (parentPath(row.filePath || '') !== wantedPath) continue;
      out.push(row);
    }

    if (rows.length < PAGE_SIZE) break;
  }

  return out;
}

function encodeFilePath(filePath) {
  return String(filePath || '')
    .split('/')
    .map((part, i) => i === 0 ? '' : encodeURIComponent(part))
    .join('/');
}

function mimeFrom(row) {
  if (row.mime) return String(row.mime);
  const ext = String(row.name || '').split('.').pop().toLowerCase();
  if (['mp4','webm','mov','m4v'].includes(ext)) return ext === 'webm' ? 'video/webm' : 'video/mp4';
  if (ext === 'png') return 'image/png';
  if (ext === 'webp') return 'image/webp';
  if (ext === 'gif') return 'image/gif';
  if (ext === 'avif') return 'image/avif';
  return 'image/jpeg';
}

function isSupported(row) {
  const mime = mimeFrom(row);
  return mime.startsWith('image/') || mime.startsWith('video/');
}

function normalizeFile(row, groupId, endpoint) {
  const filePath = String(row.filePath || '');
  const encodedPath = encodeFilePath(filePath);
  const url = row.url || (endpoint + encodedPath);
  const mimeType = mimeFrom(row);
  const isVideo = mimeType.startsWith('video/');

  return {
    id: String(row.fileId || filePath || url),
    name: String(row.name || filePath.split('/').pop() || 'Memory'),
    filePath,
    url,
    thumbUrl: isVideo ? '' : `${endpoint}/tr:w-640,q-72${encodedPath}`,
    mimeType,
    fileType: isVideo ? 'video' : 'image',
    width: Number(row.width) || 0,
    height: Number(row.height) || 0,
    size: Number(row.size) || 0,
    createdAt: row.createdAt || '',
    updatedAt: row.updatedAt || '',
    groupId
  };
}

async function main() {
  const cfg = await readConfig();

  console.log('Galaxy Memories - updating from ImageKit');
  console.log('Endpoint:', cfg.endpoint);
  console.log('Root:', cfg.rootPath);

  const groups = cfg.folders.map(name => ({
    id: name,
    name,
    label: /^\d+$/.test(name) ? `N\u0102M ${name}` : name
  }));

  const files = [];

  for (const folder of cfg.folders) {
    const folderPath = normalizePath(`${cfg.rootPath}/${folder}`);
    process.stdout.write(`Reading ${folderPath} ... `);
    const rows = await listFolder(cfg.privateKey, folderPath);
    const supported = rows.filter(isSupported).map(row => normalizeFile(row, folder, cfg.endpoint));
    files.push(...supported);
    console.log(`${supported.length} media`);
  }

  // Files directly inside /YTC_Memories are shown as free-floating memories.
  process.stdout.write(`Reading ${cfg.rootPath} root files ... `);
  const rootRows = await listFolder(cfg.privateKey, cfg.rootPath);
  const rootFiles = rootRows.filter(isSupported).map(row => normalizeFile(row, null, cfg.endpoint));
  files.push(...rootFiles);
  console.log(`${rootFiles.length} media`);

  const manifest = {
    version: 5,
    generatedAt: new Date().toISOString(),
    endpoint: cfg.endpoint,
    rootPath: cfg.rootPath,
    groups,
    files
  };

  const json = JSON.stringify(manifest, null, 2) + '\n';
  await fs.writeFile(JSON_FILE, json, 'utf8');
  await fs.writeFile(
    JS_FILE,
    `/* AUTO-GENERATED. Do not edit manually. */\nwindow.YTC_MEDIA_MANIFEST = ${json.trim()};\n`,
    'utf8'
  );

  console.log(`\nDONE: ${files.length} media across ${groups.length} folders.`);
  console.log('Updated images.js and images.json.');
}

main().catch(err => {
  console.error('\nERROR:', err.message || err);
  process.exitCode = 1;
});
