import React from 'react';
import PropTypes from 'prop-types';

const FILE_ICONS = {
  pdf:    { bg: '#fee2e2', color: '#ef4444', label: 'PDF' },
  doc:    { bg: '#dbeafe', color: '#2563eb', label: 'DOC' },
  docx:   { bg: '#dbeafe', color: '#2563eb', label: 'DOCX' },
  xls:    { bg: '#d1fae5', color: '#10b981', label: 'XLS' },
  xlsx:   { bg: '#d1fae5', color: '#10b981', label: 'XLSX' },
  ppt:    { bg: '#fef3c7', color: '#f59e0b', label: 'PPT' },
  pptx:   { bg: '#fef3c7', color: '#f59e0b', label: 'PPTX' },
  jpg:    { bg: '#f3e8ff', color: '#8b5cf6', label: 'JPG' },
  jpeg:   { bg: '#f3e8ff', color: '#8b5cf6', label: 'JPEG' },
  png:    { bg: '#f3e8ff', color: '#8b5cf6', label: 'PNG' },
  gif:    { bg: '#f3e8ff', color: '#8b5cf6', label: 'GIF' },
  svg:    { bg: '#f3e8ff', color: '#8b5cf6', label: 'SVG' },
  webp:   { bg: '#f3e8ff', color: '#8b5cf6', label: 'WEBP' },
  mp4:    { bg: '#cffafe', color: '#06b6d4', label: 'MP4' },
  webm:   { bg: '#cffafe', color: '#06b6d4', label: 'WEBM' },
  ogg:    { bg: '#cffafe', color: '#06b6d4', label: 'OGG' },
};

export default function FileThumbnail({ fileUrl, title }) {
  const ext = fileUrl ? fileUrl.split('.').pop().toLowerCase() : '';
  const icon = FILE_ICONS[ext] || { bg: '#e2e8f0', color: '#64748b', label: 'FILE' };

  return (
    <div
      className="w-10 h-10 rounded-lg flex items-center justify-center text-[10px] font-bold uppercase shrink-0"
      style={{ background: icon.bg, color: icon.color }}
      title={title || fileUrl || 'Documento'}
    >
      {icon.label}
    </div>
  );
}

FileThumbnail.propTypes = {
  fileUrl: PropTypes.string,
  title: PropTypes.string,
};
