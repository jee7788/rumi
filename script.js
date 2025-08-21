class RummikubGame {
    constructor() {
        this.tiles = [];
        this.players = [];
        this.currentPlayerIndex = 0;
        this.boardTiles = [];
        this.tilesLeft = 106;
        this.isFirstTurn = true;
        this.selectedTiles = [];
        this.gameStarted = false;
        this.playerCount = 4; // 기본값
        this.sortMode = 'none'; // 'none', 'number', 'color'
        
        this.initializeTiles();
        this.setupEventListeners();
    }

    initializeTiles() {
        // 숫자 타일 생성 (1-13, 각 색상별로 2개씩)
        const colors = ['red', 'blue', 'yellow', 'black'];
        const numbers = Array.from({length: 13}, (_, i) => i + 1);
        
        colors.forEach(color => {
            numbers.forEach(number => {
                // 각 조합을 2개씩 생성
                this.tiles.push({ number, color, type: 'number' });
                this.tiles.push({ number, color, type: 'number' });
            });
        });
        
        // 조커 2개 추가
        this.tiles.push({ number: 30, color: 'joker', type: 'joker' });
        this.tiles.push({ number: 30, color: 'joker', type: 'joker' });
        
        // 타일 섞기
        this.shuffleTiles();
    }

    shuffleTiles() {
        for (let i = this.tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.tiles[i], this.tiles[j]] = [this.tiles[j], this.tiles[i]];
        }
    }

    setPlayerCount(count) {
        this.playerCount = count;
    }

    startGame() {
        this.players = [];
        
        // 각 플레이어에게 14개 타일 분배
        for (let i = 0; i < this.playerCount; i++) {
            const playerTiles = this.tiles.splice(0, 14);
            this.players.push({
                id: i + 1,
                name: `플레이어 ${i + 1}`,
                tiles: playerTiles,
                hasPlayedFirstTurn: false
            });
        }
        
        this.tilesLeft = this.tiles.length;
        this.currentPlayerIndex = 0;
        this.isFirstTurn = true;
        this.gameStarted = true;
        
        this.updateDisplay();
        this.showMessage(`게임이 시작되었습니다! ${this.playerCount}명의 플레이어가 참여합니다.`);
    }

    drawTile() {
        if (this.tiles.length > 0) {
            const drawnTile = this.tiles.splice(0, 1)[0];
            this.players[this.currentPlayerIndex].tiles.push(drawnTile);
            this.tilesLeft = this.tiles.length;
            this.updateDisplay();
            this.showMessage(`${this.players[this.currentPlayerIndex].name}이(가) 타일을 뽑았습니다!`);
        } else {
            this.showMessage('더 이상 뽑을 타일이 없습니다!');
        }
    }

    createTileElement(tile, isSelectable = true, playerIndex = null) {
        const tileElement = document.createElement('div');
        tileElement.className = `tile ${tile.color}`;
        tileElement.textContent = tile.type === 'joker' ? 'JOKER' : tile.number;
        
        if (isSelectable && playerIndex !== null) {
            const tileIndex = this.players[playerIndex].tiles.indexOf(tile);
            tileElement.dataset.tileIndex = tileIndex;
            tileElement.addEventListener('click', () => this.toggleTileSelection(tileElement, tile, playerIndex));
        }
        
        return tileElement;
    }

    toggleTileSelection(tileElement, tile, playerIndex) {
        if (playerIndex !== this.currentPlayerIndex) return;
        
        const index = this.players[playerIndex].tiles.indexOf(tile);
        
        if (this.selectedTiles.includes(index)) {
            this.selectedTiles = this.selectedTiles.filter(i => i !== index);
            tileElement.classList.remove('selected');
        } else {
            this.selectedTiles.push(index);
            tileElement.classList.add('selected');
        }
    }

    playTiles() {
        if (this.selectedTiles.length === 0) {
            this.showMessage('내고 싶은 타일을 선택해주세요!');
            return;
        }

        const currentPlayer = this.players[this.currentPlayerIndex];
        const selectedTiles = this.selectedTiles.map(index => currentPlayer.tiles[index]);
        
        if (this.isValidPlay(selectedTiles, currentPlayer)) {
            // 선택된 타일들을 보드에 추가
            this.boardTiles.push(...selectedTiles);
            
            // 플레이어 손에서 제거
            this.selectedTiles.sort((a, b) => b - a); // 역순으로 정렬하여 인덱스 변화 방지
            this.selectedTiles.forEach(index => {
                currentPlayer.tiles.splice(index, 1);
            });
            
            this.selectedTiles = [];
            currentPlayer.hasPlayedFirstTurn = true;
            this.isFirstTurn = false;
            this.updateDisplay();
            this.showMessage(`${currentPlayer.name}이(가) 타일을 성공적으로 냈습니다!`);
            
            // 승리 조건 확인
            if (currentPlayer.tiles.length === 0) {
                this.showVictoryMessage(currentPlayer);
            }
        } else {
            this.showMessage('유효하지 않은 조합입니다! 런(연속된 같은 색상) 또는 그룹(같은 숫자의 다른 색상)을 만들어주세요.');
        }
    }

    isValidPlay(tiles, player) {
        if (tiles.length < 3) return false;
        
        // 첫 번째 턴에는 최소 30점이 필요
        if (!player.hasPlayedFirstTurn) {
            const totalPoints = tiles.reduce((sum, tile) => sum + tile.number, 0);
            if (totalPoints < 30) {
                this.showMessage('첫 번째 턴에는 최소 30점이 필요합니다!');
                return false;
            }
        }
        
        // 런(연속된 같은 색상) 확인
        if (this.isValidRun(tiles)) return true;
        
        // 그룹(같은 숫자의 다른 색상) 확인
        if (this.isValidGroup(tiles)) return true;
        
        return false;
    }

    isValidRun(tiles) {
        // 조커가 있으면 처리
        const jokers = tiles.filter(t => t.type === 'joker');
        const numberTiles = tiles.filter(t => t.type === 'number');
        
        if (numberTiles.length === 0) return false;
        
        // 같은 색상인지 확인
        const color = numberTiles[0].color;
        if (!numberTiles.every(t => t.color === color)) return false;
        
        // 숫자 정렬
        const numbers = numberTiles.map(t => t.number).sort((a, b) => a - b);
        
        // 연속된 숫자인지 확인 (조커로 빈 자리 채울 수 있음)
        let consecutiveCount = 1;
        let maxConsecutive = 1;
        
        for (let i = 1; i < numbers.length; i++) {
            if (numbers[i] === numbers[i-1] + 1) {
                consecutiveCount++;
                maxConsecutive = Math.max(maxConsecutive, consecutiveCount);
            } else {
                consecutiveCount = 1;
            }
        }
        
        // 조커로 빈 자리를 채울 수 있는지 확인
        const totalTiles = numbers.length + jokers.length;
        const gaps = this.countGaps(numbers);
        
        return maxConsecutive + jokers.length >= totalTiles && gaps <= jokers.length;
    }

    isValidGroup(tiles) {
        // 조커가 있으면 처리
        const jokers = tiles.filter(t => t.type === 'joker');
        const numberTiles = tiles.filter(t => t.type === 'number');
        
        if (numberTiles.length === 0) return false;
        
        // 같은 숫자인지 확인
        const number = numberTiles[0].number;
        if (!numberTiles.every(t => t.number === number)) return false;
        
        // 다른 색상인지 확인
        const colors = numberTiles.map(t => t.color);
        const uniqueColors = [...new Set(colors)];
        
        return uniqueColors.length === numberTiles.length;
    }

    countGaps(numbers) {
        let gaps = 0;
        for (let i = 1; i < numbers.length; i++) {
            gaps += numbers[i] - numbers[i-1] - 1;
        }
        return gaps;
    }

    endTurn() {
        this.currentPlayerIndex = (this.currentPlayerIndex + 1) % this.playerCount;
        this.selectedTiles = [];
        
        // 턴이 바뀔 때 정렬 모드 초기화
        this.sortMode = 'none';
        document.getElementById('sort-mode').value = 'none';
        
        this.updateDisplay();
        this.showMessage(`${this.players[this.currentPlayerIndex].name}의 턴입니다!`);
    }

    updateDisplay() {
        // 상단 플레이어 영역 업데이트
        this.updateTopPlayers();
        
        // 보드 업데이트
        this.updateBoard();
        
        // 현재 플레이어 영역 업데이트
        this.updateCurrentPlayer();
        
        // 게임 정보 업데이트
        this.updateGameInfo();
    }

    updateTopPlayers() {
        const topPlayersElement = document.getElementById('top-players');
        topPlayersElement.innerHTML = '';
        
        // 현재 플레이어를 제외한 다른 플레이어들을 상단에 표시
        for (let i = 0; i < this.playerCount; i++) {
            if (i === this.currentPlayerIndex) continue;
            
            const player = this.players[i];
            const playerSlot = document.createElement('div');
            playerSlot.className = 'player-slot';
            playerSlot.innerHTML = `
                <h3>${player.name}</h3>
                <div class="tile-count">${player.tiles.length}개 타일</div>
            `;
            
            topPlayersElement.appendChild(playerSlot);
        }
    }

    updateBoard() {
        const boardGridElement = document.getElementById('board-grid');
        boardGridElement.innerHTML = '';
        
        this.boardTiles.forEach(tile => {
            const tileElement = this.createTileElement(tile, false);
            boardGridElement.appendChild(tileElement);
        });
    }

    updateCurrentPlayer() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        
        // 플레이어 정보 업데이트
        const playerNameElement = document.getElementById('current-player-name');
        playerNameElement.textContent = currentPlayer.name;
        
        // 정렬 모드 표시 추가
        const sortIndicator = document.querySelector('.sort-mode-indicator');
        if (sortIndicator) {
            sortIndicator.remove();
        }
        
        if (this.sortMode !== 'none') {
            const indicator = document.createElement('span');
            indicator.className = 'sort-mode-indicator';
            indicator.textContent = this.sortMode === 'number' ? '(숫자순)' : '(색상별)';
            playerNameElement.appendChild(indicator);
        }
        
        document.getElementById('current-player-tiles').textContent = `${currentPlayer.tiles.length}개 타일`;
        
        // 플레이어 손 업데이트
        const playerHandElement = document.getElementById('player-hand');
        playerHandElement.innerHTML = '';
        
        currentPlayer.tiles.forEach((tile, index) => {
            const tileElement = this.createTileElement(tile, true, this.currentPlayerIndex);
            if (this.selectedTiles.includes(index)) {
                tileElement.classList.add('selected');
            }
            
            // 정렬 모드에 따른 시각적 표시
            if (this.sortMode === 'number') {
                tileElement.classList.add('sorted-by-number');
            } else if (this.sortMode === 'color') {
                tileElement.classList.add('sorted-by-color');
            }
            
            playerHandElement.appendChild(tileElement);
        });
    }

    updateGameInfo() {
        document.getElementById('current-player-display').textContent = `${this.players[this.currentPlayerIndex].name}의 턴`;
        document.getElementById('tiles-left').textContent = `남은 타일: ${this.tilesLeft}`;
    }

    showMessage(message) {
        // 간단한 메시지 표시
        alert(message);
    }

    showVictoryMessage(winner) {
        const victoryModal = document.getElementById('victory-modal');
        const victoryMessage = document.getElementById('victory-message');
        
        victoryMessage.textContent = `${winner.name}이(가) 모든 타일을 내고 승리했습니다!`;
        victoryModal.style.display = 'block';
    }

    resetGame() {
        this.tiles = [];
        this.players = [];
        this.boardTiles = [];
        this.selectedTiles = [];
        this.gameStarted = false;
        this.sortMode = 'none'; // 게임 재시작 시 정렬 모드 초기화
        
        this.initializeTiles();
        this.showStartScreen();
    }

    showStartScreen() {
        document.getElementById('start-screen').style.display = 'block';
        document.getElementById('game-screen').style.display = 'none';
    }

    showGameScreen() {
        document.getElementById('start-screen').style.display = 'none';
        document.getElementById('game-screen').style.display = 'block';
    }

    setupEventListeners() {
        // 시작 화면 이벤트
        this.setupStartScreenEvents();
        
        // 게임 화면 이벤트
        this.setupGameScreenEvents();
        
        // 모달 이벤트
        this.setupModalEvents();
        
        // 키보드 단축키
        this.setupKeyboardEvents();
    }

    setupStartScreenEvents() {
        // 플레이어 수 선택
        const playerOptions = document.querySelectorAll('.player-option');
        playerOptions.forEach(option => {
            option.addEventListener('click', () => {
                playerOptions.forEach(opt => opt.classList.remove('active'));
                option.classList.add('active');
                this.setPlayerCount(parseInt(option.dataset.players));
            });
        });
        
        // 게임 시작 버튼
        document.getElementById('start-game').addEventListener('click', () => {
            this.showGameScreen();
            this.startGame();
        });
    }

    setupGameScreenEvents() {
        // 게임 액션 버튼들
        document.getElementById('draw-tile').addEventListener('click', () => this.drawTile());
        document.getElementById('apply-sort').addEventListener('click', () => this.applySort());
        document.getElementById('play-tiles').addEventListener('click', () => this.playTiles());
        document.getElementById('end-turn').addEventListener('click', () => this.endTurn());
        
        // 헤더 버튼들
        document.getElementById('rules-btn').addEventListener('click', () => {
            document.getElementById('rules-modal').style.display = 'block';
        });
        
        document.getElementById('new-game-btn').addEventListener('click', () => {
            if (confirm('새 게임을 시작하시겠습니까?')) {
                this.resetGame();
            }
        });
    }

    setupModalEvents() {
        // 규칙 모달
        const rulesModal = document.getElementById('rules-modal');
        const closeBtn = rulesModal.querySelector('.close-btn');
        
        closeBtn.addEventListener('click', () => {
            rulesModal.style.display = 'none';
        });
        
        window.addEventListener('click', (event) => {
            if (event.target === rulesModal) {
                rulesModal.style.display = 'none';
            }
        });
        
        // 승리 모달
        const victoryModal = document.getElementById('victory-modal');
        
        document.getElementById('play-again').addEventListener('click', () => {
            victoryModal.style.display = 'none';
            this.resetGame();
        });
        
        document.getElementById('back-to-menu').addEventListener('click', () => {
            victoryModal.style.display = 'none';
            this.resetGame();
        });
    }

    setupKeyboardEvents() {
        document.addEventListener('keydown', (event) => {
            if (!this.gameStarted) return;
            
            switch(event.key) {
                case 'd':
                case 'D':
                    this.drawTile();
                    break;
                case 'a':
                case 'A':
                    this.applySort();
                    break;
                case 'p':
                case 'P':
                    this.playTiles();
                    break;
                case 'e':
                case 'E':
                    this.endTurn();
                    break;
                case 'Enter':
                    this.playTiles();
                    break;
            }
        });
    }

    applySort() {
        const currentPlayer = this.players[this.currentPlayerIndex];
        const sortModeSelect = document.getElementById('sort-mode');
        const selectedMode = sortModeSelect.value;
        
        this.sortMode = selectedMode;
        
        if (selectedMode === 'number') {
            this.sortByNumber(currentPlayer.tiles);
        } else if (selectedMode === 'color') {
            this.sortByColor(currentPlayer.tiles);
        } else {
            // 정렬 안함 - 원래 순서로 섞기
            this.shufflePlayerTiles(currentPlayer.tiles);
        }
        
        this.updateDisplay();
        this.showSortMessage();
    }

    sortByNumber(tiles) {
        // 숫자순으로 정렬 (조커는 맨 뒤로)
        tiles.sort((a, b) => {
            if (a.type === 'joker' && b.type === 'joker') return 0;
            if (a.type === 'joker') return 1;
            if (b.type === 'joker') return -1;
            return a.number - b.number;
        });
    }

    sortByColor(tiles) {
        // 색상별로 정렬 (빨강, 파랑, 노랑, 검정, 조커 순)
        const colorOrder = { 'red': 1, 'blue': 2, 'yellow': 3, 'black': 4, 'joker': 5 };
        
        tiles.sort((a, b) => {
            const colorA = colorOrder[a.color] || 6;
            const colorB = colorOrder[b.color] || 6;
            
            if (colorA === colorB) {
                // 같은 색상 내에서는 숫자순
                if (a.type === 'joker' && b.type === 'joker') return 0;
                if (a.type === 'joker') return 1;
                if (b.type === 'joker') return -1;
                return a.number - b.number;
            }
            return colorA - colorB;
        });
    }

    shufflePlayerTiles(tiles) {
        // 플레이어 타일을 섞기
        for (let i = tiles.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [tiles[i], tiles[j]] = [tiles[j], tiles[i]];
        }
    }

    showSortMessage() {
        const messages = {
            'none': '타일이 섞였습니다.',
            'number': '타일이 숫자순으로 정렬되었습니다.',
            'color': '타일이 색상별로 정렬되었습니다.'
        };
        this.showMessage(messages[this.sortMode]);
    }
}

// 게임 시작
document.addEventListener('DOMContentLoaded', () => {
    const game = new RummikubGame();
});
