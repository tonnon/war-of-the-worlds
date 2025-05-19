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
    x: 480,  // Posição inicial ajustada
    y: 0,
    v: 0
}

let gameStatus = 'start';
let speed, score, nextBuildingX, gameProgress, lastHeight, lastTime;
let isTouched = false;

// Event handling
function handleAction(e) {
    e.preventDefault();
    e.stopPropagation();
    
    if (isTouched) return;
    isTouched = true;
    
    // Aumente o tempo de debounce para evitar toques rápidos acidentais
    setTimeout(() => { isTouched = false; }, 500);
    
    // Verifica o estado do jogo e bloqueia transições indesejadas
    if (gameStatus === 'on') {
        jump();
        return;
    }
    
    // Para os estados start, end, dead - inicia o jogo
    startGame();
}

// Use touchend em vez de touchstart para ser mais confiável em dispositivos móveis
gameContainer.addEventListener('touchend', handleAction, { passive: false });
gameContainer.addEventListener('click', handleAction);

// Remova o listener touchstart existente
gameContainer.removeEventListener('touchstart', handleAction);

// Game functions
function startGame() {
    if (gameStatus === 'on') return;

    // Reset visual elements
    msgDiv.classList.add('off');
    gameContainer.style.pointerEvents = 'auto';
    playerDiv.classList = 'player idle';  // Reset player sprite

    // Reset game state
    buildings.splice(0, buildings.length);
    buildingsDiv.innerHTML = '';
    
    player.x = 480;
    player.y = 0;
    player.v = 0;

    speed = 1;
    score = 0;
    nextBuildingX = 960;
    gameProgress = 0;
    lastHeight = 0;
    lastTime = 0;
    
    gameStatus = 'on';
    msgDiv.innerHTML = '';

    render();
}

function jump() {
    if (player.v !== 0) return;
    player.v = 3.2;
}

function render() {
    const thisTime = performance.now();
    const dt = Math.min(32, Math.max(8, thisTime - lastTime)) / 16.666;
    lastTime = thisTime;

    if (gameStatus === 'dead') {
        // Force player to fall regardless of buildings
        player.v -= g * dt;
        player.y = Math.max(0, player.y + player.v * dt);
        playerDiv.style.setProperty('--player-y', (320 - player.y) + "px");
        
        // Always show restart message when dead
        msgDiv.innerHTML = `<h2>You're Dead</h2>Tap to restart`;
        msgDiv.classList.remove('off');
        
        if (player.y > 0) {
            requestAnimationFrame(render);
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
            msgDiv.innerHTML = `<h2>You're Dead</h2>Tap to restart`;
            msgDiv.classList = 'msg';
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