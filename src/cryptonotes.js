'use strict';

const { Block, Transaction, Blockchain } = require('./blockchain.js');
const IPFS = require('ipfs');

const options = {
    blockchainpath: './blockchain',
    ipfs_init: { emptyRepo: true },
    ipfs_repo: './ipfs'
};

let node;
/**@type {Blockchain} */
let blockchain;
let ipfsReady = false;

async function init(opt = {}) {
    Object.assign(options, opt);
    node = new IPFS({
        init: options.ipfs_init,
        repo: options.ipfs_repo
    });

    blockchain = new Blockchain({
        init: true
    });

    node.on('ready', () => {
        console.log('IPFS node ready');
        ipfsReady = true;
    });
}
module.exports.init = init;


class CryptoNote {
    constructor() {

    }
}

function search() {

}

function add() {

}
