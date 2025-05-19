// DOM variables
const scoreDiv = document.querySelector('.score');
const msgDiv = document.querySelector('.msg');
const gameContainer = document.querySelector('.game');
const playerDiv = document.querySelector('.player');
const buildingsDiv = document.querySelector('.buildings');
const road = document.querySelector('.road');

// Game const/variables
const g = 0.098;
const buildings = [];
const player = {
    x: 480,
    y: 0,
    v: 0
}

// Estado do jogo e variáveis 
let gameStatus = 'start';
let speed, score, nextBuildingX, gameProgress, lastHeight, lastTime;
let lastAction = 0;

// Função que realmente funciona em WebViewer 
function forceGameStart() {
    console.log("Forçando início do jogo");
    
    // Ocultar mensagem
    msgDiv.style.display = 'none';
    msgDiv.classList.add('off');
    msgDiv.innerHTML = '';
    
    // Iniciar jogo diretamente
    startGame();
    
    // Registrar manipuladores diretos
    document.addEventListener('click', handleTap);
    document.addEventListener('touchstart', handleTap);
    window.addEventListener('click', handleTap);
    window.addEventListener('touchstart', handleTap);
}

// Manipulador simplificado
function handleTap() {
    const now = Date.now();
    if (now - lastAction < 500) return;
    lastAction = now;
    
    if (gameStatus === 'on') {
        if (player.v === 0) player.v = 3.2;
    } else {
        startGame();
    }
}

// Detectar WebViewer
const isWebViewer = /Android|AppInventor|WebView|Mobile/i.test(navigator.userAgent);

// Auto-inicialização para WebViewer
if (isWebViewer) {
    window.addEventListener('load', function() {
        console.log("WebViewer detectado, usando auto-inicialização");
        
        // Sequência de tentativas de inicialização
        setTimeout(forceGameStart, 500);
        setTimeout(forceGameStart, 1500);
        setTimeout(forceGameStart, 3000);
        
        // Botão de emergência
        const emergencyButton = document.createElement('button');
        emergencyButton.textContent = "INICIAR JOGO";
        emergencyButton.style.position = 'absolute';
        emergencyButton.style.zIndex = '99999';
        emergencyButton.style.top = '50%';
        emergencyButton.style.left = '50%';
        emergencyButton.style.transform = 'translate(-50%, -50%)';
        emergencyButton.style.padding = '20px';
        emergencyButton.style.fontSize = '24px';
        emergencyButton.onclick = forceGameStart;
        document.body.appendChild(emergencyButton);
    });
}

function render() {
    const thisTime = performance.now();
    const dt = Math.min(32, Math.max(8, thisTime - lastTime)) / 16.666;
    lastTime = thisTime;

    if (gameStatus === 'dead') {
        // Mostrar mensagem de morte, garantir que seja visível
        msgDiv.innerHTML = `<h2>You're Dead</h2><div style="padding:10px;background:#f00;color:#fff">TAP TO RESTART</div>`;
        msgDiv.style.display = 'block';
        msgDiv.classList.remove('off');
        
        // Fazer o player cair
        player.v -= g * dt;
        player.y = Math.max(0, player.y + player.v * dt);
        playerDiv.style.setProperty('--player-y', (320 - player.y) + "px");
        
        if (player.y <= 0) {
            gameStatus = 'end';
            
            // Garantir visibilidade da mensagem 
            msgDiv.innerHTML = `<h2>You're Dead</h2><div style="padding:10px;background:#f00;color:#fff">TAP TO RESTART</div>`;
            msgDiv.style.display = 'block';
            msgDiv.classList.remove('off');
        }
        return;
    }

    // Building generation
    if (nextBuildingX < gameProgress + 960 + speed * dt) {
        createBuilding();
    }

    let base = 0;
    const destroyBuildings = [];
    let nextBuilding = buildings[0];

    buildings.forEach((building, ix) => {
        if (building.x < player.x) {
            base = building.height;
            nextBuilding = buildings[ix + 1];
        }

        if (building.x < gameProgress + 180) {
            destroyBuildings.push(ix);
        }

        building.div.style.setProperty('--building-x', (building.x - gameProgress) + "px");
    });

    // Player physics
    if (player.v > 0) {
        player.y += player.v * dt;
        player.v = Math.max(0, player.v - g * dt);
    } else if (base < player.y) {
        player.y = Math.max(base, player.y + player.v * dt);
        player.v -= g * dt;
    } else {
        player.v = 0;
    }

    // Player position
    let nextPlayerX = player.x + speed * dt;
    if (nextPlayerX - gameProgress < 720) {
        nextPlayerX += (1 / speed) * dt;
    }

    // Collision detection fix
    if (nextBuilding && (nextPlayerX > nextBuilding.x) && (nextBuilding.height > player.y)) {
        nextPlayerX = nextBuilding.x;
    }

    player.x = nextPlayerX;
    playerDiv.style.setProperty('--player-x', (nextPlayerX - gameProgress) + "px");
    playerDiv.style.setProperty('--player-y', (320 - player.y) + "px");

    // Building destruction
    destroyBuildings.forEach(ix => {
        const building = buildings[ix];
        const thisDiv = building.div;
        
        // Corrigido condição de colisão
        if (player.x >= building.x && 
            player.x <= building.x + building.width && 
            player.y <= building.height) {
            gameStatus = 'dead';
            playerDiv.classList = 'player dead';
            msgDiv.innerHTML = `<h2>You're Dead</h2><div style="padding:10px;background:#f00;color:#fff">TAP TO RESTART</div>`;
            msgDiv.style.display = 'block';
            player.v = 0; // Set initial velocity to zero to start falling
        }

        thisDiv.classList.add('destroy');
        setTimeout(() => thisDiv.remove(), 1000);
        buildings.splice(ix, 1);
        score++;
    });

    // Game progression
    speed += 0.001 * dt;
    gameProgress += speed * dt;
    road.style.left = (gameProgress % 10) * -1 + 'px';
    scoreDiv.innerHTML = `Score: ${score}`;

    if (gameStatus === 'on') {
        requestAnimationFrame(render);
    }
}

function createBuilding() {
    const building = {
        x: nextBuildingX,
        width: 60 + Math.round(Math.random() * 60),
        height: Math.min(Math.max(30 + Math.round(Math.random() * 120), lastHeight - 30), lastHeight + 30)
    };

    const buildingDiv = document.createElement('div');
    buildingDiv.className = 'building';
    buildingDiv.style.cssText = `
        width: ${building.width}px;
        height: ${building.height}px;
        --hue: ${Math.round(Math.random() * 360)}deg;
        --buildingImageX: ${Math.floor(Math.random() * 4) * 27.08333}%;
    `;

    for (let i = 0; i < 12; i++) {
        const fragment = document.createElement('div');
        fragment.className = 'building_fragment';
        fragment.style.cssText = `
            --tx: ${Math.random() * -120}px;
            --ty: ${Math.random() * -160}px;
            --rx: ${Math.random() * 360}deg;
            --ry: ${Math.random() * 360}deg;
            --rz: ${Math.random() * 360}deg;
        `;
        buildingDiv.appendChild(fragment);
    }

    building.div = buildingDiv;
    buildingsDiv.appendChild(buildingDiv);
    buildings.push(building);
    
    nextBuildingX += building.width;
    lastHeight = building.height;
}

// Função para iniciar o jogo
function startGame() {
    console.log("Starting game...");
    
    // CORREÇÃO: Realmente esconder a mensagem de várias maneiras
    msgDiv.classList.add('off');
    msgDiv.innerHTML = ''; // Remover completamente o texto
    msgDiv.style.display = 'none'; // Garantir que não seja exibido
    
    playerDiv.className = 'player idle';
    
    // Resetar estado
    buildings.length = 0;
    buildingsDiv.innerHTML = '';
    
    player.x = 480;
    player.y = 0;
    player.v = 0;
    
    speed = 1;
    score = 0;
    nextBuildingX = 960;
    gameProgress = 0;
    lastHeight = 0;
    lastTime = performance.now();
    
    gameStatus = 'on';
    
    console.log("Game started!");
    render();
}