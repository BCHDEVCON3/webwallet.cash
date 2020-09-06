// Based on  ElectrumNetworkProvider.ts by @rkalis, who also gave guidance on 
// usage. Thanks Rosco.

import {
  binToHex, cashAddressToLockingBytecode
 } from '@bitauth/libauth';
import {
  ElectrumCluster,
  ElectrumTransport,
  ClusterOrder,
  RequestResponse,
} from 'electrum-cash';
// import { Utxo } from './interfaces';
import { cryptoPromise } from './crypto';

const electrum = new ElectrumCluster('webwallet.cash', '1.4.1', 2, 3, ClusterOrder.PRIORITY);

electrum.addServer('bch.imaginary.cash', 50004, ElectrumTransport.WSS.Scheme, false);
electrum.addServer('blackie.c3-soft.com', 50004, ElectrumTransport.WSS.Scheme, false);
electrum.addServer('electroncash.de', 60002, ElectrumTransport.WSS.Scheme, false);
electrum.addServer('electroncash.dk', 50004, ElectrumTransport.WSS.Scheme, false);
electrum.addServer('bch.loping.net', 50004, ElectrumTransport.WSS.Scheme, false);
electrum.addServer('electrum.imaginary.cash', 50004, ElectrumTransport.WSS.Scheme, false);

async function getBalance(address: string, callback: (balance: number) => void) {

  console.log("get_balance called");
  

  const scripthash = await addressToElectrumScriptHash(address);

  const result = await performRequest('blockchain.scripthash.get_balance', scripthash) as Balance;

  console.log("Balance .... ", result.unconfirmed + result.confirmed);
  
  callback(result.unconfirmed + result.confirmed);

}

export async function subscribeToBalance(address: string, callback: (balance: number) => void) {

  const scripthash = await addressToElectrumScriptHash(address);
  
  await getBalance(address, callback);

  const result = await subscribeRequest(() => {
      getBalance(address, callback);
    }, 'blockchain.scripthash.subscribe', scripthash) as Balance;

  
  console.log(result);
}

export async function getUtxos(address: string) {

    const scripthash = await addressToElectrumScriptHash(address);

    const result = await performRequest('blockchain.scripthash.listunspent', scripthash) as ElectrumUtxo[];

    return result;
}

export async function sendRawTransaction(txHex: string): Promise<string> {
    return await performRequest('blockchain.transaction.broadcast', txHex) as string;
  }

async function connectCluster(): Promise<boolean[]> {
    try {
      return await electrum.startup();
    } catch (e) {
      console.log("Error starrting cluster:", e);
      return [];
    }
  }

async function disconnectCluster(): Promise<boolean[]> {
    return electrum.shutdown();
  }

async function performRequest(
    name: string,
    ...parameters: (string | number | boolean)[]
  ): Promise<RequestResponse> {

  await electrum.ready();

  const result = await electrum.request(name, ...parameters);
  if (result instanceof Error) throw result;

  return result;
}

async function subscribeRequest(
  callback: () => void,
  name: string,
  ...parameters: (string | number | boolean)[]
): Promise<RequestResponse> {

await electrum.ready();

const result = await electrum.subscribe(callback, name, ...parameters);
//if (result instanceof Error) throw result;

return result;
}


interface ElectrumUtxo {
  tx_pos: number;
  value: number;
  tx_hash: string;
  height: number;
}

interface Balance {
  confirmed: number;
  unconfirmed: number;
}

/**
 * Helper function to convert an address to an electrum-cash compatible scripthash.
 * this is necessary to support electrum versions lower than 1.4.3, which do not
 * support addresses, only script hashes.
 *
 * @param address Address to convert to an electrum scripthash
 *
 * @returns The corresponding script hash in an electrum-cash compatible format
 */
async function addressToElectrumScriptHash(address: string) {
  
  // Retrieve locking script
  const lockScript = cashAddressToLockingBytecode(address);
  if (typeof lockScript === "string") throw Error("Invalid address");

  const sha256 = (await cryptoPromise).sha256.hash;

  // Hash locking script
  const scriptHash = sha256(lockScript.bytecode);

  // Reverse scripthash
  scriptHash.reverse();

  // Return scripthash as a hex string
  return binToHex(scriptHash);
}

connectCluster();

