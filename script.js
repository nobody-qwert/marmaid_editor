let currentZoom = 1;
let currentX = 0;
let currentY = 0;
let isDragging = false;
let startX = 0;
let startY = 0;

// Initialize Mermaid
mermaid.initialize({
    startOnLoad: false,
    theme: 'default',
    themeVariables: {
        primaryColor: '#667eea',
        primaryTextColor: '#333',
        primaryBorderColor: '#764ba2',
        lineColor: '#764ba2'
    }
});

// Auto-render on input with debounce
let renderTimeout;
document.getElementById('mermaidCode').addEventListener('input', function() {
    clearTimeout(renderTimeout);
    renderTimeout = setTimeout(renderDiagram, 1000);
});

function showStatus(message, isError = false) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.className = `status show ${isError ? 'error' : ''}`;
    
    setTimeout(() => {
        status.classList.remove('show');
    }, 3000);
}

async function renderDiagram() {
    const code = document.getElementById('mermaidCode').value.trim();
    const diagramDiv = document.getElementById('mermaidDiagram');
    
    if (!code) {
        diagramDiv.innerHTML = '<div class="placeholder">Your diagram will appear here</div>';
        resetZoom();
        return;
    }

    try {
        // Clear previous content
        diagramDiv.innerHTML = '';
        
        // Generate unique ID for this render
        const id = 'mermaid-' + Date.now();
        
        // Render the diagram
        const { svg } = await mermaid.render(id, code);
        
        // Insert the SVG
        diagramDiv.innerHTML = svg;
        
        // Initialize zoom and pan
        initializeZoomPan();
        
        showStatus('✅ Diagram rendered successfully!');
        
    } catch (error) {
        console.error('Mermaid render error:', error);
        diagramDiv.innerHTML = `<div class="placeholder" style="color: #ef4444;">❌ Error rendering diagram:<br><br>${error.message}</div>`;
        showStatus('❌ Error rendering diagram', true);
    }
}

function initializeZoomPan() {
    const svg = document.querySelector('#mermaidDiagram svg');
    const container = document.getElementById('diagramContainer');
    
    if (!svg) return;
    
    // Reset transform
    resetZoom();
    
    // Add wheel event for zooming
    container.addEventListener('wheel', handleWheel, { passive: false });
    
    // Add mouse events for panning
    svg.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    // Add touch events for mobile
    svg.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);
}

function handleWheel(e) {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    currentZoom *= delta;
    currentZoom = Math.max(0.1, Math.min(5, currentZoom));
    updateTransform();
}

function handleMouseDown(e) {
    isDragging = true;
    startX = e.clientX - currentX;
    startY = e.clientY - currentY;
    e.preventDefault();
}

function handleMouseMove(e) {
    if (!isDragging) return;
    currentX = e.clientX - startX;
    currentY = e.clientY - startY;
    updateTransform();
}

function handleMouseUp() {
    isDragging = false;
}

function handleTouchStart(e) {
    if (e.touches.length === 1) {
        isDragging = true;
        startX = e.touches[0].clientX - currentX;
        startY = e.touches[0].clientY - currentY;
        e.preventDefault();
    }
}

function handleTouchMove(e) {
    if (isDragging && e.touches.length === 1) {
        currentX = e.touches[0].clientX - startX;
        currentY = e.touches[0].clientY - startY;
        updateTransform();
        e.preventDefault();
    }
}

function handleTouchEnd() {
    isDragging = false;
}

function updateTransform() {
    const svg = document.querySelector('#mermaidDiagram svg');
    if (svg) {
        svg.style.transform = `translate(${currentX}px, ${currentY}px) scale(${currentZoom})`;
        svg.style.transformOrigin = 'center center';
        svg.style.cursor = isDragging ? 'grabbing' : 'grab';
    }
}

function zoomIn() {
    currentZoom *= 1.2;
    currentZoom = Math.min(5, currentZoom);
    updateTransform();
}

function zoomOut() {
    currentZoom *= 0.8;
    currentZoom = Math.max(0.1, currentZoom);
    updateTransform();
}

function resetZoom() {
    currentZoom = 1;
    currentX = 0;
    currentY = 0;
    updateTransform();
}

function exportPNG() {
    const svg = document.querySelector('#mermaidDiagram svg');
    
    if (!svg) {
        showStatus('❌ No diagram to export', true);
        return;
    }

    try {
        // Create a simple, clean SVG export
        const svgClone = svg.cloneNode(true);
        
        // Remove any transform styles
        svgClone.style.transform = '';
        svgClone.removeAttribute('style');
        
        // Set basic attributes
        svgClone.setAttribute('xmlns', 'http://www.w3.org/2000/svg');
        
        // Get dimensions
        const bbox = svg.getBBox();
        const padding = 20;
        const width = bbox.width + (padding * 2);
        const height = bbox.height + (padding * 2);
        
        svgClone.setAttribute('width', width);
        svgClone.setAttribute('height', height);
        svgClone.setAttribute('viewBox', `${bbox.x - padding} ${bbox.y - padding} ${width} ${height}`);
        
        // Add white background
        const bgRect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        bgRect.setAttribute('x', bbox.x - padding);
        bgRect.setAttribute('y', bbox.y - padding);
        bgRect.setAttribute('width', width);
        bgRect.setAttribute('height', height);
        bgRect.setAttribute('fill', 'white');
        svgClone.insertBefore(bgRect, svgClone.firstChild);
        
        // Serialize SVG
        const svgString = new XMLSerializer().serializeToString(svgClone);
        
        // Create canvas
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        const scale = 2;
        
        canvas.width = width * scale;
        canvas.height = height * scale;
        ctx.scale(scale, scale);
        
        // Create image from SVG
        const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        
        const img = new Image();
        img.onload = function() {
            try {
                // Clear canvas with white background
                ctx.fillStyle = 'white';
                ctx.fillRect(0, 0, width, height);
                
                // Draw the SVG
                ctx.drawImage(img, 0, 0, width, height);
                
                // Export to PNG
                const pngUrl = canvas.toDataURL('image/png', 1.0);
                
                // Download
                const link = document.createElement('a');
                link.download = 'mermaid-diagram.png';
                link.href = pngUrl;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                
                // Cleanup
                URL.revokeObjectURL(url);
                showStatus('📥 PNG exported successfully!');
                
            } catch (drawError) {
                console.error('Drawing error:', drawError);
                URL.revokeObjectURL(url);
                showStatus('❌ Error drawing PNG', true);
            }
        };
        
        img.onerror = function(imgError) {
            console.error('Image load error:', imgError);
            URL.revokeObjectURL(url);
            showStatus('❌ Error loading SVG for export', true);
        };
        
        img.src = url;
        
    } catch (error) {
        console.error('Export error:', error);
        showStatus('❌ Error exporting PNG: ' + error.message, true);
    }
}

// Initial render
renderDiagram();

// Handle keyboard shortcuts
document.addEventListener('keydown', function(e) {
    if (e.ctrlKey || e.metaKey) {
        switch(e.key) {
            case 'Enter':
                e.preventDefault();
                renderDiagram();
                break;
            case 's':
                e.preventDefault();
                exportPNG();
                break;
            case '=':
            case '+':
                e.preventDefault();
                zoomIn();
                break;
            case '-':
                e.preventDefault();
                zoomOut();
                break;
            case '0':
                e.preventDefault();
                resetZoom();
                break;
        }
    }
});