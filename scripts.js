// Configuración de PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/2.10.377/pdf.worker.min.js';

// Array de documentos simulados con su categoría, país, imagen y descripción
const documents = [
    { 
        name: "Test 1", 
        file: "docs/doc1.pdf", 
        category: ["Institucional", "Socioambiental"],
        countries: ["GT"],
        image: "img/thumbnails/1.jpg",
        description: "Acta que Institucionaliza el Proyecto Mesoamérica firmada en 2009 por los países miembros.",
        type: "pdf"
    },    
    { 
        name: "Test 2", 
        file: "docs/doc2.pdf", 
        category: ["Económico"],
        countries: ["MX"],
        image: "img/thumbnails/2.jpg",
        description: "Acta que Institucionaliza el Proyecto Mesoamérica firmada en 2009 por los países miembros.",
        type: "pdf"
    },
    { 
        name: "Test 3", 
        file: "docs/doc3.pdf", 
        category: ["Institucional"],
        countries: ["SV"],
        image: "img/thumbnails/3.jpg",
        description: "Acta que Institucionaliza el Proyecto Mesoamérica firmada en 2009 por los países miembros.",
        type: "pdf"
    },
];

// Referencias a los elementos HTML
const documentList = document.getElementById("documents-list");
const categories = document.getElementById("categoriesCollapse");
const countries = document.getElementById("countriesCollapse");
const searchInput = document.getElementById("searchInput");
const copyAlert = document.getElementById("copyAlert");
const activeFilters = document.getElementById("activeFilters");
const resultsCounter = document.getElementById("resultsCounter");
const loadingSpinner = document.getElementById("loadingSpinner");

// Elementos de paginación
const paginationContainer = document.createElement("div");
paginationContainer.classList.add("pagination", "justify-content-center", "mt-4");
documentList.after(paginationContainer);

// Variables de estado
const ITEMS_PER_PAGE = 5;
let currentPage = 1;
let filteredDocuments = [];
let currentCategory = "all";
let currentCountry = "all";
let searchTerm = "";

// Mapeo de códigos de país a nombres completos
const countryNames = {
    "all": "Todos",
    "MX": "México",
    "GT": "Guatemala",
    "HN": "Honduras",
    "SV": "El Salvador",
    "NI": "Nicaragua",
    "CR": "Costa Rica",
    "PA": "Panamá",
    "CO": "Colombia",
    "RD": "República Dominicana",
    "BZ": "Belice"
};

// Función para generar el HTML dinámico de un documento
function generateDocumentHTML(doc) {
    const countryBadges = doc.countries.map(country => 
        `<span class="badge badge-info">${countryNames[country]}</span>`
    ).join(' ');

    return `
        <div class="document-item">
            <div class="row">
                <div class="col-md-3">
                    <div class="document-image">
                        <img src="${doc.image}" alt="Portada del Documento" class="img-fluid">
                    </div>
                </div>
                <div class="col-md-6">
                    <h5 class="document-title">${doc.name}</h5>
                    <p class="document-description">${doc.description}</p>
                    <div class="document-category">
                        <span class="font-weight-bold">Categorías:</span> 
                        ${doc.category.map(cat => `<span class="badge badge-primary">${cat}</span>`).join(' ')}
                    </div>
                    <div class="document-category mt-2">
                        <span class="font-weight-bold">País:</span> 
                        ${countryBadges}
                    </div>
                </div>
                <div class="col-md-3">
                    <div class="document-actions">
                        <a href="${doc.file}" target="_blank" class="btn btn-info" onclick="registrarEvento('${doc.name}', 'Vista Previa')">
                            Vista Previa
                        </a>
                        <a href="${doc.file}" download class="btn btn-success" onclick="registrarEvento('${doc.name}', 'Descarga')">
                            Descargar
                        </a>
                        <button class="btn btn-secondary" onclick="copyLinkToClipboard(event, '${doc.file}')">
                            Copiar enlace
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `;
}

// Función para crear botones de paginación
function createPaginationButtons() {
    const totalPages = Math.ceil(filteredDocuments.length / ITEMS_PER_PAGE);
    paginationContainer.innerHTML = '';

    if (totalPages <= 1) return;

    // Botón Anterior
    const prevButton = document.createElement('button');
    prevButton.classList.add('btn', 'btn-outline-primary');
    prevButton.innerHTML = '&laquo; Anterior';
    prevButton.disabled = currentPage === 1;
    prevButton.addEventListener('click', () => {
        if (currentPage > 1) {
            currentPage--;
            displayDocuments();
            window.scrollTo({ top: documentList.offsetTop - 20, behavior: 'smooth' });
        }
    });
    paginationContainer.appendChild(prevButton);

    // Botones de número de página
    const maxVisiblePages = 5;
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

    if (endPage - startPage + 1 < maxVisiblePages) {
        startPage = Math.max(1, endPage - maxVisiblePages + 1);
    }

    if (startPage > 1) {
        const firstPageButton = document.createElement('button');
        firstPageButton.classList.add('btn', 'btn-outline-primary');
        firstPageButton.textContent = '1';
        firstPageButton.addEventListener('click', () => {
            currentPage = 1;
            displayDocuments();
            window.scrollTo({ top: documentList.offsetTop - 20, behavior: 'smooth' });
        });
        paginationContainer.appendChild(firstPageButton);

        if (startPage > 2) {
            const ellipsis = document.createElement('span');
            ellipsis.classList.add('mx-2');
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }
    }

    for (let i = startPage; i <= endPage; i++) {
        const pageButton = document.createElement('button');
        pageButton.classList.add('btn', 'btn-outline-primary');
        pageButton.textContent = i;
        
        if (i === currentPage) {
            pageButton.classList.remove('btn-outline-primary');
            pageButton.classList.add('btn-primary');
        }
        
        pageButton.addEventListener('click', () => {
            currentPage = i;
            displayDocuments();
            window.scrollTo({ top: documentList.offsetTop - 20, behavior: 'smooth' });
        });
        
        paginationContainer.appendChild(pageButton);
    }

    if (endPage < totalPages) {
        if (endPage < totalPages - 1) {
            const ellipsis = document.createElement('span');
            ellipsis.classList.add('mx-2');
            ellipsis.textContent = '...';
            paginationContainer.appendChild(ellipsis);
        }

        const lastPageButton = document.createElement('button');
        lastPageButton.classList.add('btn', 'btn-outline-primary');
        lastPageButton.textContent = totalPages;
        lastPageButton.addEventListener('click', () => {
            currentPage = totalPages;
            displayDocuments();
            window.scrollTo({ top: documentList.offsetTop - 20, behavior: 'smooth' });
        });
        paginationContainer.appendChild(lastPageButton);
    }

    // Botón Siguiente
    const nextButton = document.createElement('button');
    nextButton.classList.add('btn', 'btn-outline-primary');
    nextButton.innerHTML = 'Siguiente &raquo;';
    nextButton.disabled = currentPage === totalPages;
    nextButton.addEventListener('click', () => {
        if (currentPage < totalPages) {
            currentPage++;
            displayDocuments();
            window.scrollTo({ top: documentList.offsetTop - 20, behavior: 'smooth' });
        }
    });
    paginationContainer.appendChild(nextButton);
}

// Función para actualizar los filtros activos mostrados
function updateActiveFilters() {
    let filtersHTML = '';
    
    if (currentCategory !== 'all') {
        filtersHTML += `<span class="badge badge-primary">Categoría: ${currentCategory}</span>`;
    }
    
    if (currentCountry !== 'all') {
        filtersHTML += `<span class="badge badge-info">País: ${countryNames[currentCountry]}</span>`;
    }
    
    if (searchTerm) {
        filtersHTML += `<span class="badge badge-secondary">Búsqueda: "${searchTerm}"</span>`;
    }
    
    activeFilters.innerHTML = filtersHTML || '<span class="text-muted">No hay filtros aplicados</span>';
}

// Función para filtrar documentos según categoría, país y búsqueda
function filterDocuments() {
    loadingSpinner.style.display = 'block';
    documentList.innerHTML = '';
    
    // Simular carga asíncrona para mejor UX
    setTimeout(() => {
        filteredDocuments = documents.filter(doc => {
            // Filtrar por categoría
            const categoryMatch = currentCategory === "all" || doc.category.includes(currentCategory);
            
            // Filtrar por país
            const countryMatch = currentCountry === "all" || doc.countries.includes(currentCountry);
            
            // Filtrar por término de búsqueda
            const searchMatch = !searchTerm || 
                doc.name.toLowerCase().includes(searchTerm) || 
                doc.description.toLowerCase().includes(searchTerm) ||
                doc.category.some(cat => cat.toLowerCase().includes(searchTerm)) ||
                doc.countries.some(country => countryNames[country].toLowerCase().includes(searchTerm));
            
            return categoryMatch && countryMatch && searchMatch;
        });
        
        // Actualizar contador de resultados
        const count = filteredDocuments.length;
        resultsCounter.textContent = `${count} documento${count !== 1 ? 's' : ''} encontrado${count !== 1 ? 's' : ''}`;
        
        // Resetear a la primera página
        currentPage = 1;
        displayDocuments();
        loadingSpinner.style.display = 'none';
    }, 300);
}

// Función para mostrar documentos paginados
function displayDocuments() {
    documentList.innerHTML = '';  // Limpiar el contenido

    // Calcular índices de documentos para la página actual
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageDocuments = filteredDocuments.slice(startIndex, endIndex);

    // Mostrar documentos de la página actual
    if (pageDocuments.length > 0) {
        pageDocuments.forEach(doc => {
            documentList.innerHTML += generateDocumentHTML(doc);
        });
    } else {
        documentList.innerHTML = `
            <div class="alert alert-info">
                No se encontraron documentos con los filtros aplicados.
            </div>
        `;
    }

    // Crear botones de paginación
    createPaginationButtons();
    
    // Actualizar filtros activos
    updateActiveFilters();
}

// Eventos para manejar los clics en las categorías
categories.addEventListener("click", function(e) {
    if (e.target.tagName === "LI") {
        document.querySelectorAll("#categoriesCollapse .list-group-item").forEach(li => li.classList.remove("active"));
        e.target.classList.add("active");
        currentCategory = e.target.getAttribute("data-category");
        filterDocuments();
    }
});

// Eventos para manejar los clics en los países
countries.addEventListener("click", function(e) {
    if (e.target.tagName === "LI") {
        document.querySelectorAll("#countriesCollapse .list-group-item").forEach(li => li.classList.remove("active"));
        e.target.classList.add("active");
        currentCountry = e.target.getAttribute("data-country");
        filterDocuments();
    }
});

// Filtrar documentos al buscar
searchInput.addEventListener("input", function() {
    searchTerm = searchInput.value.toLowerCase();
    filterDocuments();
});




// Función para copiar enlace al portapapeles
function copyLinkToClipboard(event, link) {
    event.preventDefault();
    
    // Crear elemento temporal para copiar
    const tempInput = document.createElement("input");
    tempInput.value = link;
    document.body.appendChild(tempInput);
    tempInput.select();
    
    try {
        // Intentar copiar al portapapeles
        const successful = document.execCommand("copy");
        document.body.removeChild(tempInput);
        
        if (successful) {
            showCopyAlert(event);
        } else {
            console.error("Falló al copiar el enlace");
        }
    } catch (err) {
        console.error("Error al copiar:", err);
        document.body.removeChild(tempInput);
    }
}

// Función para mostrar alerta de copiado
function showCopyAlert(event) {
    // Obtener posición del botón clickeado
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    // Posicionar la alerta justo encima del botón
    copyAlert.style.top = `${buttonRect.top + scrollTop - 50}px`;
    copyAlert.style.left = `${buttonRect.left + buttonRect.width/2}px`;
    copyAlert.style.transform = 'translateX(-50%)';
    
    // Resetear animación
    copyAlert.style.display = 'none';
    void copyAlert.offsetWidth; // Trigger reflow
    copyAlert.style.display = 'block';
    
    // Ocultar después de 2 segundos
    setTimeout(() => {
        copyAlert.style.display = 'none';
    }, 2000);
}



// Función para registrar eventos
function registrarEvento(documento, accion) {
    // En una implementación real, aquí se haría una llamada al servidor
    console.log(`Evento registrado: ${accion} - ${documento}`);
    
    // Simulación de envío al servidor
    fetch('guardar_registro.php', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ documento, accion }),
    })
    .then(response => response.json())
    .then(data => {
        console.log('Registro enviado:', data);
    })
    .catch(error => {
        console.error('Error al enviar el registro:', error);
    });
}

// Inicializar el repositorio al cargar la página
document.addEventListener('DOMContentLoaded', function() {
    filterDocuments();
    
    // Configurar tooltips
    $('[data-toggle="tooltip"]').tooltip();
    
    // Configurar acordeones para los filtros
    $('.filter-header').click(function() {
        $(this).find('i').toggleClass('fa-chevron-down fa-chevron-up');
    });
    
    // Configurar viewer.js para imágenes
    const gallery = new Viewer(document.getElementById('documents-list'), {
        toolbar: {
            zoomIn: 1,
            zoomOut: 1,
            oneToOne: 1,
            reset: 1,
            prev: 0,
            play: 0,
            next: 0,
            rotateLeft: 1,
            rotateRight: 1,
            flipHorizontal: 1,
            flipVertical: 1,
        }
    });
});