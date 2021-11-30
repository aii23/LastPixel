import React from 'react';

export default function ColorPicking(props) {
    return (
        <p>
            {props.colors.map(elem => {
                return <button 
                        className = 'color_button'
                        key = { elem.id } 
                        style = {{ backgroundColor: elem.color }} 
                        onClick = {() => props.setPickedColor(elem)}
                        > 
                            { elem.id } 
                        </button>
            })}
        </p>
    )
}