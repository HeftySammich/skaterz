/**
 * Wallet Test Component
 * For testing and debugging WalletConnect integration
 */

import React, { useState } from 'react';
import { useWallet } from '../../hooks/useWallet';

export function WalletTest() {
  const {
    isConnected,
    accountId,
    isLoading,
    error,
    connect,
    disconnect,
    getBalance,
    checkStarTokenAssociation,
    checkStacyUnlock,
    isInitialized
  } = useWallet();

  const [balance, setBalance] = useState<string | null>(null);
  const [starAssociated, setStarAssociated] = useState<boolean | null>(null);
  const [stacyUnlocked, setStacyUnlocked] = useState<boolean | null>(null);
  const [testResults, setTestResults] = useState<string[]>([]);

  const addTestResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const handleConnect = async () => {
    try {
      addTestResult('Attempting to connect wallet...');
      await connect();
      addTestResult('Wallet connection successful!');
    } catch (error) {
      addTestResult(`Connection failed: ${error}`);
    }
  };

  const handleDisconnect = async () => {
    try {
      addTestResult('Disconnecting wallet...');
      await disconnect();
      setBalance(null);
      setStarAssociated(null);
      setStacyUnlocked(null);
      addTestResult('Wallet disconnected successfully!');
    } catch (error) {
      addTestResult(`Disconnect failed: ${error}`);
    }
  };

  const handleGetBalance = async () => {
    try {
      addTestResult('Fetching HBAR balance...');
      const bal = await getBalance();
      setBalance(bal);
      addTestResult(`Balance retrieved: ${bal} HBAR`);
    } catch (error) {
      addTestResult(`Balance fetch failed: ${error}`);
    }
  };

  const handleCheckStarAssociation = async () => {
    try {
      addTestResult('Checking STAR token association...');
      const associated = await checkStarTokenAssociation();
      setStarAssociated(associated);
      addTestResult(`STAR token associated: ${associated}`);
    } catch (error) {
      addTestResult(`STAR association check failed: ${error}`);
    }
  };

  const handleCheckStacyUnlock = async () => {
    try {
      addTestResult('Checking Stacy NFT ownership...');
      const unlocked = await checkStacyUnlock();
      setStacyUnlocked(unlocked);
      addTestResult(`Stacy unlocked: ${unlocked}`);
    } catch (error) {
      addTestResult(`Stacy unlock check failed: ${error}`);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div style={{ 
      padding: '20px', 
      fontFamily: 'monospace', 
      backgroundColor: '#1a1a1a', 
      color: '#00ff00',
      minHeight: '100vh'
    }}>
      <h1 style={{ color: '#ffff00' }}>🧪 Wallet Connection Test</h1>
      
      <div style={{ marginBottom: '20px' }}>
        <h2>Status:</h2>
        <p>Initialized: {isInitialized ? '✅' : '❌'}</p>
        <p>Connected: {isConnected ? '✅' : '❌'}</p>
        <p>Loading: {isLoading ? '⏳' : '✅'}</p>
        <p>Account ID: {accountId || 'None'}</p>
        <p>Error: {error || 'None'}</p>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Actions:</h2>
        <button 
          onClick={handleConnect} 
          disabled={isLoading || isConnected}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#004400', color: '#00ff00', border: 'none' }}
        >
          Connect Wallet
        </button>
        
        <button 
          onClick={handleDisconnect} 
          disabled={isLoading || !isConnected}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#440000', color: '#ff0000', border: 'none' }}
        >
          Disconnect Wallet
        </button>
        
        <button 
          onClick={handleGetBalance} 
          disabled={isLoading || !isConnected}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#000044', color: '#0088ff', border: 'none' }}
        >
          Get Balance
        </button>
        
        <button 
          onClick={handleCheckStarAssociation} 
          disabled={isLoading || !isConnected}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#440044', color: '#ff00ff', border: 'none' }}
        >
          Check STAR Token
        </button>
        
        <button 
          onClick={handleCheckStacyUnlock} 
          disabled={isLoading || !isConnected}
          style={{ margin: '5px', padding: '10px', backgroundColor: '#444400', color: '#ffff00', border: 'none' }}
        >
          Check Stacy NFT
        </button>
      </div>

      <div style={{ marginBottom: '20px' }}>
        <h2>Results:</h2>
        <p>Balance: {balance || 'Not fetched'}</p>
        <p>STAR Associated: {starAssociated !== null ? (starAssociated ? '✅' : '❌') : 'Not checked'}</p>
        <p>Stacy Unlocked: {stacyUnlocked !== null ? (stacyUnlocked ? '✅' : '❌') : 'Not checked'}</p>
      </div>

      <div>
        <h2>Test Log:</h2>
        <button 
          onClick={clearResults}
          style={{ margin: '5px', padding: '5px', backgroundColor: '#333', color: '#fff', border: 'none' }}
        >
          Clear Log
        </button>
        <div style={{ 
          backgroundColor: '#000', 
          padding: '10px', 
          height: '200px', 
          overflowY: 'scroll',
          border: '1px solid #333'
        }}>
          {testResults.map((result, index) => (
            <div key={index} style={{ marginBottom: '5px' }}>
              {result}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default WalletTest;
