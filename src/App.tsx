import React, { useState } from 'react';
import './App.css';
import { useAddress } from './useAddress';
import QRDisplay from 'qrcode.react';
import Send from './Send';

function App() {

  const address = useAddress();
  const [sendMode, setSendMode] = useState(false);

  function handleSendButton() {
    setSendMode(true);
  }

  function cancelSend() {
    setSendMode(false);
  }

  return (
    <div>
      <header className="App-title">
        <p>web<span style={{ fontWeight: "bold"}}>wallet</span>.cash</p>
      </header>
      <div/> 
      {sendMode
        ? <Send
            cancelSend={cancelSend}
            address={address}
          ></Send>
        : <>
            <p className="App-subtitle">{address.balance 
              ? address.balance.toString() + " sats"
              : "loading balance..." }
              </p>
            { address.uri
              ? <div className="QR">
                  <QRDisplay value={address.uri}></QRDisplay>
                </div>
              : ""
            }
            <div>
              <button onClick={handleSendButton}>Send</button>
            </div>
        </>
      }
    </div>
  );
}

export default App;
