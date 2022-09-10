import React, { useEffect, useState } from 'react';
import { ethers } from 'ethers';
import './App.css';
import abi from './utils/WavePortal.json';


export default function App() {
  /*
   * Just a state variable we use to store our user's public wallet.
   */
  const contractABI = abi.abi;
  const contractAddress = "0x68d8C524D5F49E216EF64e8478b1a6E693543352";
  

  const [currentAccount, setCurrentAccount] = useState('');
  const [totalWaves, setTotalWaves] = useState(0);
  const [waves, setAllWaves] = useState([]);
  const [message, setMessage] = useState('');
  const [isLoaded, setIsLoaded] = useState(false);

  const handleIsLoadedToggle = () => {
    setIsLoaded(currentIsLoaded => !currentIsLoaded);
  };

  // useEffect(() => {
  //    window.location.reload();
  // },[setTotalWaves])

  const checkIfWalletIsConnected = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        console.log('Make sure you have metamask!');
        return;
      } else {
        console.log('We have the ethereum object', ethereum);
      }

      /*
       * Check if we're authorized to access the user's wallet
       */
      const accounts = await ethereum.request({ method: 'eth_accounts' });

      if (accounts.length !== 0) {
        const account = accounts[0];
        console.log('Found an authorized account:', account);
        setCurrentAccount(account);
      } else {
        console.log('No authorized account found');
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Implement your connectWallet method here
   */
  const connectWallet = async () => {
    try {
      const { ethereum } = window;

      if (!ethereum) {
        alert('Get MetaMask!');
        return;
      }

      const accounts = await ethereum.request({
        method: 'eth_requestAccounts',
      });

      console.log('Connected', accounts[0]);
      setCurrentAccount(accounts[0]);
    } catch (error) {
      console.log(error);
    }
  };

  const wave = async () => {
    try {
      handleIsLoadedToggle();
      const { ethereum } = window;

      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );
        /*
         * Execute the actual wave from your smart contract
         * Also setting a gasLimit of 30000
         */
        const waveTxn = await wavePortalContract.wave(message, {
          gasLimit: 300000,
        });

        console.log('Mining...', waveTxn.hash);

        await waveTxn.wait();

        console.log('Mined -- ', waveTxn.hash);

        setMessage('');
        handleIsLoadedToggle();
      } else {
        console.log("Ethereum object doesn't exist!");
        handleIsLoadedToggle();
      }
    } catch (error) {
      console.log(error);
      handleIsLoadedToggle();
    }
  };

  /*
   * This runs our function when the page loads.
   */
  const getAllWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const waves = await wavePortalContract.getAllWaves();

        const wavesCleaned = waves.map(wave => {
          return {
            address: wave.waver,
            timestamp: new Date(wave.timestamp * 1000),
            message: wave.message,
          };
        });

        setAllWaves(wavesCleaned);
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  const getTotalWaves = async () => {
    const { ethereum } = window;

    try {
      if (ethereum) {
        const provider = new ethers.providers.Web3Provider(ethereum);
        const signer = provider.getSigner();
        const wavePortalContract = new ethers.Contract(
          contractAddress,
          contractABI,
          signer
        );

        const count = await wavePortalContract.getTotalWaves();
        setTotalWaves(count.toNumber());
      } else {
        console.log("Ethereum object doesn't exist!");
      }
    } catch (error) {
      console.log(error);
    }
  };

  /**
   * Listen in for emitter events!
   */
  useEffect(() => {
    let wavePortalContract;

    const onNewWave = (from, timestamp, message) => {
      console.log('NewWave', from, timestamp, message);
      setAllWaves(prevState => [
        ...prevState,
        {
          address: from,
          timestamp: new Date(timestamp * 1000),
          message: message,
        },
      ]);
    };

    if (window.ethereum) {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      wavePortalContract = new ethers.Contract(
        contractAddress,
        contractABI,
        signer
      );
      checkIfWalletIsConnected();
      getAllWaves();
      getTotalWaves();

      wavePortalContract.on('NewWave', onNewWave);
    }

    return () => {
      if (wavePortalContract) {
        wavePortalContract.off('NewWave', onNewWave);
      }
    };
  }, []);

  return (
    <div className="mainContainer">
      {isLoaded ? (
        <div className="spinnerContainer">
          <Spinner animation="border" />
          <p>Mining.... Please wait</p>
        </div>
      ) : (
        <div className="dataContainer">
          <div className="header">👋 Hello Everyone!</div>

          <div className="bio">
            Hi! my name is Rishabh, please leave a message!
          </div>
          <div className="bio">
            It'll be permanently stored on the blockchain!
          </div>
          <br></br>
          <div className="input-group mb-3 mt-3">
            <input
              type="text"
              className="form-control"
              placeholder="Message"
              onChange={event => setMessage(event.target.value)}
              value={message}
            ></input>
          </div>
          {message !== '' ? (
            <button className="waveButton" onClick={wave} 
             
              >
              Click
            </button>
           
          ) : null}
          {/*
           * If there is no currentAccount render this button
           */}
     
          {!currentAccount && (
            <button className="waveButton" onClick={connectWallet}>
              Connect Wallet
            </button>
          )}
          <div className="messagesContainer">
            <div className="messagesHeader">
              <h3>There are currently {totalWaves} messages</h3>
            </div>
            <div>
              <div className="list-group mt-10">
                {waves.map(wave => {
                  return (
                    <div className="list-group-item list-group-item-action flex-column align-items-start box">
                      <div className="d-flex w-100 justify-content-between">
                        <h5 className="mb-1">{wave.address}</h5>
                        {/* <small>3 days ago</small> */}
                      </div>
                      <p className="mb-1">{wave.message}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}