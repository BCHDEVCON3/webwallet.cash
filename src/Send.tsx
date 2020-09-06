import React, { useState, ClipboardEvent } from 'react';
import QRScanner from 'react-qr-reader';
import { Address } from './useAddress';
import { decode } from "bip21";

function Send({ cancelSend, address } : {
  cancelSend: () => void;
  address: Address;
}) {

  const [recipient, setRecipient] = useState<string>();
  const [amount, setAmount] = useState<number>();
  const [scanning, setScanning] = useState(true);
  const [readyToConfirm, setReadyToConfirm] = useState(false);

  function handleScan(data: string | null) {
    if (data) {
      try {
        const decoded = decode(data);
        setScanning(false);
        setRecipient("bitcoincash:" + decoded.address);
        if (decoded.options?.amount) setAmount(decoded.options?.amount * 10**8);
        console.log("Recipient:", data);
        setReadyToConfirm(true);
      } catch (error) {
        // Todo: let the user know the QRcode was invalid
        setTimeout(cancelSend, 1000);
      }
    }
  }

  function handleConfirm() {
    console.log("handleConfirm invoked ....");
    
    if (recipient && amount) 
      address.send(recipient, amount);
      cancelSend();
  }

  function handleCancelButton() {
    cancelSend();
  }

  function handlePaste(event: ClipboardEvent) {
    event.clipboardData.items[0].getAsString(text => {
      setRecipient(text);
    });
    setScanning(false);
  }

  function handleError(err: any) {
    console.log("Error:", err);
  }

  return (
    <>
    <header className="App-subtitle">Send</header>
    { scanning
      ? <>
          <QRScanner
              delay={100}
              style={{height: 300, width: 300}}
              onError={handleError}
              onScan={handleScan}
              >
          </QRScanner>
          <input
            type="text"
            onPaste={handlePaste}
            defaultValue="or paste here"
           
          ></input>
        </>
      : <p>To {recipient}</p>
    }
    { readyToConfirm
      ? <>
        <p>Amount: {amount}</p>
        <button onClick={handleConfirm}>Confirm</button>
      </>
      : ""
    }
    <button onClick={handleCancelButton}>Cancel</button>
  </>
  );
}

export default Send;