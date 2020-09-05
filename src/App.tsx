import React, { useState } from 'react';
import './App.css';
import { useAddress } from './useAddress';
import QRDisplay from 'qrcode.react';
import QRScanner from 'react-qr-reader';

function App() {

  const address = useAddress();
  const [recipient, setRecipient] = useState("");
  const [scanning, setScanning] = useState(false);

  function handleScan(data: string | null) {
    if (data?.startsWith("bitcoincash")) {
      setScanning(false);
      console.log("Recipient:", data);
    }
  }

  function handleError(err: any) {
    console.log("Error:", err);
  }

  function handleSendButton() {
    setScanning(true);
  }

  function handleCancelButton() {
    setScanning(false);
  }

  return (
    <div>
      <header>
        <p>Web Wallet</p>
      </header>
      <p>Balance: {address.balance}</p>
      <p>URI: {address.uri}</p>
      <div/> 
      {scanning
        ? <>
            <QRScanner
              delay={100}
              style={{height: 300, width: 300}}
              onError={handleError}
              onScan={handleScan}
              >
            </QRScanner>
            <button onClick={handleCancelButton}>Cancel</button>
          </> 
        : <>
            { address.uri
              ? <QRDisplay value={address.uri}></QRDisplay>
              : ""   
            }
            <div/>
            <button onClick={handleSendButton}>Send</button>
        </>
      }
    </div>
  );
}

export default App;
