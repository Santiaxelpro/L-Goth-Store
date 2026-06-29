const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

let hfClient = null;

function getHfClient() {
  if (hfClient) return hfClient;

  try {
    const { uploadFile, downloadFile, deleteFile } = require('@huggingface/hub');
    hfClient = { uploadFile, downloadFile, deleteFile };
    return hfClient;
  } catch {
    console.warn('[@huggingface/hub] not installed, falling back to local storage');
    return null;
  }
}

const HF_REPO_ID = process.env.HF_REPO_ID || '';
const HF_TOKEN = process.env.HF_TOKEN || '';
const HF_REPO_TYPE = process.env.HF_REPO_TYPE || 'model';
const USE_HF = !!(HF_REPO_ID && HF_TOKEN);
const HF_REPO = { type: HF_REPO_TYPE, name: HF_REPO_ID };

const LOCAL_UPLOAD_DIR = path.join(__dirname, '..', 'Imagenes');

if (!USE_HF && !fs.existsSync(LOCAL_UPLOAD_DIR)) {
  fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
}

function generateFileName(originalName) {
  const ext = path.extname(originalName);
  const hash = crypto.randomBytes(12).toString('hex');
  return `imagenes/${hash}${ext}`;
}

function getHfPathFromUrl(filePath) {
  if (!filePath) return '';

  if (!filePath.startsWith('http')) {
    return filePath.replace(/^\/+/, '');
  }

  try {
    const url = new URL(filePath);
    for (const marker of ['/resolve/main/', '/tree/']) {
      const markerIndex = url.pathname.indexOf(marker);
      if (markerIndex !== -1) {
        return decodeURIComponent(url.pathname.slice(markerIndex + marker.length));
      }
    }
  } catch {
    return path.basename(filePath);
  }

  return path.basename(filePath);
}

async function uploadToHF(buffer, filename) {
  const client = getHfClient();
  if (!client) throw new Error('Hugging Face client not available');

  try {
    await client.uploadFile({
      repo: HF_REPO,
      accessToken: HF_TOKEN,
      file: {
        path: filename,
        content: new Blob([buffer]),
      },
      commitTitle: `Upload ${filename}`,
    });

    const prefixMap = {
      model: '',
      dataset: 'datasets/',
      space: 'spaces/',
      bucket: 'buckets/',
    };
    const prefix = prefixMap[HF_REPO_TYPE] || '';
    return `https://huggingface.co/${prefix}${HF_REPO_ID}/resolve/main/${filename}`;
  } catch (err) {
    console.error('HF upload error:', err.message);
    throw err;
  }
}

async function deleteFromHF(filename) {
  const client = getHfClient();
  if (!client) throw new Error('Hugging Face client not available');

  try {
    await client.deleteFile({
      repo: HF_REPO,
      accessToken: HF_TOKEN,
      path: filename,
      commitTitle: `Delete ${filename}`,
    });
  } catch (err) {
    console.error('HF delete error:', err.message);
  }
}

async function readJsonFile(filePath, fallback = []) {
  if (USE_HF) {
    const client = getHfClient();
    if (!client) throw new Error('Hugging Face client not available');

    try {
      const blob = await client.downloadFile({
        repo: HF_REPO,
        accessToken: HF_TOKEN,
        path: filePath,
      });

      if (!blob) {
        await writeJsonFile(filePath, fallback);
        return fallback;
      }

      const text = await blob.text();
      return text.trim() ? JSON.parse(text) : fallback;
    } catch (err) {
      if (err.statusCode === 404) {
        console.warn(`HF repo not found, falling back to local storage for: ${filePath}`);
        return readLocalJsonFile(filePath, fallback);
      }
      throw err;
    }
  }

  return readLocalJsonFile(filePath, fallback);
}

function readLocalJsonFile(filePath, fallback = []) {
  const localPath = path.join(__dirname, '..', filePath);
  if (!fs.existsSync(localPath)) {
    fs.writeFileSync(localPath, JSON.stringify(fallback, null, 2));
    return fallback;
  }

  const data = fs.readFileSync(localPath, 'utf8');
  return data.trim() ? JSON.parse(data) : fallback;
}

async function writeJsonFile(filePath, data) {
  const serialized = JSON.stringify(data, null, 2);

  if (USE_HF) {
    const client = getHfClient();
    if (!client) throw new Error('Hugging Face client not available');

    try {
      await client.uploadFile({
        repo: HF_REPO,
        accessToken: HF_TOKEN,
        file: {
          path: filePath,
          content: new Blob([serialized], { type: 'application/json' }),
        },
        commitTitle: `Update ${filePath}`,
      });
      return;
    } catch (err) {
      if (err.statusCode === 404) {
        console.warn(`HF repo not found, falling back to local storage for write: ${filePath}`);
      } else {
        throw err;
      }
    }
  }

  const localPath = path.join(__dirname, '..', filePath);
  fs.writeFileSync(localPath, serialized);
}

async function saveImage(file) {
  const filename = generateFileName(file.originalname);

  if (USE_HF) {
    try {
      const url = await uploadToHF(file.buffer, filename);
      return { filename, url };
    } catch (err) {
      console.warn(`HF upload failed, falling back to local storage: ${err.message}`);
    }
  }

  const localFilename = path.basename(filename);
  const localPath = path.join(LOCAL_UPLOAD_DIR, localFilename);
  if (!fs.existsSync(LOCAL_UPLOAD_DIR)) {
    fs.mkdirSync(LOCAL_UPLOAD_DIR, { recursive: true });
  }
  fs.writeFileSync(localPath, file.buffer);
  return { filename: localFilename, url: `/imagenes/${localFilename}` };
}

function deleteImage(filename) {
  if (!filename) return;

  const localPath = path.join(LOCAL_UPLOAD_DIR, path.basename(filename));
  if (fs.existsSync(localPath)) {
    fs.unlinkSync(localPath);
  }

  if (USE_HF) {
    const name = getHfPathFromUrl(filename);
    deleteFromHF(name).catch(() => {});
  }
}

async function downloadFromHf(hfPath) {
  const client = getHfClient();
  if (!client) throw new Error('Hugging Face client not available');

  const blob = await client.downloadFile({
    repo: HF_REPO,
    accessToken: HF_TOKEN,
    path: hfPath,
  });

  return blob;
}

function resolveImageUrl(imagePath, req) {
  if (!imagePath) return '';

  if (imagePath.startsWith('http') && !imagePath.includes('huggingface.co')) {
    return imagePath;
  }

  if (imagePath.startsWith('http') && imagePath.includes('huggingface.co')) {
    const hfPath = getHfPathFromUrl(imagePath);
    return `/hf-images/${hfPath}`;
  }

  const localFile = path.basename(imagePath);
  if (localFile && fs.existsSync(path.join(LOCAL_UPLOAD_DIR, localFile))) {
    return `/imagenes/${localFile}`;
  }

  if (USE_HF) {
    const hfPath = getHfPathFromUrl(imagePath);
    return `/hf-images/${hfPath}`;
  }

  return `${req.protocol}://${req.get('host')}${imagePath.startsWith('/') ? imagePath : '/' + imagePath}`;
}

module.exports = {
  saveImage,
  deleteImage,
  resolveImageUrl,
  downloadFromHf,
  readJsonFile,
  writeJsonFile,
  USE_HF,
};
