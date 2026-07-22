/**
 * Shared file preview/download utilities
 * Extracted to eliminate code duplication across pages.
 */

/**
 * Determine file type category from a document object.
 * @param {{ file?: string }} doc
 * @returns {'pdf'|'image'|'video'|'docx'|'other'}
 */
export function getFileType(doc) {
  if (doc && doc.file) {
    const ext = doc.file.split('.').pop().toLowerCase();
    if (['pdf'].includes(ext)) return 'pdf';
    if (['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext)) return 'image';
    if (['mp4', 'webm', 'ogg'].includes(ext)) return 'video';
    if (['docx'].includes(ext)) return 'docx';
  }
  return 'other';
}

/**
 * Build a fully-qualified file URL from a document's file field.
 * @param {{ file?: string }} doc
 * @param {string} baseApiUrl - e.g. import.meta.env.VITE_BASE_API_URL
 * @returns {string|null}
 */
export function resolveFileUrl(doc, baseApiUrl) {
  if (!doc || !doc.file) return null;
  const filePath = doc.file;
  if (filePath.startsWith('http')) return filePath;
  if (filePath.startsWith('/')) return `${baseApiUrl}${filePath}`;
  return `${baseApiUrl}/media/${filePath}`;
}

/**
 * Trigger a file download in the browser.
 * @param {string} url
 * @param {string} [filename='documento']
 */
export function downloadFile(url, filename) {
  if (!url) return;
  const link = document.createElement('a');
  link.href = url;
  link.download = filename || 'documento';
  link.target = '_blank';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
