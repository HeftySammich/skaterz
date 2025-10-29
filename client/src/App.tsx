import { useEffect, useRef } from "react";
import ZombieSkaterGame from "./components/ZombieSkaterGame";
import "@fontsource/inter";

function App() {
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
