import React, { useState } from 'react';
import api from '../api/axios';

const DocumentForm = ({ expedientId, onSuccess }) => {
    const [selectedFile, setSelectedFile] = useState(null);
    const [title, setTitle] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!selectedFile) return setMessage('❌ Selecciona un archivo');

        setLoading(true);
        const data = new FormData();
        data.append('file', selectedFile);
        data.append('title', title || selectedFile.name);
        data.append('expedient', expedientId); // Relación con el expediente

        try {
            await api.post('documents/', data, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setMessage('✅ Documento subido con éxito');
            setSelectedFile(null);
            setTitle('');
            if (onSuccess) onSuccess();
        } catch (err) {
            setMessage('❌ Error al subir documento');
        } finally {
            setLoading(false);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label className="block text-sm font-bold text-gray-700">Título del Documento</label>
                <input 
                    type="text" 
                    className="form-input w-full border p-2 rounded" 
                    placeholder="Ej: Cédula de Identidad"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                />
            </div>

            <div className="border-2 border-dashed border-blue-200 p-6 rounded-lg text-center bg-blue-50">
                <input 
                    type="file" 
                    id="doc-upload" 
                    className="hidden" 
                    onChange={(e) => setSelectedFile(e.target.files[0])}
                />
                <label htmlFor="doc-upload" className="cursor-pointer">
                    <div className="text-blue-600 font-medium">
                        {selectedFile ? `📄 ${selectedFile.name}` : 'Haga clic para seleccionar archivo'}
                    </div>
                    <p className="text-xs text-gray-400 mt-1">PDF, PNG o JPG (Máx 10MB)</p>
                </label>
            </div>

            {message && <p className="text-sm text-center font-medium">{message}</p>}

            <button 
                type="submit" 
                disabled={loading}
                className={`btn btn-primary w-full ${loading ? 'opacity-50' : ''}`}
            >
                {loading ? 'Subiendo...' : 'Subir Documento'}
            </button>
        </form>
    );
};

export default DocumentForm;