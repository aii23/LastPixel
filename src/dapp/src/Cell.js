import React from 'react';

export default function Cell(props) {

    let style = {
        background: props.color.color
    };

    return (
        <div className='cell' style = { style } onClick = {props.setColor} id = {props.id}>
            [{props.row}, {props.col}] = { props.value }
        </div>
    )
}