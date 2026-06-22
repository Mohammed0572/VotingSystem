import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import Web3 from 'web3';
// @ts-ignore
import TruffleContract from '@truffle/contract';
import votingArtifacts from "../contracts/Voting.json";

declare global {
  interface Window {
    ethereum: any;
    web3: any;
  }
}

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
        const VOTING_CONTRACT_ADDRESS = import.meta.env.VITE_CONTRACT_ADDRESS;
        let currentWeb3;
        // Use Sepolia testnet provider
        currentWeb3 = new Web3(
          new Web3.providers.HttpProvider(import.meta.env.VITE_SEPOLIA_RPC_URL)
        );
        
        setWeb3(currentWeb3);
        
        const accounts = await currentWeb3.eth.getAccounts();
        setAccount(accounts[0]);

        const VotingContract = TruffleContract(votingArtifacts);
        VotingContract.setProvider(currentWeb3.currentProvider);
        VotingContract.defaults({ from: accounts[0], gas: 6654755 });
        
        const instance = await VotingContract.at(VOTING_CONTRACT_ADDRESS);
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
