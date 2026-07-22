import { useState, useEffect, useRef } from 'react';
import {
  requestCreateExpedient, requestDocumentOnly,
  getExpedients, getDocumentTypes, getExpedientDocuments,
} from '../../api/expedients.api';
import { getUsers } from '../../api/users.api';
import { useToast } from '../../context/ToastContext';
import { logError } from '../../utils/logger';

export default function SolicitarExpediente() {
  const { showToast } = useToast();
  const [mode, setMode] = useState('create');

  const [personName, setPersonName] = useState('');
  const [createDescription, setCreateDescription] = useState('');
  const [createSubmitting, setCreateSubmitting] = useState(false);
  const [createRecepcionistaId, setCreateRecepcionistaId] = useState('');
  const [recepcionistas, setRecepcionistas] = useState([]);

  const [expedients, setExpedients] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedExpedient, setSelectedExpedient] = useState(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [analysts, setAnalysts] = useState([]);
  const [analystId, setAnalystId] = useState('');
  const [recepcionistaId, setRecepcionistaId] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');
  const [updateSubmitting, setUpdateSubmitting] = useState(false);
  const [updateMode, setUpdateMode] = useState('newDoc');

  const [documentTypes, setDocumentTypes] = useState([]);
  const [selectedDocType, setSelectedDocType] = useState('');
  const [updateFileTitle, setUpdateFileTitle] = useState('');

  const [expedientDocuments, setExpedientDocuments] = useState([]);
  const [selectedDocId, setSelectedDocId] = useState('');
  const [loadingDocs, setLoadingDocs] = useState(false);

  const dropdownRef = useRef(null);

  useEffect(() => {
    if (mode === 'create') {
      getUsers()
        .then(res => {
          const users = res.data.results || res.data;
          setRecepcionistas(users.filter(u => u.rol === 'recepcionista'));
        })
        .catch(err => logError('Error fetching users:', err));
    }
  }, [mode]);

  useEffect(() => {
    if (mode === 'update') {
      getExpedients()
        .then(res => setExpedients(res.data))
        .catch(err => logError('Error fetching expedients:', err));
      getUsers()
        .then(res => {
          const users = res.data.results || res.data;
          setAnalysts(users.filter(u => u.rol === 'analyst'));
          setRecepcionistas(users.filter(u => u.rol === 'recepcionista'));
        })
        .catch(err => logError('Error fetching users:', err));
      getDocumentTypes()
        .then(res => setDocumentTypes(res.data))
        .catch(err => logError('Error fetching document types:', err));
    }
  }, [mode]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredExpedients = expedients.filter(e =>
    e.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    String(e.id).includes(searchTerm)
  );

  const resetUpdateForm = () => {
    setAnalystId('');
    setRecepcionistaId('');
    setUpdateDescription('');
    setSelectedDocType('');
    setSelectedDocId('');
    setExpedientDocuments([]);
    setUpdateFileTitle('');
  };

  const handleSelectExpedient = async (exp) => {
    setSelectedExpedient(exp);
    setShowDropdown(false);
    setSearchTerm('');
    resetUpdateForm();
    if (mode === 'update' && updateMode === 'update') {
      setLoadingDocs(true);
      try {
        const res = await getExpedientDocuments(exp.id);
        let docs = res.data;
        if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
          docs = docs.results || [];
        }
        setExpedientDocuments(Array.isArray(docs) ? docs : []);
      } catch (err) {
        logError('Error fetching expedient documents:', err);
        setExpedientDocuments([]);
      } finally {
        setLoadingDocs(false);
      }
    }
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    if (!personName.trim()) {
      showToast('Debes indicar el nombre de la persona', 'error');
      return;
    }
    if (!createRecepcionistaId) {
      showToast('Debes seleccionar un recepcionista', 'error');
      return;
    }
    setCreateSubmitting(true);
    try {
      await requestCreateExpedient({
        person_name: personName,
        description: createDescription,
        recepcionista_id: createRecepcionistaId,
      });
      showToast('Solicitud enviada al recepcionista y analistas', 'success');
      setPersonName('');
      setCreateDescription('');
      setCreateRecepcionistaId('');
    } catch (err) {
      logError('Error al solicitar:', err);
      showToast('Error al enviar la solicitud', 'error');
    } finally {
      setCreateSubmitting(false);
    }
  };

  const handleUpdateDocSubmit = async (e) => {
    e.preventDefault();
    if (!selectedExpedient) {
      showToast('Debes seleccionar un expediente', 'error');
      return;
    }
    if (!analystId) {
      showToast('Debes seleccionar un analista', 'error');
      return;
    }
    if (!recepcionistaId) {
      showToast('Debes seleccionar un recepcionista', 'error');
      return;
    }

    if (updateMode === 'newDoc') {
      if (!selectedDocType) {
        showToast('Debes seleccionar un tipo de documento', 'error');
        return;
      }
    }

    if (updateMode === 'update' && !selectedDocId) {
      showToast('Debes seleccionar un documento existente', 'error');
      return;
    }

    setUpdateSubmitting(true);
    try {
      if (updateMode === 'newDoc') {
        await requestDocumentOnly({
          expedient_id: selectedExpedient.id,
          document_type_id: selectedDocType,
          description: updateDescription,
          analyst_id: analystId,
          recepcionista_id: recepcionistaId,
        });
        showToast('Solicitud enviada al recepcionista', 'success');
      } else {
        await requestDocumentOnly({
          expedient_id: selectedExpedient.id,
          document_id: selectedDocId,
          description: updateDescription,
          analyst_id: analystId,
          recepcionista_id: recepcionistaId,
        });
        showToast('Actualización enviada al recepcionista', 'success');
      }
      setSelectedExpedient(null);
      setSearchTerm('');
      resetUpdateForm();
    } catch (err) {
      logError('Error al solicitar:', err);
      showToast('Error al enviar la solicitud', 'error');
    } finally {
      setUpdateSubmitting(false);
    }
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight mb-2">Solicitudes</h1>
        <p className="text-gray-500 mb-8">
          Envía solicitudes para la creación o actualización de documentos.
        </p>

        <div className="flex gap-2 mb-6 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
          <button
            onClick={() => { setMode('create'); resetUpdateForm(); setSelectedExpedient(null); }}
            className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === 'create' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Nuevo Expediente
          </button>
          <button
            onClick={() => setMode('update')}
            className={`flex-1 px-4 py-2.5 rounded-xl font-bold text-sm transition-all ${mode === 'update' ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' : 'text-gray-500 hover:text-gray-700'}`}
          >
            Actualización de Documento
          </button>
        </div>

        {mode === 'create' && (
          <form onSubmit={handleCreateSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Nombre de la persona</label>
              <input
                type="text"
                value={personName}
                onChange={(e) => setPersonName(e.target.value)}
                placeholder="Nombre y apellido"
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Recepcionista asignado</label>
              <select
                value={createRecepcionistaId}
                onChange={(e) => setCreateRecepcionistaId(e.target.value)}
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
              >
                <option value="">Seleccionar recepcionista</option>
                {recepcionistas.map(u => (
                  <option key={u.id} value={u.id}>{u.username}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">Motivo</label>
              <textarea
                value={createDescription}
                onChange={(e) => setCreateDescription(e.target.value)}
                placeholder="Describe el motivo de la solicitud..."
                rows="4"
                className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
            <button
              type="submit"
              disabled={createSubmitting}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 transition-all font-bold disabled:opacity-50"
            >
              {createSubmitting ? 'Enviando...' : 'Enviar Solicitud'}
            </button>
          </form>
        )}

        {mode === 'update' && (
          <>
            <div className="flex gap-2 mb-4 bg-white rounded-2xl p-1.5 shadow-sm border border-gray-100">
              <button
                onClick={() => { setUpdateMode('newDoc'); resetUpdateForm(); }}
                className={`flex-1 px-4 py-2 rounded-xl font-bold text-xs transition-all ${updateMode === 'newDoc' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Nuevo documento
              </button>
              <button
                onClick={() => {
                  setUpdateMode('update');
                  resetUpdateForm();
                  if (selectedExpedient) {
                    setLoadingDocs(true);
                    getExpedientDocuments(selectedExpedient.id)
                      .then(res => {
                        let docs = res.data;
                        if (docs && typeof docs === 'object' && !Array.isArray(docs)) {
                          docs = docs.results || [];
                        }
                        setExpedientDocuments(Array.isArray(docs) ? docs : []);
                      })
                      .catch(err => {
                        logError('Error fetching expedient documents:', err);
                        setExpedientDocuments([]);
                      })
                      .finally(() => setLoadingDocs(false));
                  }
                }}
                className={`flex-1 px-4 py-2 rounded-xl font-bold text-xs transition-all ${updateMode === 'update' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-200' : 'text-gray-500 hover:text-gray-700'}`}
              >
                Actualizar existente
              </button>
            </div>

            <form onSubmit={handleUpdateDocSubmit} className="bg-white rounded-3xl p-8 shadow-sm border border-gray-100 space-y-6">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-sm font-bold text-gray-700 mb-2">Seleccionar expediente</label>
                {selectedExpedient ? (
                  <div className="flex items-center justify-between bg-gray-50 rounded-2xl px-4 py-3">
                    <div>
                      <span className="font-bold text-gray-900">#{selectedExpedient.id}</span>
                      <span className="text-gray-600 ml-2">{selectedExpedient.title}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => { setSelectedExpedient(null); setSearchTerm(''); resetUpdateForm(); }}
                      className="text-red-500 hover:text-red-700 text-sm font-bold bg-transparent border-0 cursor-pointer"
                    >
                      Cambiar
                    </button>
                  </div>
                ) : (
                  <>
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => { setSearchTerm(e.target.value); setShowDropdown(true); }}
                      onFocus={() => setShowDropdown(true)}
                      placeholder="Buscar expediente por nombre o ID..."
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                    {showDropdown && (
                      <div className="absolute z-10 mt-1 w-full bg-white rounded-2xl shadow-lg border border-gray-100 max-h-60 overflow-y-auto">
                        {filteredExpedients.length === 0 ? (
                          <div className="p-4 text-center text-gray-400 text-sm">No se encontraron expedientes</div>
                        ) : (
                          filteredExpedients.map(exp => (
                            <button
                              key={exp.id}
                              type="button"
                              onClick={() => handleSelectExpedient(exp)}
                              className="w-full text-left px-4 py-3 hover:bg-blue-50 border-b border-gray-50 last:border-b-0 transition-colors bg-transparent cursor-pointer"
                            >
                              <span className="font-bold text-gray-800">#{exp.id}</span>
                              <span className="text-gray-600 ml-2">{exp.title}</span>
                              <span className="text-xs text-gray-400 ml-auto float-right">{exp.status}</span>
                            </button>
                          ))
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>

              {selectedExpedient && (
                <>
                  {updateMode === 'update' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Documento a actualizar</label>
                      {loadingDocs ? (
                        <div className="p-4 text-center text-gray-400 text-sm bg-gray-50 rounded-2xl">Cargando documentos...</div>
                      ) : expedientDocuments.length === 0 ? (
                        <div className="p-4 text-center text-gray-400 text-sm bg-gray-50 rounded-2xl">Este expediente no tiene documentos</div>
                      ) : (
                        <div className="space-y-2">
                          {expedientDocuments.map(doc => (
                            <button
                              key={doc.id}
                              type="button"
                              onClick={() => setSelectedDocId(doc.id)}
                              className={`w-full text-left px-4 py-3 rounded-2xl border-2 transition-all ${
                                selectedDocId === doc.id
                                  ? 'border-indigo-500 bg-indigo-50'
                                  : 'border-gray-100 bg-gray-50 hover:border-gray-200'
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <span className="font-bold text-gray-800 text-sm">{doc.title}</span>
                                  <span className="text-xs text-gray-400 ml-2">{doc.document_type_name || 'Sin tipo'}</span>
                                </div>
                                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                                  doc.file
                                    ? doc.approval_status === true ? 'bg-green-100 text-green-700'
                                      : doc.approval_status === false ? 'bg-red-100 text-red-700'
                                      : 'bg-yellow-100 text-yellow-700'
                                    : 'bg-blue-100 text-blue-700'
                                }`}>
                                  {doc.file
                                    ? doc.approval_status === true ? 'Aprobado'
                                      : doc.approval_status === false ? 'Rechazado'
                                      : 'Pendiente'
                                    : 'Sin archivo'}
                                </span>
                              </div>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {updateMode === 'newDoc' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Tipo de documento</label>
                      <select
                        value={selectedDocType}
                        onChange={(e) => setSelectedDocType(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        <option value="">Seleccionar tipo de documento</option>
                        {documentTypes.map(dt => (
                          <option key={dt.id} value={dt.id}>{dt.name}</option>
                        ))}
                      </select>
                    </div>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Analista</label>
                      <select
                        value={analystId}
                        onChange={(e) => setAnalystId(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        <option value="">Seleccionar analista</option>
                        {analysts.map(u => (
                          <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Recepcionista</label>
                      <select
                        value={recepcionistaId}
                        onChange={(e) => setRecepcionistaId(e.target.value)}
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none text-sm"
                      >
                        <option value="">Seleccionar recepcionista</option>
                        {recepcionistas.map(u => (
                          <option key={u.id} value={u.id}>{u.username}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {updateMode === 'newDoc' && (
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">Título del documento</label>
                      <input
                        type="text"
                        value={updateFileTitle}
                        onChange={(e) => setUpdateFileTitle(e.target.value)}
                        placeholder="Nombre descriptivo del documento"
                        className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      {updateMode === 'newDoc' ? 'Motivo de la actualización' : 'Instrucciones para el recepcionista'}
                    </label>
                    <textarea
                      value={updateDescription}
                      onChange={(e) => setUpdateDescription(e.target.value)}
                      placeholder={
                        updateMode === 'newDoc'
                          ? 'Describe qué documentos deben actualizarse y por qué...'
                          : 'Describe qué tipo de documento debe subir el recepcionista y cualquier detalle relevante...'
                      }
                      rows="3"
                      className="w-full px-4 py-3 bg-gray-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none"
                    />
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={updateSubmitting || !selectedExpedient}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-2xl shadow-lg shadow-blue-200 transition-all font-bold disabled:opacity-50"
              >
                {updateSubmitting
                  ? 'Enviando...'
                  : updateMode === 'newDoc'
                    ? 'Enviar Solicitud'
                    : 'Solicitar Actualización al Recepcionista'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
