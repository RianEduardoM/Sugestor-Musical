document.addEventListener('DOMContentLoaded', () => {
    const searchButton = document.getElementById('search-button');
    const historyButton = document.getElementById('history-button');
    const searchInput = document.getElementById('search-input');
    const songsContainer = document.getElementById('songs-container');
    const suggestionsContainer = document.getElementById('suggestions-container');
    const historyContainer = document.getElementById('history-container');
    const historyList = document.getElementById('history-list');
    const appDescription = document.querySelector('.app-description'); // Descrição do aplicativo

    const clientId = 'f09202d116c34a2ea02d05584c59fb31'; // Seu Client ID
    const clientSecret = 'aec3059e25ed4cd4bac4c11fc2228e23'; // Seu Client Secret

    let accessToken = '';
    let currentAudio = null; // Áudio atual
    let currentTrackElement = null; // Elemento da música atual
    let history = []; // Histórico de músicas

    // Função para obter o access token
    async function getAccessToken() {
        const response = await fetch('https://accounts.spotify.com/api/token', {
            method: 'POST',
            headers: {
                'Authorization': 'Basic ' + btoa(`${clientId}:${clientSecret}`),
                'Content-Type': 'application/x-www-form-urlencoded',
            },
            body: 'grant_type=client_credentials',
        });

        if (!response.ok) {
            console.error('Erro ao obter o token:', response.statusText);
            return null;
        }

        const data = await response.json();
        return data.access_token;
    }

    // Função para buscar músicas
    async function searchMusic(query) {
        if (!accessToken) {
            accessToken = await getAccessToken(); // Obtém o access token
        }

        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) {
            console.error('Erro na requisição:', response.statusText);
            throw new Error('Erro ao buscar músicas: ' + response.statusText);
        }

        const data = await response.json();
        displaySongs(data.tracks.items);
    }

    // Função para exibir músicas
    function displaySongs(tracks) {
        songsContainer.innerHTML = '';
        if (tracks.length === 0) {
            songsContainer.innerHTML = '<p>Nenhuma música encontrada.</p>';
            return;
        }
        tracks.forEach(track => {
            const trackElement = document.createElement('div');
            trackElement.classList.add('song-item');

            trackElement.innerHTML = `
                <div class="album-image">
                    <img src="${track.album.images[0]?.url || ''}" alt="${track.name}">
                </div>
                <div class="song-info">
                    <h2 class="song-title">${track.name}</h2>
                    <p class="song-artist">${track.artists[0]?.name || 'Desconhecido'}</p>
                    <p class="song-album">${track.album.name}</p>
                    <p class="song-duration">${formatDuration(track.duration_ms)}</p> <!-- Duração da música -->
                    <div class="controls" style="display: none;">
                        <button class="play-button" data-preview-url="${track.preview_url}">Ver Prévia</button>
                        <button class="pause-button" style="display: none;">⏸️</button>
                    </div>
                    <div class="progress-container" style="display: none;">
                        <input type="range" class="progress-bar" value="0" min="0" step="1">
                        <span class="current-time">0:00</span> / <span class="total-time">${formatDuration(track.duration_ms)}</span>
                    </div>
                    <a class="spotify-link" href="${track.external_urls.spotify}" target="_blank">Ouvir no Spotify</a>
                </div>
            `;

            songsContainer.appendChild(trackElement);

            // Evento de mouse para expansão
            trackElement.addEventListener('mouseenter', () => {
                trackElement.classList.add('expanded');
                trackElement.querySelector('.controls').style.display = 'flex'; // Mostrar controles
            });
            trackElement.addEventListener('mouseleave', () => {
                trackElement.classList.remove('expanded');
                trackElement.querySelector('.controls').style.display = 'none'; // Ocultar controles
            });

            // Evento de reprodução
            const playButton = trackElement.querySelector('.play-button');
            const pauseButton = trackElement.querySelector('.pause-button');

            playButton.addEventListener('click', () => {
                if (currentAudio) {
                    currentAudio.pause(); // Pausa a música atual, se houver
                    currentTrackElement.classList.remove('highlight'); // Remove o destaque da música anterior
                }
                playPreview(track.preview_url, trackElement); // Passa o elemento da música para destacar
                addToHistory(track); // Adiciona a música ao histórico
            });

            // Evento de pausa
            pauseButton.addEventListener('click', () => {
                if (currentAudio) {
                    currentAudio.pause();
                    playButton.style.display = 'inline'; // Mostra o botão play
                    pauseButton.style.display = 'none'; // Esconde o botão pause
                }
            });
        });
    }

    // Função para tocar a música
    function playPreview(previewUrl, trackElement) {
        if (currentAudio) {
            currentAudio.pause();
        }

        if (previewUrl) {
            currentAudio = new Audio(previewUrl);
            currentAudio.play();

            // Atualiza a barra de progresso com a duração total da música
            trackElement.querySelector('.progress-container').style.display = 'flex'; // Mostra a barra de progresso
            updateProgress(trackElement); // Chama a função de atualizar a barra de progresso
            currentTrackElement = trackElement; // Atualiza a referência para a música atual
            trackElement.classList.add('highlight'); // Destaca a música
            trackElement.querySelector('.controls').style.display = 'flex'; // Exibe controles

            currentAudio.addEventListener('ended', () => {
                trackElement.classList.remove('highlight'); // Remove destaque
                trackElement.querySelector('.progress-container').style.display = 'none'; // Esconde a barra de progresso
            });
        } else {
            alert('Prévia não disponível para esta música.');
        }
    }

    // Função para atualizar a barra de progresso
    function updateProgress(trackElement) {
        const progressBar = trackElement.querySelector('.progress-bar');
        const currentTimeSpan = trackElement.querySelector('.current-time');
        const totalTimeSpan = trackElement.querySelector('.total-time');

        // Define o máximo da barra com a duração total da música
        progressBar.max = currentAudio.duration; 
        progressBar.value = 0; // Reseta a barra

        currentAudio.addEventListener('timeupdate', () => {
            progressBar.value = currentAudio.currentTime; // Atualiza o valor da barra
            currentTimeSpan.innerText = formatTime(currentAudio.currentTime); // Atualiza o tempo atual
            totalTimeSpan.innerText = formatDuration(currentAudio.duration); // Atualiza o tempo total
        });

        // Atualiza a barra ao arrastar
        progressBar.addEventListener('input', () => {
            currentAudio.currentTime = progressBar.value; // Muda o tempo atual
        });
    }

    // Função para formatar o tempo
    function formatTime(seconds) {
        const minutes = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${minutes}:${secs < 10 ? '0' : ''}${secs}`; // Formato "min:seg"
    }

    // Função para formatar a duração da música
    function formatDuration(durationMs) {
        const minutes = Math.floor(durationMs / 60000);
        const seconds = Math.floor((durationMs % 60000) / 1000);
        return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`; // Formato "min:seg"
    }

    // Adicionar o listener ao botão de busca
    searchButton.addEventListener('click', () => {
        const query = searchInput.value.trim();
        if (query !== '') {
            searchMusic(query);
        } else {
            alert('Por favor, digite o nome da música ou artista.');
        }
    });

    // Função para mostrar sugestões
    async function showSuggestions(query) {
        if (!accessToken) {
            accessToken = await getAccessToken(); // Obtém o access token
        }

        const response = await fetch(`https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        const data = await response.json();
        const suggestions = data.tracks.items.slice(0, 5); // Sugestões limitadas às 5 primeiras

        suggestionsContainer.innerHTML = '';
        if (suggestions.length === 0) {
            suggestionsContainer.style.display = 'none'; // Esconder se não houver sugestões
            return;
        }

        suggestions.forEach(track => {
            const suggestionElement = document.createElement('div');
            suggestionElement.classList.add('suggestion-item');
            suggestionElement.innerText = `${track.name} - ${track.artists[0]?.name || 'Desconhecido'}`;

            suggestionElement.addEventListener('click', () => {
                searchInput.value = track.name; // Colocar o nome da música na busca
                searchMusic(track.name); // Executar a busca
            });

            suggestionsContainer.appendChild(suggestionElement);
        });

        suggestionsContainer.style.display = 'block'; // Mostrar sugestões
    }

    // Som ao digitar
    searchInput.addEventListener('input', () => {
        const query = searchInput.value.trim();
        if (query.length > 0) {
            showSuggestions(query); // Mostrar sugestões enquanto digita
        } else {
            suggestionsContainer.style.display = 'none'; // Esconder se o input estiver vazio
        }
    });

    // Adicionar ao histórico
    function addToHistory(track) {
        history.push(track); // Adiciona a música ao histórico
        updateHistoryUI();
    }

    // Atualiza a UI do histórico
    function updateHistoryUI() {
        historyList.innerHTML = ''; // Limpa a lista atual

        history.forEach(track => {
            const historyItem = document.createElement('div');
            historyItem.classList.add('history-item');
            historyItem.innerText = `${track.name} - ${track.artists[0]?.name || 'Desconhecido'}`; // Formato da música no histórico

            historyItem.addEventListener('click', () => {
                searchInput.value = track.name; // Colocar o nome da música na busca
                searchMusic(track.name); // Executar a busca
            });

            historyList.appendChild(historyItem); // Adiciona o item à lista
        });
    }

    // Mostrar/Esconder histórico
    historyButton.addEventListener('click', () => {
        if (historyContainer.style.display === 'none') {
            historyContainer.style.display = 'block'; // Mostra o histórico
        } else {
            historyContainer.style.display = 'none'; // Esconde o histórico
        }
    });

    // Animação inicial
    setTimeout(() => {
        document.getElementById('intro-screen').style.display = 'none'; // Esconde a tela de introdução
        document.getElementById('container').style.display = 'block'; // Mostra o container principal
    }, 10000); // 10 segundos

    // Animação da descrição após 10 segundos
    setTimeout(() => {
        appDescription.style.display = 'block'; // Mostra a descrição
        appDescription.style.animation = 'fadeIn 1s'; // Animação de fade in para a descrição
    }, 2000); // Exibe a descrição após 10 segundos

    // Pisca o título nos últimos segundos
    setTimeout(() => {
        const appName = document.querySelector('.app-name');
        appName.style.animation = 'blink 1s infinite'; // Aplica a animação de piscar
    }, 0); // Começa a piscar após 8 segundos
});
