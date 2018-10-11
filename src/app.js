'use strict';

const { CryptoNotes, CryptoNote } = require('./cryptonotes.js');

const cn = new CryptoNotes();

cn.on('ipfsReady', () => console.log('IPFS ready'));

cn.blockchain.on('load', no => {
    console.log(`Blockchain found local blocks up to #${no}`);
});

cn.on('ready', () => {
    //const note = new CryptoNote({
    //    content: Buffer.from("Test file for cryptonote")
    //});
    //cn.add(note);
});

cn.on('note', (note, tx) => {
    console.log(`New CryptoNode added:`);
    console.log(note);
    console.log(tx);

    cn.mine();
});

cn.blockchain.on('verify', (v, no, last) => {
    if (v) console.log(`Blockchain verified up to last block (#${no})`);
    else console.log(`Blockchain could only be verified up to block #${no}. Last local block: #${last}`);
});

