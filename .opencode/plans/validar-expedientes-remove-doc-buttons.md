# Plan: Eliminar botones ✓/✗ de validación de documentos en ValidarExpedientes

## Contexto
Esta sección es para validar **expedientes completos**, no documentos individuales. Los botones ✓/✗ de cada documento deben eliminarse, dejando solo el badge de estado "pendiente".

## Cambios

### 1. Eliminar función `handleDocumentStatus` (líneas 86-94)
Eliminar completamente estas 9 líneas:
```javascript
const handleDocumentStatus = async (docId, status) => {
  try {
    const newStatus = status === 'aprobado';
    await api.patch(`api/documents/${docId}/`, { approval_status: newStatus });
    setDocuments(documents.map(d => d.id === docId ? { ...d, approval_status: newStatus } : d));
  } catch (err) {
    console.error("Error updating doc:", err);
  }
};
```

### 2. Eliminar bloque de botones ✓/✗ del JSX (líneas 260-269)
Eliminar completamente estas 10 líneas:
```jsx
{status === 'pendiente' && (
  <>
    <button className="btn btn-success btn-sm" onClick={() => handleDocumentStatus(doc.id, 'aprobado')}>
      ✓
    </button>
    <button className="btn btn-danger btn-sm" onClick={() => handleDocumentStatus(doc.id, 'rechazado')}>
      ✗
    </button>
  </>
)}
```

## Resultado
Cada documento muestra: icono, nombre, tipo, badge de estado (pendiente/aprobado/rechazado), botón "Ver". La validación se hace a nivel de expediente con los botones del footer.
