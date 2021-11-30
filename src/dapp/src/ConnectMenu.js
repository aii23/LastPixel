import React from 'react';
import { useWeb3React } from "@web3-react/core";
import { injected } from "./Connectors"


export default function ConnectMenu(props) {

    const { activate } = useWeb3React();

    async function connect() {
        // activate(injected)
        // .then((result, error) => {
        //     console.log(result);
        //     console.log(error);
        //     props.setActive();
        // })
        // .catch((e) => {
        //     console.log(e);
        // });
        try {
            await activate(injected);
            // props.setActive();
        } catch(e) {
            console.log(e);
        }
    }

    return (
        <button onClick = {connect}>
            {"Connect to metamask"}
        </button>
    );
}