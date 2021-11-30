import React from 'react';
import Cell from './Cell';

export default function GameField(props) {
    // let m = [[1, 2, 3], [4, 5, 6], [7, 8, 9]];
    let m = Array(10).fill(Array(10).fill(0));

    function createCellRow(rowArray, rowIndex) {
        return <div className='cell_row' key={rowIndex}> {rowArray.map((elem, colIndex) => {
            return <Cell 
                    value = {elem} 
                    row = {rowIndex} 
                    col = {colIndex} 
                    id = {rowIndex + '|' + colIndex}
                    color = { props.cellMatrix[rowIndex][colIndex] }
                    setColor = {() => props.colorCell(rowIndex, colIndex)}/>;
        })} </div>
    }

    return (
        <div id='game_field'>
            { m.map((row, rowIndex) => {
                return createCellRow(row, rowIndex);
            })}
        </div>
    )
}