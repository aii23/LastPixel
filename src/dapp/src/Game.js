import React, { useState, useEffect, useRef } from 'react';
import Info from './Info';
import ColorPicking from './ColorPicking';
import GameField from './GameField';
import { useWeb3React } from "@web3-react/core";
import Web3 from "web3";
const TruffleContract = require("@truffle/contract"); 
const ContractData = require("./Contracts/GameContract.json");

let colors = [
    {
        id: 0, 
        color: "#ffffff"
    },
    {
        id: 1, 
        color: "#ff0000"
    },
    {
        id: 2,
        color: "#0000ff"
    },
    {
        id: 3,
        color: "#00ff00"
    },
    {
        id: 4,
        color: "#00aeae"
    },
    {
        id: 5,
        color: "#ba00ff"
    },
    {
        id: 6,
        color: "#ff4600"
    },
    {
        id: 7,
        color: "#ff7f00"
    },
    {
        id: 8,
        color: "#7308a5"
    },
    {
        id: 9,
        color: "#cc00af"
    },
    {
        id: 10,
        color: "#007900"
    },
];

export default function Game(props) {
    const [pickedColor, setPickedColor] = useState(colors[1]);
    const [cellMatrix, setCellMatrix] = useState(Array.from({length: 10},()=> Array.from({length: 10}, () => {return { colorId: 0, color: "#ffffff"}})));
    const [timeLeft, setTimeLeft] = useState(1000);
    const [gameTime, setGameTime] = useState(0);
    const [timeBank, setTimeBank] = useState(10);
    const [colorBank, setColorBank] = useState(10);
    const [contract, setContract] = useState(null);
    const [gameId, setGameId] = useState(-1);
    const [price, setPrice] = useState(0);
    const currentPrice = useRef();
    const currentTimeBank = useRef();
    const currentColorBank = useRef();
    const currentTimeLeft = useRef();

    currentPrice.current = price;
    currentTimeBank.current = timeBank;
    currentColorBank.current = colorBank;
    currentTimeLeft.current = timeLeft;

    const { library, account } = useWeb3React();

    const getPrice = () => {
        return price;
    }

    const parseLogCoords = (coord) => {
        return [coord % 10, coord / 10];
    }

    useEffect(() => {
        let loadContract = async () => {
            let curContract = TruffleContract(ContractData);
            curContract.setProvider(library.currentProvider);
            let instance = await curContract.deployed();
            console.log(instance);

            // if (contract) {
            //     contract.off('data');
            // }

            setContract(instance);
            await setGameId(0);
            console.log(contract);



            // instance.CellColored({
            //     filter: {gameId: gameId},
            //     fromBlock: 'latest'
            // }, (error, data) => {
            //     if (error) {
            //         console.log(error);
            //         return;
            //     }

            //     // setPrice((price * (100 + 3)) / 100); // Picked from contract
            // });
        }

        loadContract();
    }, []);

    useEffect(() => {
        let loadContractData = async () => {

            if (!contract) {
                return;
            }

            // let data = await contract.getGameData.call(gameId);
            // console.log(data);

            let {cellsColors, isActive, lastUpdated, colorBank, timeBank, price} = await contract.getGameData.call(gameId);

            if (!isActive) {
                props.finishGame();
                return;
            }

            if (1200 - (Date.now() - lastUpdated.toNumber() * 1000)/1000 < 0) {
                props.finishGame();
                return;
            }

            setCellMatrix(cellsColors.map((row) => row.map((colorId) => colors[colorId.toNumber()])));
            console.log((Date.now() - lastUpdated.toNumber() * 1000)/1000);
            setTimeLeft(1200 - (Date.now() - lastUpdated.toNumber() * 1000)/1000);
            setColorBank(colorBank);
            setTimeBank(timeBank);
            setPrice(price.toNumber());
            console.log('PriceSetted');
        };

        loadContractData();
    }, [gameId]);

    // Listen to contract events
    useEffect(() => {
        if (!contract || gameId == -1) {
            return;
        }

        console.log(price);
        console.log(getPrice());
        

        // Track cell colering
        contract.CellColored({
            filter: {gameId: gameId},
            fromBlock: 'latest'
        }, (error, data) => {
            if (error) {
                console.log(error);
                return;
            }

            console.log(data);

            let newTimeLeft = 1200 - (Date.now() - data.returnValues.newTime * 1000) / 1000;
            


            if (newTimeLeft > currentTimeLeft.current) {
                console.log("Set New Time Left");
                setTimeLeft(newTimeLeft);
            }

            setColorBank(+currentColorBank.current + Math.floor((currentPrice.current * (20/100))));
            setTimeBank(+currentTimeBank.current + Math.floor((currentPrice.current * (80/100))));

            setPrice(Math.floor((currentPrice.current * (100 + 3)) / 100)); // Picked from contract
        });

        contract.GameFinished({
            filter: {gameId: gameId},
            fromBlock: 'latest'
        }, (error, data) => {
            if (error) {
                console.log(error);
            }

            console.log(data);

            props.finishGame();
        })

    }, [gameId, contract]);

    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //       setTimeLeft(timeLeft - 1);
    //     }, 1000);

    // }, [timeLeft]);

    // useEffect(() => {
    //     const timer = setTimeout(() => {
    //       setGameTime(gameTime + 1);
    //     }, 1000);

    //     // return () => clearTimeout(timer);
    // });

    const colorCell = async (row, column, color) => {
        console.log(`${gameId} ${row} ${column} ${color.id} ${price}`);
        await contract.pickCell(gameId, row, column, color.id, { from: account, value: price })
        .then(() => {
            let newMatrix = [...cellMatrix];
            newMatrix[row][column] = color;
            setCellMatrix(newMatrix);
        })
        .catch((e) => {
            console.log(e);
            return;
        });
    }

    return (
        <div className='first_split'>
            <p> {`Picked color: ${ pickedColor.id }`} </p>
            <div className="top">
                <Info gameId = {gameId} timeLeft = {timeLeft} gameTime = {gameTime} timeBank = {timeBank} colorBank = {colorBank} price = {price}/>
            </div>
            <div className="left">
                <GameField cellMatrix = { cellMatrix } colorCell = {(row, column) =>  colorCell(row, column, pickedColor) }/>
            </div>
            <div className="right">
                <ColorPicking colors = { colors.slice(1) } setPickedColor = { setPickedColor }/>
            </div>
        </div>
    )
}