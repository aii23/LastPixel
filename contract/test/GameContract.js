
var GameContract = artifacts.require("GameContract");

contract("GameContract", (accounts) => {
    
    describe("Game creation", () => {
        xit("Can create game", () => {

        });

        xit("Can't resume non-existent game", () => {

        });

        xit("Can't result active game", () => {

        });

        xit("Can resume finished game", () => {

        });
    });

    describe("Game process", () => {
        xit("Can't participate in non-existent game", () => {

        });

        xit("Can't paricipate in finished game", () => {

        });

        xit("Can't color cell with less price", () => {

        });

        xit("Can't color with wrong color", () => {

        });

        xit("Can't color in same color", () => {

        });

        xit("Can color cell", () => {

        });

        xit("Can win by time", () => {

        });

        xit("Can win by color with right wining", () => {

        });
    });

    describe("Can get wining", () => {
        xit("Can't get wining, from non-existent game", () => {

        });

        xit("Can't get wining from active game", () => {

        });
        xit("Can't get wining, if you are not winner", () => {

        });

        xit("Color winner can get wining", () => {

        });

        xit("Color winner can't get wining second time", () => {

        });

        xit("Time winner can get wining", () => {

        });

        xit("Time winner cant get wining second time", () => {

        });
    })
})