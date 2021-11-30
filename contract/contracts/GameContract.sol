pragma solidity ^0.8.0;

contract GameContract {

    struct Cell {
        uint8 color; 
        address lastUpdateBy;
    }


    // TODO убарть вложенные отображения, чтобы при обновлении обновлять объект в memory и целиком переносить в storage
    struct Game {
        Cell[10][10] cells; // Maybe mapping
        bool isExist;
        bool isActive; 
        bool colorWin;
        uint8 winingColor; // ?? maybe uint better
        address lastUpdateBy;
        uint lastUpdated;
        uint colorBank; 
        uint timeBank;
        uint price;
        mapping(address => mapping(uint => uint)) userColors;
        mapping(uint => uint) colorsCount;
        mapping(address => bool) gotWining; 
    }

    uint constant FACTOR = 3;
    uint constant TIMER = 20 minutes;
    uint constant INITIAL_PRICE = 1000 wei;
    uint constant COLOR_PART = 20;
    uint constant TIME_PART = 80;

    mapping(uint => Game) games;

    uint lastGame;

    event GameCreated(uint gameId, address indexed creator);
    event CellColored(uint indexed gameId, address indexed adr, uint coords, uint newTime);
    event GameFinished(uint indexed gameId, uint winingColor);
    event GotWining(address indexed winner, uint wining);
    event ResumeGame(uint indexed prevGameId, uint indexed newGameId);

    modifier existingGame(uint gameId) {
        require(games[gameId].isExist, "Game is not exist");
        _;
    }

    modifier activeGame(uint gameId) {
        require(games[gameId].isActive, "Game is not active");
        _;
    }

    modifier inActiveGame(uint gameId) {
        require(games[gameId].isActive, "Game is not active");
        _;
    }

    modifier finishedGame(uint gameId) {
        require(!games[gameId].isActive, "Game is still active");
        _;
    }

    constructor() {
        createGame();// For testing purpose. Remove on release
    }

    function createGame() public { // change to external
        require(!games[lastGame].isExist, "Game already created(I dont know why...)");
        Game storage newGame = games[lastGame];

        newGame.isExist = true;
        newGame.isActive = true;
        newGame.lastUpdated = block.timestamp;
        newGame.price = INITIAL_PRICE;
        
        lastGame++;

        emit GameCreated(lastGame - 1, msg.sender);
    }

    function resumeGame(uint gameId) finishedGame(gameId) external {
        require(!games[lastGame].isExist, "Game already created(I dont know why...)");

        Game storage prevGame = games[gameId];
        Game storage newGame = games[lastGame];

        newGame.isExist = true;

        if (prevGame.colorWin) {
            newGame.timeBank = prevGame.timeBank;
        } else {
            newGame.colorBank = prevGame.colorBank;
        }

        emit ResumeGame(gameId, lastGame);

        lastGame++;
    }

    function pickCell(uint gameId, uint x, uint y, uint8 color) external payable existingGame(gameId) activeGame(gameId) {
        Game storage curGame = games[gameId];

        require(msg.value >= curGame.price, "We need more gold");
        require(color > 0 && color <= 10, "You should pick avaliable color");
        require(x < 10 && y < 10, "You should pick cell from field");
        require(curGame.cells[x][y].color != color, "This cell is already painted");
        require(block.timestamp - curGame.lastUpdated < TIMER, "Last painter already won");

        uint prevPrice = curGame.price;
        uint prevColor = curGame.cells[x][y].color;
        address prevAddress = curGame.cells[x][y].lastUpdateBy;

        // Change cell color
        curGame.cells[x][y].color = color;

        // Change users impact
        if (prevColor != 0) {
            curGame.userColors[prevAddress][prevColor] -= 1;
        }
        curGame.userColors[msg.sender][color] += 1;

        // Change colors sums
        if (prevColor != 0) {
            curGame.colorsCount[prevColor] -= 1;
        }
        curGame.colorsCount[color] += 1;

        // Update banks
        curGame.colorBank += (curGame.price * COLOR_PART) / 100;
        curGame.timeBank += (curGame.price * TIME_PART) / 100;

        // Change last updater
        curGame.lastUpdateBy = msg.sender; 
        curGame.cells[x][y].lastUpdateBy = msg.sender;

        // Change lastUpdateTime
        curGame.lastUpdated = block.timestamp;

        // Change price
        curGame.price = (curGame.price * (100 + FACTOR)) / 100;

        if (curGame.colorsCount[color] == 100) {
            curGame.isActive = false;
            curGame.colorWin = true;
            emit GameFinished(gameId, color);
        }

        emit CellColored(gameId, msg.sender, 10 * x + y, block.timestamp);

        payable(msg.sender).transfer(msg.value - prevPrice);
    }

    function getWinning(uint gameId) external existingGame(gameId) finishedGame(gameId) {
        Game storage curGame = games[gameId];
        require(!curGame.gotWining[msg.sender], "You already got your wining");

        if (curGame.colorWin) {
            uint amountOfCells = curGame.userColors[msg.sender][curGame.winingColor];
            uint wining = (amountOfCells * curGame.colorBank) / 100;
            curGame.gotWining[msg.sender] = true; 
            // curGame.colorBank -= wining; ??
            payable(msg.sender).transfer(wining);
            emit GotWining(msg.sender, wining);
        } else {
            if (msg.sender == curGame.lastUpdateBy) {
                uint wining = curGame.timeBank;
                curGame.gotWining[msg.sender] = true; 
                curGame.timeBank = 0;
                payable(msg.sender).transfer(wining);
                emit GotWining(msg.sender, wining);
            }
        }
    }

    function checkTimeWin(uint gameId) existingGame(gameId) activeGame(gameId) public {
        Game storage curGame = games[gameId];

        if (block.timestamp - curGame.lastUpdated > TIMER) {
            curGame.isActive = false; 
            curGame.colorWin = false;
            emit GameFinished(gameId, 0);
        }
    }

    // For web3 usage
    function getGameData(uint gameId) 
        external 
        view 
        returns (
            uint8[10][10] memory cellsColors, 
            bool isActive, 
            uint lastUpdated,
            uint colorBank,
            uint timeBank,
            uint price) {
        Game storage curGame = games[gameId]; // temporary storage

        for (uint i = 0; i < 10; i++) {
            for (uint j = 0; j < 10; j++) {
                cellsColors[i][j] = curGame.cells[i][j].color;
            }
        }

        isActive = curGame.isActive;
        lastUpdated = curGame.lastUpdated;
        colorBank = curGame.colorBank;
        timeBank = curGame.timeBank;
        price = curGame.price;
    }
}