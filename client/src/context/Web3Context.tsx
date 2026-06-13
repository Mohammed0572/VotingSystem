import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Web3 from 'web3';
import TruffleContract from '@truffle/contract';
import votingArtifacts from '../../../../build/contracts/Voting.json';

interface Web3ContextType {
  web3: Web3 | null;
  account: string | null;
  contract: any | null;
  isLoading: boolean;
}

const Web3Context = createContext<Web3ContextType | undefined>(undefined);

export const useWeb3 = () => {
  const context = useContext(Web3Context);
  if (context === undefined) {
    throw new Error('useWeb3 must be used within a Web3Provider');
  }
  return context;
};

export const Web3Provider = ({ children }: { children: ReactNode }) => {
  const [web3, setWeb3] = useState<Web3 | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [contract, setContract] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

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
