
var GameContract = artifacts.require("GameContract");

const {
    expectRevert, // Assertions for transactions that should fail
    time
} = require('@openzeppelin/test-helpers');


const GAME_TIME = 1200;
let CurrentPrice = 1000;

function IncreasePrice() {
    CurrentPrice = Math.floor(CurrentPrice * (103)/100);
}

function RefreshPrice() {
    CurrentPrice = 1000;
}

contract("GameContract", (accounts) => {
    let gameContract;
    let currentGameId;
    let gameFinishedByColor;
    let gameFinishedByTime;

    let firstColorWinner;
    let firstPortion;
    let secondColorWinner;
    let secondPortion;
    let thirdColorWinner; 
    let thirdPortion;

    let firstColorLooser;

    let timeWinner;
    let timeLooser;

    it("Init", async () => {
        gameContract = await GameContract.deployed();
    })

    describe("Game creation", () => {
        it("Can create game", async () => {
            let { logs } = await gameContract.createGame();

            assert.ok(Array.isArray(logs));
		    assert.equal(logs.length, 1);

            let log = logs[0];
		    assert.equal(log.event, 'GameCreated');

            currentGameId = log.args.gameId; 
        });

        it("Can't resume non-existent game", async () => {
            await expectRevert(
                gameContract.resumeGame(currentGameId + 1),
                'Game is not exist'
            );
        });

        it("Can't resume active game", async () => {
            await expectRevert(
                gameContract.resumeGame(currentGameId),
                'The game is not finished yet'
            );
        });

        it("Can resume finished game", async () => {
            let timeSkip = time.duration.seconds(GAME_TIME);

            await time.increase(timeSkip);

            await gameContract.checkTimeWin(currentGameId); 

            let {logs} = await gameContract.resumeGame(currentGameId);

            assert.ok(Array.isArray(logs));
		    assert.equal(logs.length, 1);

            let log = logs[0];
		    assert.equal(log.event, 'ResumeGame');
        });
    });

    describe("Game process", () => {
        it("Can't participate in non-existent game", async () => {
            await expectRevert(
                gameContract.pickCell(666, 0, 0, 1, {value: CurrentPrice}),
                'Game is not exist'
            );
        });

        it("Can't paricipate in finished game", async () => {
            await expectRevert(
                gameContract.pickCell(currentGameId, 0, 0, 1, {value: CurrentPrice}),
                'Game is not active'
            );
        });

        it("Can't color cell with less price", async () => {
            let {logs} = await gameContract.createGame(); 
            currentGameId = logs[0].args.gameId;
            
            await expectRevert(
                gameContract.pickCell(currentGameId, 0, 0, 1, {value: CurrentPrice - 1}),
                'We need more gold'
            );
        });

        it("Can't color with wrong color", async () => {
            await expectRevert(
                gameContract.pickCell(currentGameId, 0, 0, 0, {value: CurrentPrice}),
                'You should pick avaliable color'
            );

            await expectRevert(
                gameContract.pickCell(currentGameId, 0, 0, 11, {value: CurrentPrice}),
                'You should pick avaliable color'
            );
        });

        it("Can color cell", async () => {
            let x = 5;
            let y = 6;
            let color = 4;
            let { logs } = await gameContract.pickCell(currentGameId, x, y, color, {value: CurrentPrice});

            IncreasePrice();

            assert.ok(Array.isArray(logs));
		    assert.equal(logs.length, 1);

            let log = logs[0];

            assert(log.event, 'CellColored');
            assert(log.args.gameId, currentGameId);
            assert(log.args.adr, accounts[0]);
            assert(log.args.coords, x * 10 + y);
            assert(log.args.color, color);
        });

        it("Can't color in same color", async () => {
            let x = 5;
            let y = 6;
            let color = 4;

            await expectRevert(
                gameContract.pickCell(currentGameId, x, y, color, {value: CurrentPrice}),
                'This cell is already painted'
            );
        });
    });

    describe("Can get wining", () => {
        it("Can't get wining, from non-existent game", async () => {
            await expectRevert(
                gameContract.getWining(666),
                'Game is not exist'
            );
        });

        it("Can't get wining from active game", async () => {
            await expectRevert(
                gameContract.getWining(currentGameId),
                'The game is not finished yet'
            );
        });

        it("Prepare two games", async () => {
            let { logs } = await gameContract.createGame(); 
            gameFinishedByColor = logs[0].args.gameId;
            
            let wrongColor = 6;
            let color = 3;

            firstColorWinner = accounts[0];
            secondColorWinner = accounts[1];
            thirdColorWinner = accounts[2];

            firstColorLooser = accounts[3];

            RefreshPrice();

            // Coloring field
            for (let i = 0; i < 10; i++) { // This cells will be overwritten
                await gameContract.pickCell(gameFinishedByColor, i, 0, wrongColor, {from: firstColorLooser, value: CurrentPrice});
                IncreasePrice(); 
            }

            firstPortion = 10; // Percents of impact
            for (let i = 0; i < 10; i++) {
                await gameContract.pickCell(gameFinishedByColor, 0, i, color, {from: firstColorWinner, value: CurrentPrice});
                IncreasePrice(); 
            }

            secondPortion = 10;
            for (let i = 0; i < 10; i++) {
                await gameContract.pickCell(gameFinishedByColor, 1, i, color, {from: secondColorWinner, value: CurrentPrice});
                IncreasePrice(); 
            }

            thirdPortion = 80;
            for (let j = 2; j < 10; j++) {
                for (let i = 0; i < 10; i++) {
                    if (j == 9 && i == 9) {
                        continue;
                    }
                    await gameContract.pickCell(gameFinishedByColor, j, i, color, {from: thirdColorWinner, value: CurrentPrice});
                    IncreasePrice(); 
                }
            }
            
            logs = (await gameContract.pickCell(gameFinishedByColor, 9, 9, color, {from: thirdColorWinner, value: CurrentPrice})).logs;
            IncreasePrice(); 

            assert.ok(Array.isArray(logs));
		    assert.equal(logs.length, 2);

            log = logs[0];
		    assert.equal(log.event, 'GameFinished');
            assert.equal(log.args.gameId.toNumber(), gameFinishedByColor);


            logs = (await gameContract.createGame()).logs; 
            gameFinishedByTime = logs[0].args.gameId;

            timeWinner = accounts[4];
            timeLooser = accounts[5];

            RefreshPrice();

            for (let i = 0; i < 10; i++) {
                await gameContract.pickCell(gameFinishedByTime, 1, i, color, {from: timeLooser, value: CurrentPrice});
                IncreasePrice(); 
            }

            await gameContract.pickCell(gameFinishedByTime, 9, 9, color, {from: timeWinner, value: CurrentPrice});
            IncreasePrice();

            let timeSkip = time.duration.seconds(GAME_TIME + 15);

            await time.increase(timeSkip);

            logs = (await gameContract.checkTimeWin(gameFinishedByTime)).logs; 

            assert.ok(Array.isArray(logs));
		    assert.equal(logs.length, 1);

            log = logs[0];
		    assert.equal(log.event, 'GameFinished');
            assert.equal(log.args.gameId.toNumber(), gameFinishedByTime);
        });

        it("Can't get wining, if you are not winner", async () => {
            // await web3.eth.getBalance(instance.address)
            let initialColorLooserBalance = await web3.eth.getBalance(firstColorLooser);
            await gameContract.getWining(gameFinishedByColor, { gasPrice: 0, from: firstColorLooser });
            let currentColorLooserBalance =  await web3.eth.getBalance(firstColorLooser);

            assert.equal(initialColorLooserBalance, currentColorLooserBalance, "Color looser can win some money");

            let initialTimeLooserBalance = await web3.eth.getBalance(timeLooser);
            await gameContract.getWining(gameFinishedByTime, { gasPrice: 0, from: timeLooser });
            let currentTimeLooserBalance =  await web3.eth.getBalance(timeLooser);

            assert.equal(initialTimeLooserBalance, currentTimeLooserBalance, "Time looser can win some money");
        });

        it("Color winner can get wining", async () => {
            let winners = [
                {address: firstColorWinner, portion: firstPortion},
                {address: secondColorWinner, portion: secondPortion}, 
                {address: thirdColorWinner, portion: thirdPortion}];

            let { colorBank } = await gameContract.getGameData.call(gameFinishedByColor);
            

            for (winner of winners) {
                let expectedWinning = Math.floor((colorBank.toNumber()) * winner.portion / 100);
                // console.log(winner);
                let initialBalance = await web3.eth.getBalance(winner.address);
                let { logs } = await gameContract.getWining(gameFinishedByColor, { from: winner.address, gasPrice: 0 });

                assert.ok(Array.isArray(logs));
		        assert.equal(logs.length, 1);

                log = logs[0];
		        assert.equal(log.event, 'GotWining');
                assert.equal(log.args.winner, winner.address, "Wrong winner address");
                assert.equal(log.args.wining.toNumber(), expectedWinning, "Wrong winning");

                let currentBalance = await web3.eth.getBalance(winner.address);

                console.log(`Balance difference: ${currentBalance - initialBalance} should be equal to ${ expectedWinning }`);
                // assert.equal(currentBalance - initialBalance, expectedWinning), "Wrong wining"); send more ethers???
            }
        });

        it("Color winner can't get wining second time", async () => {
            await expectRevert(
                gameContract.getWining(gameFinishedByColor, {gasPrice: 0, from: firstColorWinner}),
                'You already got your wining'
            );
        });

        it("Time winner can get wining", async () => {
            let { timeBank } = await gameContract.getGameData.call(gameFinishedByTime);

            let initialBalance = await web3.eth.getBalance(winner.address);
            let { logs } = await gameContract.getWining(gameFinishedByTime, { from: timeWinner, gasPrice: 0 });

            assert.ok(Array.isArray(logs));
		    assert.equal(logs.length, 1);

            log = logs[0];
		    assert.equal(log.event, 'GotWining');
            assert.equal(log.args.winner, timeWinner, "Wrong winner address");
            assert.equal(log.args.wining.toNumber(), timeBank, "Wrong winning");

            let currentBalance = await web3.eth.getBalance(winner.address);

            console.log(`Balance difference: ${currentBalance - initialBalance} should be equal to ${ timeBank }`);
            // assert.equal(currentBalance - initialBalance, timeBank), "Wrong wining"); send more ethers???
        });

        it("Time winner cant get wining second time", async () => {
            await expectRevert(
                gameContract.getWining(gameFinishedByTime, {gasPrice: 0, from: timeWinner}),
                'You already got your wining'
            );
        });
    })
})