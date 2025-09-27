import { useEffect, useRef } from "react";
import ZombieSkaterGame from "./components/ZombieSkaterGame";
import WalletTest from "./components/wallet/WalletTest";
import "@fontsource/inter";

function App() {
  // Check if we should show the wallet test
  const urlParams = new URLSearchParams(window.location.search);
  const showWalletTest = urlParams.get('test') === 'wallet';

  if (showWalletTest) {
    return <WalletTest />;
  }

  return (
    <div style={{
      width: '100vw',
      height: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#000'
    }}>
      <ZombieSkaterGame />
    </div>
  );
}

export default App;
