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

    node.on('ready', () => {
        console.log('IPFS node ready');
        ipfsReady = true;
    });

    blockchain = new Blockchain({
        verify: true
    });
    await blockchain.loaded;

}
module.exports.init = init;

function mine() {
    return blockchain.mine();
}
module.exports.mine = mine;

class CryptoNote {
    constructor() {

    }

    create() {

    }
}

function search() {

}

function add() {

}
