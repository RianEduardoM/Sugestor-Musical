// Atualizar a cor do fundo e a opacidade dos emojis com o slider
const slider = document.getElementById('themeSlider');
const body = document.body;

slider.addEventListener('input', function() {
    const value = this.value;
    const lightness = 100 - value;
    body.style.backgroundColor = `hsl(220, 13%, ${lightness}%)`;
    
    // Ajusta a opacidade dos emojis
    document.querySelector('.sun').style.opacity = (100 - value) / 100;
    document.querySelector('.moon').style.opacity = value / 100;
});

// Atualizar hora e contagem de tempo restante
function updateTime() {
    const currentTimeElement = document.getElementById('current-time');
    const restartDateElement = document.getElementById('restart-date');
    const timeRemainingElement = document.getElementById('time-remaining');

    const currentTime = new Date();
    currentTimeElement.textContent = currentTime.toLocaleString();

    const restartDate = new Date(restartDateElement.textContent);
    const timeRemaining = restartDate - currentTime;
    const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));

    timeRemainingElement.textContent = `${hoursRemaining}h ${minutesRemaining}m`;

    setTimeout(updateTime, 60000); // Atualizar a cada minuto
}

updateTime();

// Adicionar data e hora de offline
const offlineDateElement = document.getElementById('offline-date');
offlineDateElement.textContent = new Date().toLocaleString();
// Definir o tempo de término em 90 horas a partir de agora
const storedEndTime = localStorage.getItem('endTime');
let endTime;

if (!storedEndTime) {
    // Se não houver tempo armazenado, calcular o tempo de término (90 horas a partir de agora)
    endTime = new Date().getTime() + (90 * 60 * 60 * 1000); // 90 horas em milissegundos
    localStorage.setItem('endTime', endTime);
} else {
    // Caso já exista o tempo de término armazenado, usar o valor salvo
    endTime = parseInt(storedEndTime);
}

function updateCountdown() {
    const currentTime = new Date().getTime();
    let remainingTime = endTime - currentTime;

    if (remainingTime <= 0) {
        remainingTime = 0; // Impede que o tempo se torne negativo
        localStorage.removeItem('endTime'); // Limpar o tempo armazenado quando terminar
    }

    const hours = Math.floor(remainingTime / 3600000); // horas
    const minutes = Math.floor((remainingTime % 3600000) / 60000); // minutos
    const seconds = Math.floor((remainingTime % 60000) / 1000); // segundos

    // Atualizar o conteúdo da página com a contagem regressiva formatada
    document.getElementById('time-remaining').textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}

// Atualizar a contagem a cada segundo
setInterval(updateCountdown, 1000);

// Inicializar a contagem regressiva ao carregar a página
updateCountdown();
