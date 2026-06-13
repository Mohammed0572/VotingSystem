import { createContext, useContext, useState, useEffect } from 'react';
import Web3 from 'web3';
import TruffleContract from '@truffle/contract';
import votingArtifacts from '../../../../build/contracts/Voting.json';

const Web3Context = createContext();

export const useWeb3 = () => useContext(Web3Context);

export const Web3Provider = ({ children }) => {
  const [web3, setWeb3] = useState(null);
  const [account, setAccount] = useState(null);
  const [contract, setContract] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initWeb3 = async () => {
      try {
        let currentWeb3;
        if (window.ethereum) {
          currentWeb3 = new Web3(window.ethereum);
          await window.ethereum.request({ method: 'eth_requestAccounts' });
        } else if (window.web3) {
          currentWeb3 = new Web3(window.web3.currentProvider);
        } else {
          currentWeb3 = new Web3(new Web3.providers.HttpProvider("http://127.0.0.1:7545"));
        }
        
        setWeb3(currentWeb3);
        
        const accounts = await currentWeb3.eth.getAccounts();
        setAccount(accounts[0]);

        const VotingContract = TruffleContract(votingArtifacts);
        VotingContract.setProvider(currentWeb3.currentProvider);
        VotingContract.defaults({ from: accounts[0], gas: 6654755 });
        
        const instance = await VotingContract.deployed();
        setContract(instance);
        setIsLoading(false);
      } catch (error) {
        console.error("Failed to initialize web3 or contract.", error);
        setIsLoading(false);
      }
    };
    initWeb3();
  }, []);

  return (
    <Web3Context.Provider value={{ web3, account, contract, isLoading }}>
      {children}
    </Web3Context.Provider>
  );
};
