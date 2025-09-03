// Variables globales
let csvData = [];
let filteredData = [];
let columnNames = [];
let contratistaEmails = {}; // Objeto para almacenar los correos por contratista

// Elementos DOM
const csvFileInput = document.getElementById('csv-file');
const fileNameDisplay = document.getElementById('file-name');
const delimiterSelect = document.getElementById('delimiter');
const hasHeaderCheckbox = document.getElementById('has-header');
const emailsTextarea = document.getElementById('contratista-emails');
const loadEmailsBtn = document.getElementById('load-emails');
const previewTable = document.getElementById('preview-table');
const contratistaFilter = document.getElementById('contratista-filter');
const selectAllBtn = document.getElementById('select-all');
const deselectAllBtn = document.getElementById('deselect-all');
const prioridadFilter = document.getElementById('prioridad-filter');
const applyFilterBtn = document.getElementById('apply-filter');
const resultsTable = document.getElementById('results-table');
const resultsCount = document.getElementById('results-count');
const selectedContratistasSpan = document.getElementById('selected-contratistas');
const emailsPanel = document.getElementById('contratista-emails-panel');
const selectedEmailsSpan = document.getElementById('selected-emails');
const copyEmailsBtn = document.getElementById('copy-emails');
const clearEmailsBtn = document.getElementById('clear-emails');
const exportCsvBtn = document.getElementById('export-csv');
const copyResultsBtn = document.getElementById('copy-results');
const selectedRowsCount = document.getElementById('selected-rows');
const statusMessage = document.getElementById('status-message');

// Cargar datos guardados al iniciar
document.addEventListener('DOMContentLoaded', function() {
    loadSavedData();
    setupEventListeners();
    loadExampleData();
});

// Configurar event listeners
function setupEventListeners() {
    // Cargar correos de contratistas
    loadEmailsBtn.addEventListener('click', function() {
        const emailsText = emailsTextarea.value.trim();
        
        if (!emailsText) {
            showStatus('No hay correos para cargar', 'warning');
            return;
        }
        
        try {
            parseEmails(emailsText);
            saveToLocalStorage('contratistaEmails', contratistaEmails);
            showStatus('Correos cargados correctamente', 'success');
            updateSelectedEmails();
        } catch (error) {
            showStatus('Error al procesar los correos: ' + error.message, 'error');
        }
    });

    // Cargar archivo CSV
    csvFileInput.addEventListener('change', function(e) {
        const file = e.target.files[0];
        if (!file) return;
        
        fileNameDisplay.textContent = file.name;
        showStatus('Procesando archivo CSV...', 'info');
        
        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const content = e.target.result;
                let delimiter = delimiterSelect.value;
                
                // Auto-detectar delimitador si es necesario
                if (delimiter === 'auto') {
                    delimiter = detectDelimiter(content);
                    showStatus(`Delimitador detectado: "${delimiter}"`, 'info');
                }
                
                const hasHeader = hasHeaderCheckbox.checked;
                
                // Procesar el CSV
                processCSV(content, delimiter, hasHeader);
                saveToLocalStorage('csvData', csvData);
                saveToLocalStorage('columnNames', columnNames);
            } catch (error) {
                showStatus('Error al procesar el CSV: ' + error.message, 'error');
            }
        };
        reader.onerror = function() {
            showStatus('Error al leer el archivo', 'error');
        };
        reader.readAsText(file);
    });

    // Seleccionar todos los contratistas
    selectAllBtn.addEventListener('click', function() {
        for (let i = 0; i < contratistaFilter.options.length; i++) {
            contratistaFilter.options[i].selected = true;
        }
        updateSelectedEmails();
        showStatus('Todos los contratistas seleccionados', 'info');
    });

    // Deseleccionar todos los contratistas
    deselectAllBtn.addEventListener('click', function() {
        for (let i = 0; i < contratistaFilter.options.length; i++) {
            contratistaFilter.options[i].selected = false;
        }
        updateSelectedEmails();
        showStatus('Todos los contratistas deseleccionados', 'info');
    });

    // Aplicar filtro por contratista y prioridad
    applyFilterBtn.addEventListener('click', function() {
        applyFilter();
    });

    // Actualizar correos cuando se seleccionan contratistas
    contratistaFilter.addEventListener('change', function() {
        updateSelectedEmails();
    });

    // Copiar correos al portapapeles
    copyEmailsBtn.addEventListener('click', function() {
        copyEmailsToClipboard();
    });

    // Limpiar selección de correos
    clearEmailsBtn.addEventListener('click', function() {
        selectedEmailsSpan.textContent = 'No hay correos cargados para los contratistas seleccionados';
        emailsPanel.style.display = 'none';
    });

    // Exportar a CSV
    exportCsvBtn.addEventListener('click', function() {
        exportToCSV();
    });

    // Copiar resultados
    copyResultsBtn.addEventListener('click', function() {
        copyResultsToClipboard();
    });
}

// Cargar datos guardados del localStorage
function loadSavedData() {
    const savedCSVData = loadFromLocalStorage('csvData');
    const savedColumnNames = loadFromLocalStorage('columnNames');
    const savedEmails = loadFromLocalStorage('contratistaEmails');
    
    if (savedCSVData && savedColumnNames) {
        csvData = savedCSVData;
        columnNames = savedColumnNames;
        fileNameDisplay.textContent = 'archivo_cargado_anteriormente.csv';
        showStatus('Datos CSV cargados desde almacenamiento local', 'info');
        updateContratistaSelect();
        showPreview();
    }
    
    if (savedEmails) {
        contratistaEmails = savedEmails;
        // Mostrar emails en el textarea
        let emailsText = '';
        for (const [contratista, emails] of Object.entries(contratistaEmails)) {
            emailsText += `${contratista}:${emails.join(',')}\n`;
        }
        emailsTextarea.value = emailsText.trim();
        showStatus('Correos cargados desde almacenamiento local', 'info');
    }
}

// Cargar datos de ejemplo
function loadExampleData() {
    // Solo cargar ejemplos si no hay datos guardados
    if (csvData.length === 0) {
        // Ejemplo de datos CSV con prioridad
        const exampleCSV = `NroTicket,Nodo,Contratista,Prioridad,Descripcion,Estado
12345,NODO_A,Contratista_X,Alta,Problema de conexión,Resuelto
67890,NODO_B,Contratista_Y,Media,Corte de fibra,En proceso
54321,NODO_A,Contratista_X,Alta,Actualización de software,Pendiente
98765,NODO_C,Contratista_Z,Baja,Configuración router,Resuelto
12346,NODO_A,Contratista_X,Alta,Problema de velocidad,En proceso
13579,NODO_B,Contratista_Y,Media,Instalación nuevo equipo,Completado
24680,NODO_C,Contratista_Z,Alta,Mantenimiento preventivo,Programado`;

        // Simular carga de archivo
        fileNameDisplay.textContent = 'ejemplo_tickets.csv';
        processCSV(exampleCSV, ',', true);
        showStatus('Ejemplo CSV cargado. Puedes probar los filtros.', 'info');
    }
    
    if (Object.keys(contratistaEmails).length === 0) {
        // Ejemplo de datos de correos
        const exampleEmails = `Contratista_X:juan@contratistax.com,maria@contratistax.com
Contratista_Y:carlos@contratistay.com,ana@contratistay.com
Contratista_Z:pedro@contratistaz.com,laura@contratistaz.com,admin@contratistaz.com`;
        
        emailsTextarea.value = exampleEmails;
        showStatus('Ejemplo de correos cargado. Haz clic en "Cargar Correos".', 'info');
    }
}

// Función para guardar en localStorage
function saveToLocalStorage(key, data) {
    try {
        localStorage.setItem(key, JSON.stringify(data));
    } catch (error) {
        console.error('Error guardando en localStorage:', error);
        showStatus('Error al guardar datos localmente', 'error');
    }
}

// Función para cargar desde localStorage
function loadFromLocalStorage(key) {
    try {
        const data = localStorage.getItem(key);
        return data ? JSON.parse(data) : null;
    } catch (error) {
        console.error('Error cargando desde localStorage:', error);
        return null;
    }
}

// Función para detectar el delimitador
function detectDelimiter(csvContent) {
    const firstLine = csvContent.split('\n')[0];
    const delimiters = [',', ';', '\t', '|'];
    let maxCount = 0;
    let detectedDelimiter = ',';
    
    for (const delimiter of delimiters) {
        const count = (firstLine.match(new RegExp(`\\${delimiter}`, 'g')) || []).length;
        if (count > maxCount) {
            maxCount = count;
            detectedDelimiter = delimiter;
        }
    }
    
    return detectedDelimiter;
}

// Función para procesar CSV manualmente
function processCSV(csvContent, delimiter = ',', hasHeader = true) {
    // Limpiar contenido - eliminar comillas y espacios extra
    let lines = csvContent.split(/\r\n|\n/).filter(line => line.trim() !== '');
    
    if (lines.length === 0) {
        showStatus('El archivo CSV está vacío', 'error');
        return;
    }
    
    // Obtener encabezados
    if (hasHeader) {
        const headerLine = lines[0];
        columnNames = parseCSVLine(headerLine, delimiter);
        lines = lines.slice(1); // Eliminar la línea de encabezado
    } else {
        // Generar nombres de columnas automáticamente (Col1, Col2, ...)
        const firstLine = parseCSVLine(lines[0], delimiter);
        columnNames = firstLine.map((_, index) => `Col${index + 1}`);
    }
    
    // Verificar que existen las columnas necesarias
    const contratistaColumn = findColumnByName(columnNames, 'contratista');
    const ticketColumn = findColumnByName(columnNames, 'ticket');
    const nodoColumn = findColumnByName(columnNames, 'nodo');
    const prioridadColumn = findColumnByName(columnNames, 'prioridad');
    
    if (!contratistaColumn) {
        showStatus('Advertencia: No se encontró la columna "Contratista"', 'warning');
    }
    
    if (!ticketColumn) {
        showStatus('Advertencia: No se encontró la columna "NroTicket"', 'warning');
    }
    
    if (!nodoColumn) {
        showStatus('Advertencia: No se encontró la columna "Nodo"', 'warning');
    }
    
    if (!prioridadColumn) {
        showStatus('Advertencia: No se encontró la columna "Prioridad"', 'warning');
    }
    
    // Procesar datos
    csvData = [];
    let errorCount = 0;
    
    for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim() === '') continue; // Saltar líneas vacías
        
        try {
            const values = parseCSVLine(lines[i], delimiter);
            const row = {};
            
            // Asignar valores a las columnas
            columnNames.forEach((col, index) => {
                row[col] = index < values.length ? values[index] : '';
            });
            
            csvData.push(row);
        } catch (error) {
            errorCount++;
            console.error(`Error en línea ${i + (hasHeader ? 2 : 1)}:`, error);
        }
    }
    
    if (csvData.length === 0) {
        showStatus('No se pudieron procesar datos del CSV', 'error');
        return;
    }
    
    if (errorCount > 0) {
        showStatus(`CSV procesado con ${errorCount} errores. ${csvData.length} registros válidos encontrados.`, 'warning');
    } else {
        showStatus(`CSV procesado correctamente. ${csvData.length} registros encontrados.`, 'success');
    }
    
    // Actualizar selector de contratistas
    updateContratistaSelect();
    
    // Mostrar vista previa
    showPreview();
}

// Función para analizar una línea CSV
function parseCSVLine(line, delimiter = ',') {
    const result = [];
    let current = '';
    let inQuotes = false;
    let quoteChar = null;
    
    for (let i = 0; i < line.length; i++) {
        const char = line[i];
        
        if (inQuotes) {
            if (char === quoteChar) {
                // Fin de comillas
                inQuotes = false;
            } else {
                current += char;
            }
        } else {
            if (char === '"' || char === "'") {
                // Inicio de comillas
                inQuotes = true;
                quoteChar = char;
            } else if (char === delimiter) {
                // Fin del campo
                result.push(current.trim());
                current = '';
            } else {
                current += char;
            }
        }
    }
    
    // Añadir el último campo
    result.push(current.trim());
    
    return result;
}

// Función para encontrar columna por nombre (case insensitive)
function findColumnByName(columns, partialName) {
    return columns.find(col => 
        col.toLowerCase().includes(partialName.toLowerCase())
    );
}

// Actualizar selector de contratistas
function updateContratistaSelect() {
    const contratistaColumn = findColumnByName(columnNames, 'contratista');
    
    if (!contratistaColumn) {
        showStatus('No se encontró la columna "Contratista"', 'error');
        return;
    }
    
    // Obtener valores únicos de contratistas
    const uniqueContratistas = [...new Set(csvData.map(row => row[contratistaColumn]))]
        .filter(val => val !== undefined && val !== null && val !== '')
        .sort();
    
    // Actualizar select de contratistas
    contratistaFilter.innerHTML = '<option value="">-- Selecciona uno o más contratistas --</option>';
    uniqueContratistas.forEach(contratista => {
        const option = document.createElement('option');
        option.value = contratista;
        option.textContent = contratista;
        contratistaFilter.appendChild(option);
    });
}

// Función para analizar los correos de contratistas
function parseEmails(emailsText) {
    contratistaEmails = {}; // Reiniciar objeto
    const lines = emailsText.split('\n').filter(line => line.trim() !== '');
    
    for (const line of lines) {
        const separatorIndex = line.indexOf(':');
        if (separatorIndex === -1) {
            throw new Error(`Formato incorrecto en línea: "${line}". Usa "Contratista:email1,email2"`);
        }
        
        const contratista = line.substring(0, separatorIndex).trim();
        const emailsString = line.substring(separatorIndex + 1).trim();
        
        if (!contratista) {
            throw new Error(`Nombre de contratista vacío en línea: "${line}"`);
        }
        
        const emails = emailsString.split(',').map(email => email.trim()).filter(email => email !== '');
        
        if (emails.length === 0) {
            throw new Error(`No hay correos para el contratista: "${contratista}"`);
        }
        
        // Validar formatos de email
        for (const email of emails) {
            if (!isValidEmail(email)) {
                throw new Error(`Formato de email inválido: "${email}" para el contratista "${contratista}"`);
            }
        }
        
        contratistaEmails[contratista] = emails;
    }
    
    console.log('Correos cargados:', contratistaEmails);
}

// Función para validar formato de email
function isValidEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
}

// Aplicar filtro por contratista y prioridad
function applyFilter() {
    const selectedOptions = Array.from(contratistaFilter.selectedOptions);
    const selectedValues = selectedOptions.map(option => option.value).filter(value => value !== "");
    const prioridadValue = prioridadFilter.value;
    
    if (selectedValues.length === 0) {
        showStatus('Selecciona al menos un contratista para filtrar', 'warning');
        return;
    }
    
    const contratistaColumn = findColumnByName(columnNames, 'contratista');
    const ticketColumn = findColumnByName(columnNames, 'ticket') || 'NroTicket';
    const nodoColumn = findColumnByName(columnNames, 'nodo') || 'Nodo';
    const prioridadColumn = findColumnByName(columnNames, 'prioridad') || 'Prioridad';
    
    // Filtrar datos por contratistas seleccionados
    let filteredByContratista = csvData.filter(row => {
        return selectedValues.includes(row[contratistaColumn]);
    });
    
    // Aplicar filtro de prioridad si está seleccionado
    if (prioridadValue === 'alta') {
        filteredData = filteredByContratista.filter(row => {
            const prioridad = String(row[prioridadColumn] || '').toLowerCase();
            return prioridad.includes('alta');
        });
    } else {
        filteredData = filteredByContratista;
    }
    
    if (filteredData.length === 0) {
        showStatus('No se encontraron registros para los criterios seleccionados', 'warning');
        return;
    }
    
    // Actualizar texto de contratistas seleccionados
    if (selectedValues.length === 1) {
        selectedContratistasSpan.textContent = selectedValues[0];
    } else if (selectedValues.length <= 3) {
        selectedContratistasSpan.textContent = selectedValues.join(', ');
    } else {
        selectedContratistasSpan.textContent = `${selectedValues.length} contratistas seleccionados`;
    }
    
    // Añadir info de prioridad al texto
    if (prioridadValue === 'alta') {
        selectedContratistasSpan.textContent += ' (Solo Prioridad Alta)';
    }
    
    resultsCount.textContent = `(${filteredData.length} registros)`;
    showStatus(`Filtro aplicado. ${filteredData.length} registros encontrados para ${selectedValues.length} contratista(s)` + 
               (prioridadValue === 'alta' ? ' con Prioridad Alta.' : '.'), 'success');
    
    // Mostrar resultados
    showFilterResults(contratistaColumn, ticketColumn, nodoColumn, prioridadColumn);
    
    // Actualizar contador
    selectedRowsCount.textContent = filteredData.length;
}

// Actualizar correos mostrados según contratistas seleccionados
function updateSelectedEmails() {
    const selectedOptions = Array.from(contratistaFilter.selectedOptions);
    const selectedValues = selectedOptions.map(option => option.value).filter(value => value !== "");
    
    if (selectedValues.length === 0 || Object.keys(contratistaEmails).length === 0) {
        emailsPanel.style.display = 'none';
        selectedEmailsSpan.textContent = 'No hay correos cargados para los contratistas seleccionados';
        return;
    }
    
    // Obtener correos únicos de todos los contratistas seleccionados
    let allEmails = [];
    for (const contratista of selectedValues) {
        if (contratistaEmails[contratista]) {
            allEmails = [...allEmails, ...contratistaEmails[contratista]];
        }
    }
    
    // Eliminar duplicados
    const uniqueEmails = [...new Set(allEmails)];
    
    if (uniqueEmails.length === 0) {
        emailsPanel.style.display = 'none';
        selectedEmailsSpan.textContent = 'No hay correos cargados para los contratistas seleccionados';
        return;
    }
    
    // Mostrar correos
    emailsPanel.style.display = 'block';
    selectedEmailsSpan.innerHTML = uniqueEmails.map(email => 
        `<span class="email-badge">${email}</span>`
    ).join(' ') || 'No hay correos para los contratistas seleccionados';
}

// Copiar correos al portapapeles
function copyEmailsToClipboard() {
    const emailBadges = selectedEmailsSpan.querySelectorAll('.email-badge');
    
    if (emailBadges.length === 0) {
        showStatus('No hay correos para copiar', 'warning');
        return;
    }
    
    // Obtener todos los emails como texto separado por comas
    const emailsArray = Array.from(emailBadges).map(badge => badge.textContent);
    const emailsToCopy = emailsArray.join(', ');
    
    navigator.clipboard.writeText(emailsToCopy).then(() => {
        showStatus('Correos copiados al portapapeles', 'success');
    }).catch(err => {
        showStatus('Error al copiar correos: ' + err, 'error');
    });
}

// Mostrar vista previa del CSV
function showPreview() {
    const previewData = csvData.slice(0, 5); // Primeras 5 filas
    
    let tableHTML = '';
    
    if (previewData.length > 0) {
        tableHTML = `
            <thead>
                <tr>
                    ${columnNames.map(col => `<th>${col}</th>`).join('')}
                </tr>
            </thead>
            <tbody>
        `;
        
        previewData.forEach(row => {
            tableHTML += '<tr>';
            columnNames.forEach(col => {
                tableHTML += `<td>${row[col] || ''}</td>`;
            });
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody>';
    } else {
        tableHTML = `
            <tbody>
                <tr>
                    <td colspan="${columnNames.length}">No hay datos para mostrar</td>
                </tr>
            </tbody>
        `;
    }
    
    previewTable.innerHTML = tableHTML;
}

// Mostrar resultados del filtro
function showFilterResults(contratistaColumn, ticketColumn, nodoColumn, prioridadColumn) {
    let tableHTML = '';
    
    if (filteredData.length > 0) {
        tableHTML = `
            <thead>
                <tr>
                    <th>${ticketColumn}</th>
                    <th>${nodoColumn}</th>
                    <th>${contratistaColumn}</th>
                    <th>${prioridadColumn}</th>
                </tr>
            </thead>
            <tbody>
        `;
        
        filteredData.forEach(row => {
            const prioridad = String(row[prioridadColumn] || '').toLowerCase();
            let priorityClass = '';
            
            if (prioridad.includes('alta')) priorityClass = 'priority-alta';
            else if (prioridad.includes('media')) priorityClass = 'priority-media';
            else if (prioridad.includes('baja')) priorityClass = 'priority-baja';
            
            tableHTML += '<tr>';
            tableHTML += `<td>${row[ticketColumn] || ''}</td>`;
            tableHTML += `<td>${row[nodoColumn] || ''}</td>`;
            tableHTML += `<td>${row[contratistaColumn] || ''}</td>`;
            tableHTML += `<td><span class="priority-badge ${priorityClass}">${row[prioridadColumn] || ''}</span></td>`;
            tableHTML += '</tr>';
        });
        
        tableHTML += '</tbody>';
    } else {
        tableHTML = `
            <tbody>
                <tr>
                    <td colspan="4">No hay resultados para mostrar</td>
                </tr>
            </tbody>
        `;
    }
    
    resultsTable.innerHTML = tableHTML;
}

// Exportar a CSV
function exportToCSV() {
    if (filteredData.length === 0) {
        showStatus('No hay datos para exportar', 'warning');
        return;
    }
    
    const contratistaColumn = findColumnByName(columnNames, 'contratista');
    const ticketColumn = findColumnByName(columnNames, 'ticket') || 'NroTicket';
    const nodoColumn = findColumnByName(columnNames, 'nodo') || 'Nodo';
    const prioridadColumn = findColumnByName(columnNames, 'prioridad') || 'Prioridad';
    const selectedOptions = Array.from(contratistaFilter.selectedOptions);
    const selectedValues = selectedOptions.map(option => option.value).filter(value => value !== "");
    const prioridadValue = prioridadFilter.value;
    
    // Crear contenido CSV
    let csvContent = `"${ticketColumn}","${nodoColumn}","${contratistaColumn}","${prioridadColumn}"\r\n`;
    
    filteredData.forEach(row => {
        csvContent += `"${row[ticketColumn] || ''}","${row[nodoColumn] || ''}","${row[contratistaColumn] || ''}","${row[prioridadColumn] || ''}"\r\n`;
    });
    
    // Crear nombre de archivo
    let fileName = 'resultados_contratistas';
    if (selectedValues.length === 1) {
        fileName = `resultados_${selectedValues[0]}`;
    } else if (selectedValues.length > 0) {
        fileName = `resultados_${selectedValues.length}_contratistas`;
    }
    
    if (prioridadValue === 'alta') {
        fileName += '_prioridad_alta';
    }
    
    // Crear enlace de descarga
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${fileName}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    showStatus('Resultados exportados correctamente', 'success');
}

// Copiar resultados al portapapeles
function copyResultsToClipboard() {
    if (filteredData.length === 0) {
        showStatus('No hay datos para copiar', 'warning');
        return;
    }
    
    const contratistaColumn = findColumnByName(columnNames, 'contratista');
    const ticketColumn = findColumnByName(columnNames, 'ticket') || 'NroTicket';
    const nodoColumn = findColumnByName(columnNames, 'nodo') || 'Nodo';
    const prioridadColumn = findColumnByName(columnNames, 'prioridad') || 'Prioridad';
    
    // Crear texto para copiar
    let textToCopy = `${ticketColumn}\t${nodoColumn}\t${contratistaColumn}\t${prioridadColumn}\n`;
    
    filteredData.forEach(row => {
        textToCopy += `${row[ticketColumn] || ''}\t${row[nodoColumn] || ''}\t${row[contratistaColumn] || ''}\t${row[prioridadColumn] || ''}\n`;
    });
    
    // Copiar al portapapeles
    navigator.clipboard.writeText(textToCopy).then(() => {
        showStatus('Resultados copiados al portapapeles', 'success');
    }).catch(err => {
        showStatus('Error al copiar: ' + err, 'error');
    });
}

// Función para mostrar mensajes de estado
function showStatus(message, type) {
    statusMessage.textContent = message;
    statusMessage.className = 'status-message';
    statusMessage.classList.add('status-' + type);
    statusMessage.style.display = 'block';
    
    // Ocultar mensaje después de 5 segundos
    setTimeout(() => {
        statusMessage.style.display = 'none';
    }, 5000);
}