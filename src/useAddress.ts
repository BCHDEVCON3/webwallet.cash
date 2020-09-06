import { useState, useEffect, useMemo } from 'react';
// @ts-ignore
import { Transaction, PrivateKey } from 'bitcore-lib-cash';
import {
  encodeCashAddress,
  binToHex,
  hexToBin,
  generatePrivateKey,
  cashAddressToLockingBytecode
} from "@bitauth/libauth";
import {
  subscribeToBalance,
  getUtxos,
  sendRawTransaction
} from './electrumProvider';
import { cryptoPromise } from "./crypto";


if (!window.localStorage.privateKey) {
  window.localStorage.privateKey = binToHex(generatePrivateKey(() => 
    window.crypto.getRandomValues(new Uint8Array(32))
  ));
}

const privateKey = hexToBin(window.localStorage.privateKey);

export interface AddressBasics {
  privateKey : Uint8Array,
  publicKey? : Uint8Array,
  uri?: string
}

export const useAddress = () => {

  const [address, setAddress] = useState<AddressBasics>({ privateKey });
  const [balance, setBalance] = useState<number | undefined>(undefined);

  useEffect(() => {
    async function deriveAddressDetails() {
      const crypto = await cryptoPromise;
      const publicKey = crypto.secp256k1.derivePublicKeyCompressed(privateKey);
      const uri = encodeCashAddress('bitcoincash', 0, 
        crypto.ripemd160.hash(crypto.sha256.hash(publicKey)));
      setAddress({ privateKey, publicKey, uri});
      subscribeToBalance(uri, setBalance);
      console.log(uri);
      
    }
    deriveAddressDetails();
  }, []);


  interface BitcoreUTXO {
    txId: string,
    outputIndex: number,
    address: string,
    script: string,
    satoshis: number
  };
  
  interface ElectrumUTXO {
    tx_hash: string,
    tx_pos: number,
    height: number,
    value: number
  }

  const send = async (recipient: string, sats: number) => {

    console.log("Send was called.");
    
    const uri = address.uri!;

    const lockingBytecode = cashAddressToLockingBytecode(uri);
    if (typeof lockingBytecode === "string")
      throw new Error("Error converting cashAddr to locking bytecode");  

    const utxos = await getUtxos(uri);

    const bitcoreUTXOs = utxos.map((utxo: ElectrumUTXO) => {
      return {
      txId: utxo.tx_hash,
      outputIndex: utxo.tx_pos,
      address: uri,
      script: Buffer.from(lockingBytecode.bytecode).toString('hex'),
      satoshis: utxo.value
      } as BitcoreUTXO;
    });
  
    const feePerByte = 2;
    const tx = new Transaction()
      .from(bitcoreUTXOs)
      .to(recipient, sats)
      .change(uri)
      .feePerByte(feePerByte)
      .sign(new PrivateKey(binToHex(privateKey)), undefined, 'schnorr');
    
    const broadcastStatus = await sendRawTransaction(tx.serialize());
    
    console.log(`Broadcast status: ${broadcastStatus}`);
    console.log(`Sent ${sats} to ${recipient}`);
    
    return broadcastStatus;
  }

  return {
      ...address,
      balance,
      send
  }
}

export type Address = ReturnType<typeof useAddress>;



