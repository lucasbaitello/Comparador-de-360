document.addEventListener('DOMContentLoaded', function() {
    console.log('DOM carregado, inicializando aplicação de comparação...');
    
    // Elementos da interface
    const imageInput1 = document.getElementById('image-input-1');
    const imageInput2 = document.getElementById('image-input-2');
    const fileNameDisplay1 = document.getElementById('file-name-1');
    const fileNameDisplay2 = document.getElementById('file-name-2');
    const panoramaContainer = document.getElementById('panorama-container');
    const panoramaElement1 = document.getElementById('panorama-1');
    const panoramaElement2 = document.getElementById('panorama-2');
    const comparisonSlider = document.getElementById('comparison-slider');
    const zoomInButton = document.getElementById('zoom-in');
    const zoomOutButton = document.getElementById('zoom-out');
    const resetViewButton = document.getElementById('reset-view');
    const zoomIndicator = document.getElementById('zoom-indicator');
    
    // Variáveis para os panoramas
    let viewer1 = null;
    let viewer2 = null;
    let image1Loaded = false;
    let image2Loaded = false;
    
    // Configurações iniciais
    const defaultHfov = 100; // Campo de visão horizontal padrão
    let currentHfov = defaultHfov;
    const zoomStep = 25; // Passo de zoom
    const maxHfov = 12000; // Zoom mínimo (campo de visão maior)
    const minHfov = 0.0001;  // Zoom máximo (campo de visão menor)
    
    // Variáveis para o controle deslizante
    let sliderPosition = 50; // Posição inicial do slider (em porcentagem)
    let isDragging = false;
    
    // Função para limpar o visualizador anterior
    function clearViewer(viewerInstance, element) {
        if (viewerInstance) {
            console.log('Removendo visualizador anterior');
            // Pannellum não tem método dispose, então apenas limpamos o conteúdo do elemento
            element.innerHTML = '';
            return null;
        }
        return viewerInstance;
    }
    
    // Função para inicializar o visualizador com uma imagem
    function initViewer(imageUrl, element, isFirstViewer) {
        console.log('Inicializando visualizador Pannellum...');
        
        try {
            // Verificar se Pannellum está disponível
            if (typeof pannellum === 'undefined') {
                throw new Error('Biblioteca Pannellum não carregada');
            }
            
            // Configurações do visualizador Pannellum
            const viewer = pannellum.viewer(element, {
                type: 'equirectangular',
                panorama: imageUrl,
                autoLoad: true,
                autoRotate: 0, // Sem rotação automática
                hfov: currentHfov, // Campo de visão horizontal
                compass: false,
                showControls: false, // Desabilitar controles padrão para usar nossos próprios
                showFullscreenCtrl: false,
                showZoomCtrl: false,
                hotSpotDebug: false
            });
            
            // Adicionar evento de carregamento
            viewer.on('load', function() {
                console.log('Panorama carregado com sucesso');
                // Remover indicador de carregamento se existir
                const loadingIndicator = element.querySelector('.loading-indicator');
                if (loadingIndicator) {
                    loadingIndicator.remove();
                }
                
                // Marcar imagem como carregada
                if (isFirstViewer) {
                    image1Loaded = true;
                } else {
                    image2Loaded = true;
                }
                
                // Mostrar o container se ambas as imagens estiverem carregadas ou se pelo menos uma estiver
                if (image1Loaded || image2Loaded) {
                    panoramaContainer.style.display = 'block';
                    updateSliderPosition();
                }
            });
            
            // Adicionar evento de erro
            viewer.on('error', function(err) {
                console.error('Erro ao carregar panorama:', err);
                alert('Erro ao carregar o panorama. Verifique se a imagem é compatível com visualização 360°.');
            });
            
            console.log('Visualizador criado com sucesso');
            return viewer;
        } catch (error) {
            console.error('Erro ao inicializar visualizador:', error);
            alert('Erro ao inicializar o visualizador. Verifique se a biblioteca Pannellum está carregada corretamente.');
            return null;
        }
    }
    
    // Função para atualizar a posição do slider e a visualização das imagens
    function updateSliderPosition() {
        // Atualizar a posição visual do slider
        comparisonSlider.style.left = `${sliderPosition}%`;
        
        // Atualizar a área visível da segunda imagem
        if (image2Loaded) {
            panoramaElement2.style.clipPath = `inset(0 0 0 ${sliderPosition}%)`;
        }
    }
    
    // Função para sincronizar a visualização entre os dois panoramas
    function syncViewers() {
        if (viewer1 && viewer2) {
            // Obter a posição atual do primeiro visualizador
            const pitch = viewer1.getPitch();
            const yaw = viewer1.getYaw();
            const hfov = viewer1.getHfov();
            
            // Aplicar a mesma posição ao segundo visualizador
            viewer2.setPitch(pitch);
            viewer2.setYaw(yaw);
            viewer2.setHfov(hfov);
        }
    }
    
    // Função para atualizar o indicador de zoom
    function updateZoomIndicator() {
        // Calcular a porcentagem de zoom (invertida, pois hfov menor = zoom maior)
        const zoomRange = maxHfov - minHfov;
        const currentZoom = maxHfov - currentHfov;
        const zoomPercentage = (currentZoom / zoomRange) * 100;
        
        // Limitar a porcentagem entre 0 e 100
        const clampedPercentage = Math.max(0, Math.min(100, zoomPercentage));
        
        // Atualizar a largura do indicador de zoom
        const zoomLevel = zoomIndicator.querySelector('.zoom-level');
        zoomLevel.style.width = `${clampedPercentage}%`;
    }
    
    // Função para aplicar zoom
    function applyZoom(zoomIn) {
        // Calcular novo valor de hfov
        let newHfov;
        if (zoomIn) {
            // Zoom in: reduzir o campo de visão (mais zoom)
            newHfov = currentHfov / 1.1;
        } else {
            // Zoom out: aumentar o campo de visão (menos zoom)
            newHfov = currentHfov * 1.1;
        }
        
        // Limitar o zoom
        newHfov = Math.max(minHfov, Math.min(maxHfov, newHfov));
        
        // Atualizar o valor atual
        currentHfov = newHfov;
        
        // Aplicar aos visualizadores
        if (viewer1) {
            viewer1.setHfov(newHfov);
        }
        if (viewer2) {
            viewer2.setHfov(newHfov);
        }
        
        // Atualizar o indicador de zoom
        updateZoomIndicator();
    }
    
    // Função para resetar a visualização
    function resetView() {
        // Resetar o campo de visão para o valor padrão
        currentHfov = defaultHfov;
        
        // Aplicar aos visualizadores
        if (viewer1) {
            viewer1.reset();
            viewer1.setHfov(currentHfov);
        }
        if (viewer2) {
            viewer2.reset();
            viewer2.setHfov(currentHfov);
        }
        
        // Atualizar o indicador de zoom
        updateZoomIndicator();
    }
    
    // Evento para o primeiro input de arquivo
    imageInput1.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            fileNameDisplay1.textContent = file.name;
            
            // Criar URL para a imagem selecionada
            const imageUrl = URL.createObjectURL(file);
            
            // Limpar visualizador anterior se existir
            viewer1 = clearViewer(viewer1, panoramaElement1);
            
            // Adicionar indicador de carregamento
            panoramaElement1.innerHTML = '<div class="loading-indicator">Carregando...</div>';
            
            // Inicializar novo visualizador
            viewer1 = initViewer(imageUrl, 'panorama-1', true);
            
            // Adicionar eventos para sincronização
            if (viewer1) {
                viewer1.on('mousedown', function() {
                    // Adicionar evento para sincronizar durante o movimento
                    document.addEventListener('mousemove', syncViewers);
                });
                
                viewer1.on('mouseup', function() {
                    // Remover evento após soltar o mouse
                    document.removeEventListener('mousemove', syncViewers);
                });
            }
        }
    });
    
    // Evento para o segundo input de arquivo
    imageInput2.addEventListener('change', function(e) {
        if (this.files && this.files[0]) {
            const file = this.files[0];
            fileNameDisplay2.textContent = file.name;
            
            // Criar URL para a imagem selecionada
            const imageUrl = URL.createObjectURL(file);
            
            // Limpar visualizador anterior se existir
            viewer2 = clearViewer(viewer2, panoramaElement2);
            
            // Adicionar indicador de carregamento
            panoramaElement2.innerHTML = '<div class="loading-indicator">Carregando...</div>';
            
            // Inicializar novo visualizador
            viewer2 = initViewer(imageUrl, 'panorama-2', false);
            
            // Sincronizar com o primeiro visualizador se existir
            if (viewer1 && viewer2) {
                // Sincronizar posição inicial
                syncViewers();
                
                // Adicionar eventos para sincronização
                viewer2.on('mousedown', function() {
                    // Adicionar evento para sincronizar durante o movimento
                    document.addEventListener('mousemove', syncViewers);
                });
                
                viewer2.on('mouseup', function() {
                    // Remover evento após soltar o mouse
                    document.removeEventListener('mousemove', syncViewers);
                });
            }
        }
    });
    
    // Eventos para o slider de comparação
    comparisonSlider.addEventListener('mousedown', function(e) {
        isDragging = true;
        // Prevenir seleção de texto durante o arrasto
        e.preventDefault();
    });
    
    document.addEventListener('mousemove', function(e) {
        if (!isDragging) return;
        
        // Calcular a nova posição do slider
        const containerRect = panoramaContainer.getBoundingClientRect();
        const containerWidth = containerRect.width;
        const offsetX = e.clientX - containerRect.left;
        
        // Converter para porcentagem e limitar entre 0 e 100
        let newPosition = (offsetX / containerWidth) * 100;
        newPosition = Math.max(0, Math.min(100, newPosition));
        
        // Atualizar a posição
        sliderPosition = newPosition;
        updateSliderPosition();
    });
    
    document.addEventListener('mouseup', function() {
        isDragging = false;
    });
    
    // Eventos para os botões de zoom
    zoomInButton.addEventListener('click', function() {
        applyZoom(true);
    });
    
    zoomOutButton.addEventListener('click', function() {
        applyZoom(false);
    });
    
    resetViewButton.addEventListener('click', function() {
        resetView();
    });
    
    // Adicionar suporte para zoom com a roda do mouse
    panoramaContainer.addEventListener('wheel', function(e) {
        // Prevenir o comportamento padrão de rolagem da página
        e.preventDefault();
        
        // Determinar a direção da rolagem
        const zoomIn = e.deltaY < 0;
        
        // Aplicar zoom
        applyZoom(zoomIn);
    });
    
    // Inicializar o indicador de zoom
    updateZoomIndicator();
});