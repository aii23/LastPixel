import React, {useState, useEffect} from 'react';

export default function Info(props) {
    let [timeLeft, setTimeLeft] = useState(props.timeLeft);
    let timer;


    useEffect(() => { // Problem with timer(vrode rabotaet)
        timer = setTimeout(() => {
            console.log("trigered");
          setTimeLeft(timeLeft - 1);
        }, 1000);
        return () => clearTimeout(timer);
    }, [timeLeft]);

    useEffect(() => {
        clearTimeout(timer);
        setTimeLeft(props.timeLeft);
    }, [props.timeLeft])
    
    return (
        <div>
            <div>
                {`Game id: ${ props.gameId }`}
            </div>
            <div>
                {`Time left: ${ timeLeft }`}
            </div>
            <div>
                {`Game time: ${ props.gameTime }`}
            </div>

            <div>
                {`Time bank: ${ props.timeBank }`}
            </div>
            <div>
                {`Color bank: ${ props.colorBank }`}
            </div>
            <div>
                {`Price: ${ props.price }`}
            </div>
        </div>
    )
}