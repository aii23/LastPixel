import React from 'react';
import './App.css';
import Web3 from 'web3';
import { Web3ReactProvider } from '@web3-react/core'
import Switcher from './Switcher';

function getLibrary(provider) {
  return new Web3(provider)
}

function App() {

  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <div className="App">
        <Switcher></Switcher>
      </div>
    </Web3ReactProvider>
  );
}

// class App extends React.Component {

//   // const { active } = useWeb3React();

//   constructor(props) {
//     super(props);

//     this.state = {
//       isActive: false,
//     }
//   }

//   setActive() {
//     this.setState({isActive: true});
//   } 

//   render() {

//     let content; 

//     if (this.state.isActive) {
//       content = <p>Hi</p>;
//     } else {
//       content = <ConnectMenu setActive={() => this.setActive()}></ConnectMenu>
//     }

//     return (
//       <Web3ReactProvider getLibrary={getLibrary}>
//         <div className="App">
//           {content}
//         </div>
//       </Web3ReactProvider>
//     );
//   }
// }

export default App;
