import React, { useState } from 'react';
import { useWeb3React } from "@web3-react/core";
import ConnectMenu from './ConnectMenu';
import Game from './Game';
import FinishedGame from './FinishedGame';

export default function Switcher() {
    const { active } = useWeb3React();

    const [gameStatus, setGameStatus] = useState({ isFinished: false });

    const finishGame = () => {
        setGameStatus({ isFinished: true });
    }

    const getGameComponent = () => {
        if (gameStatus.isFinished) {
            return <FinishedGame/>;
        } else {
            return <Game finishGame = { finishGame }/>
        }
    }
  
    return (
        <div>
            {active ? getGameComponent() : <ConnectMenu/> }
        </div>
    );
  }