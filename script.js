const scoreDiv = document.querySelector('.score');
const msgDiv = document.querySelector('.msg');
const gameContainer = document.querySelector('.game');
const playerDiv = document.querySelector('.player');
const buildingsDiv = document.querySelector('.buildings');
const road = document.querySelector('.road');
const g = 0.098;
const buildings = [];
const player = {
    x: 480,
    y: 0,
    v: 0,
    jumpCount: 0,
    isJumping: false,
    jumpStartTime: 0,
    longJumpThreshold: 300,
    lastCollidedBuilding: null
}
let gameStatus = 'start';
let speed, score, nextBuildingX, gameProgress, lastHeight, lastTime;
let lastAction = 0;
let lastClickTime = 0;
let isMouseDown = false;
let mouseDownTime = 0;

function forceGameStart() {
    console.log("Forçando início do jogo");
    
    msgDiv.style.display = 'none';
    msgDiv.classList.add('off');
    msgDiv.innerHTML = '';
    
    startGame();
    
    document.addEventListener('click', handleTap);
    document.addEventListener('touchstart', handleTap);
    window.addEventListener('click', handleTap);
    window.addEventListener('touchstart', handleTap);
}

function handleMouseDown(e) {
    isMouseDown = true;
    mouseDownTime = Date.now();
}

function handleTap(e) {
    const now = Date.now();
    
    if (gameStatus === 'end' || gameStatus === 'falling') {
        startGame();
        lastAction = now;
        return;
    }
    
    if (gameStatus !== 'on') {
        startGame();
        lastAction = now;
        return;
    }
    
    if (now - lastAction < 150) return;
    
    if (gameStatus === 'on') {
        if (player.jumpCount === 0) {
            player.v = 3.2;
            player.jumpCount = 1;
            playerDiv.classList = 'player jump';
            console.log("Primeiro pulo!");
        } 
        else if (player.jumpCount === 1 && now - lastClickTime < 300) {
            player.v = 3.5;
            player.jumpCount = 2;
            playerDiv.classList = 'player jump-high';
            console.log("Double jump!");
        }
    }
    
    lastClickTime = now;
    lastAction = now;
}

const isWebViewer = /Android|AppInventor|WebView|Mobile/i.test(navigator.userAgent);

if (isWebViewer) {
    window.addEventListener('load', function() {
        console.log("WebViewer detectado, usando auto-inicialização");
        
        setTimeout(forceGameStart, 500);
        setTimeout(forceGameStart, 1500);
        setTimeout(forceGameStart, 3000);
        
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

window.addEventListener('load', function() {
    document.addEventListener('click', handleTap);
    document.addEventListener('touchstart', handleTap);
    document.addEventListener('mousedown', handleMouseDown);
    document.addEventListener('touchstart', handleMouseDown);
    
    console.log("Event listeners para iniciar o jogo registrados");
});

function handleDeadPlayerPhysics(dt) {
    player.v -= g * 2 * dt;
    player.y += player.v * dt;
    
    if (player.y <= 0) {
        player.y = 0;
        player.v = 0;
        
        gameStatus = 'end';
        
        msgDiv.innerHTML = `<h2 style="color:#fff;font-size:28px;">Game Over</h2><div style="padding:15px;background:#f00;color:#fff;font-size:20px;margin-top:10px;">TAP TO RESTART</div>`;
        msgDiv.style.display = 'block';
        msgDiv.style.opacity = '1';
        msgDiv.style.zIndex = '9999';
        msgDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        msgDiv.style.padding = '20px';
        msgDiv.style.borderRadius = '10px';
        msgDiv.classList.remove('off');
        
        console.log("Game Over - personagem atingiu o chão");
    }
    
    playerDiv.style.setProperty('--player-y', (320 - player.y) + "px");
}

function render() {
    const thisTime = performance.now();
    const dt = Math.min(32, Math.max(8, thisTime - lastTime)) / 16.666;
    lastTime = thisTime;

    if (gameStatus === 'falling') {
        handleDeadPlayerPhysics(dt);
        
        requestAnimationFrame(render);
        return;
    }
    
    if (gameStatus === 'end') {
        msgDiv.innerHTML = `<h2 style="color:#fff;font-size:28px;">Game Over</h2><div style="padding:15px;background:#f00;color:#fff;font-size:20px;margin-top:10px;">TAP TO RESTART</div>`;
        msgDiv.style.display = 'block';
        msgDiv.style.opacity = '1';
        msgDiv.style.zIndex = '9999';
        msgDiv.style.backgroundColor = 'rgba(0,0,0,0.7)';
        msgDiv.style.padding = '20px';
        msgDiv.style.borderRadius = '10px';
        msgDiv.classList.remove('off');
        
        player.y = 0;
        playerDiv.style.setProperty('--player-y', (320 - player.y) + "px");
        return;
    }

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

    if (player.v > 0) {
        player.y += player.v * dt;
        player.v = Math.max(0, player.v - g * dt);
    } else if (base < player.y) {
        player.y = Math.max(base, player.y + player.v * dt);
        player.v -= g * dt;
    } else {
        player.v = 0;
        player.jumpCount = 0;
        player.isJumping = false;
        playerDiv.classList = 'player idle';
    }

    let nextPlayerX = player.x + speed * dt;
    if (nextPlayerX - gameProgress < 720) {
        nextPlayerX += (1 / speed) * dt;
    }

    if (nextBuilding && (nextPlayerX > nextBuilding.x) && (nextBuilding.height > player.y)) {
        nextPlayerX = nextBuilding.x;
    }

    player.x = nextPlayerX;
    playerDiv.style.setProperty('--player-x', (nextPlayerX - gameProgress) + "px");
    playerDiv.style.setProperty('--player-y', (320 - player.y) + "px");

    destroyBuildings.forEach((ix, arrayIndex) => {
        const building = buildings[ix];
        const thisDiv = building.div;
        
        if (building.x < gameProgress + 180) {
            thisDiv.classList.add('destroy');
            
            const playerIsOnBuilding = (
                player.x >= building.x && 
                player.x <= building.x + building.width && 
                player.y <= building.height + 5 && 
                player.y >= building.height - 10   
            );
            
            if (playerIsOnBuilding && gameStatus === 'on') {
                console.log("Jogador detectado em cima do prédio - aguardando destruição");
                
                setTimeout(() => {
                    if (gameStatus === 'on') { 
                        gameStatus = 'falling'; 
                        playerDiv.classList = 'player dead';
                        player.v = -3; 
                        
                        console.log("Jogador começou a cair após destruição do prédio");
                    }
                }, 400); 
            }
            
            setTimeout(() => {
                thisDiv.remove();
                console.log("Prédio removido da DOM");
            }, 1000);
            
            buildings.splice(ix - arrayIndex, 1);
            arrayIndex++;
            score++;
        }
        
        const frontCollision = (
            gameStatus === 'on' &&
            player.x >= building.x - 10 && 
            player.x <= building.x + 10 && 
            player.y < building.height - 10 
        );
        
        if (frontCollision) {
            gameStatus = 'falling'; 
            playerDiv.classList = 'player dead';
            player.v = -3; 
            
            console.log("Colisão frontal com prédio - iniciando queda");
        }
    });

    speed += 0.001 * dt;
    gameProgress += speed * dt;
    road.style.left = (gameProgress % 10) * -1 + 'px';
    scoreDiv.innerHTML = `Score: ${score}`;

    if (gameStatus === 'on' || gameStatus === 'falling') {
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

function startGame() {
    console.log("Starting game...");
    
    msgDiv.classList.add('off');
    msgDiv.innerHTML = ''; 
    msgDiv.style.display = 'none'; 
    
    playerDiv.className = 'player idle';
    
    buildings.length = 0;
    buildingsDiv.innerHTML = '';
    
    player.x = 480;
    player.y = 0;
    player.v = 0;
    player.jumpCount = 0;
    player.isJumping = false;
    player.lastCollidedBuilding = null; 
    
    speed = 1;
    score = 0;
    nextBuildingX = 960;
    gameProgress = 0;
    lastHeight = 0;
    lastTime = performance.now();
    lastClickTime = 0; 
    lastAction = Date.now(); 
    
    gameStatus = 'on';
    
    console.log("Game started!");
    render();
}