import { useState, useEffect, useMemo } from 'react';
import useLocalStorage from 'react-use-localstorage';
import {
  encodeCashAddress,
  binToHex,
  hexToBin,
  generatePrivateKey
} from "@bitauth/libauth";
import {
  subscribeToBalance,
  getUtxos,
  sendRawTransaction
} from './electrumProvider';
import { cryptoPromise } from "./crypto";


if (!window.localStorage.privateKey) {
  window.localStorage.privateKey = generatePrivateKey(() => 
    window.crypto.getRandomValues(new Uint8Array(32))
  );
}

const privateKey = hexToBin(window.localStorage.privateKey);

export interface Address {
  privateKey : Uint8Array,
  publicKey? : Uint8Array,
  uri?: string
}

export const useAddress = () => {

  const [address, setAddress] = useState<Address>({ privateKey });
  const [balance, setBalance] = useState(0);

  useEffect(() => {
    async function deriveAddressDetails() {
      const crypto = await cryptoPromise;
      const publicKey = crypto.secp256k1.derivePublicKeyCompressed(privateKey);
      const uri = encodeCashAddress('bitcoincash', 0, 
        crypto.ripemd160.hash(crypto.sha256.hash(publicKey)));
      setAddress({ privateKey, publicKey, uri});
      subscribeToBalance(uri, setBalance);
    }
    deriveAddressDetails();
  }, []);


  const send = (recipient: string, sats: number) => {
      console.log(`Sent ${sats} to ${recipient}`);
  }

  return {
      ...address,
      balance,
      send
  }
}