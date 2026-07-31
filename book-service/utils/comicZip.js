const AdmZip = require('adm-zip');
const path = require('path');
const { uploadComicPage } = require('../config/upload');

const IMAGE_EXTS = new Set(['.jpg', '.jpeg', '.png', '.gif', '.webp']);

const extractNumber = (name) => {
    const match = String(name).match(/(\d+)/g);
    if (!match) return null;
    return parseInt(match[match.length - 1], 10);
};

const extractComicPages = async (zipBuffer) => {
    const zip = new AdmZip(zipBuffer);
    const entries = zip.getEntries()
        .filter((entry) => !entry.isDirectory)
        .filter((entry) => IMAGE_EXTS.has(path.extname(entry.entryName).toLowerCase()))
        .sort((a, b) => {
            const na = extractNumber(a.entryName);
            const nb = extractNumber(b.entryName);
            if (na !== null && nb !== null && na !== nb) return na - nb;
            return a.entryName.localeCompare(b.entryName, undefined, { numeric: true });
        });

    if (entries.length === 0) {
        const err = new Error('ZIP file contains no image pages');
        err.status = 400;
        throw err;
    }

    const pages = [];
    for (let i = 0; i < entries.length; i++) {
        const buffer = entries[i].getData();
        const uploaded = await uploadComicPage(buffer, i + 1);
        pages.push({ url: uploaded.url, publicId: uploaded.publicId, pageNumber: i + 1 });
    }
    return pages;
};

module.exports = { extractComicPages };
