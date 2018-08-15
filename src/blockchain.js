﻿'use strict';
/**@module blockchain */
const crypto = require('crypto');
const fs = require('fs');

/**Hashes the given value
 * @param {(string | Buffer | TypedArray | DataView)} buf value to hash
 * @returns {Uint8Array} hash
 */
function hash(buf) {
    return crypto.createHash('sha256').update(buf).digest();
}

function btoa(encodedString) {
    return Buffer.from(encodedString, 'base64').toString();
}

function atob(string) {
    return Buffer.from(string).toString('base64');
}

/**Byte format of blocks */
const blockFormat = {
    no: { pos: 0, len: 4, end: 4, type: 'uint32' },//4 byte = 32 bit
    prevhash: { pos: 4, len: 32, end: 36, type: 'base64' },//32 byte = 256 bit
    version: { pos: 36, len: 4, end: 40, type: 'uint32' },//4byte = 32 bit
    time: { pos: 40, len: 8, end: 48, type: 'float64' },//8 byte = 64 bit
    txhash: { pos: 48, len: 32, end: 80, type: 'base64' },//32 byte = 256 bit
    nonce: { pos: 80, len: 4, end: 84, type: 'uint32' },//4 byte = 32 bit
    transactions: { pos: 84, type: 'ArrayBuffer' }
};

/**Transaction class
 */
class Transaction {
    constructor(buffer) {

        /**Buffer representation of the transaction
         * @type {ArrayBuffer}
         */
        this.buffer = buffer;
    }

    /**Byte length of the buffer
     * @type {number}
     * @readonly
     */
    get byteLength() {
        return this.buffer.byteLength;
    }

    /**
     * Returns a Transaction based on the given object
     * @param {object} obj object the new block is based on
     * @returns {Transaction} new transaction
     */
    static from(obj) {
        if (obj instanceof Transaction) return obj;

    }
}

/**Concatinates two Uint8Arrays into one.
 * @param {Uint8Array} a first array
 * @param {Uint8Array} b second array
 * @returns {Uint8Array} new array
 */
function concatUint8Arrays(a, b) {
    const c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

const tHashed = Symbol('Transactions hashed');

/**Block class
 */
class Block {

    constructor(opt = {}) {

        /**Internal buffer containing all bytes of the block
         * @type {ArrayBuffer} */
        this._buffer = opt.buffer || new ArrayBuffer(84);

        /**DataView of the header part of the block
         * @type {DataView} */
        this.header = opt.header || new DataView(this._buffer, 0, 84);

        /**Uint8Array containing the body bytes
         * @type {Uint8Array} */
        this.body = opt.body || new Uint8Array(this._buffer, 84);


        if (opt.no) this.no = opt.no;
        if (opt.prevhash) this.prevhash = opt.prevhash;
        if (opt.version) this.version = opt.version;
        if (opt.time) this.time = opt.time;
        //if (opt.txhash) this.txhash = opt.txhash;
        if (opt.nonce) this.nonce = opt.nonce;
        if (opt.transactions) this.transactions = opt.transactions;

        this.txhash = hash(this.body);
    }

    /**Readonly property returning the internal buffer
     * @type {ArrayBuffer}
     * @readonly
     */
    get buffer() {
        if (this.header.buffer !== this._buffer || this.body.buffer !== this._buffer) {
            this._buffer = new ArrayBuffer(this.header.byteLength + this.body.byteLength);
            let temp = new Uint8Array(this._buffer);
            temp.set(new Uint8Array(this.header.buffer, 0, 84));
            temp.set(this.body, this.header.byteLength);
            this.header = new DataView(this._buffer, 0, 84);
            this.body = new Uint8Array(this._buffer, 84);
        }
        return this._buffer;
    }

    /**Blocknumber (int32)
     * @type {number}
     */
    get no() {
        return this.header.getUint32(Block.format.no.pos);
    }

    set no(no) {
        this.header.setUint32(0, no);
    }

    /**Hash of the previous block
     * @type {Uint8Array}
     */
    get prevhash() {
        const f = Block.format.prevhash;
        return new Uint8Array(this.buffer, f.pos, f.len);
    }

    set prevhash(prevhash) {
        const p = Block.format.prevhash.pos;
        prevhash.forEach((b, i) => this.header.setUint8(p + i, b));
    }

    /**Base64 string of the hash of the previous block
     * @type {string}
     */
    get prevhashB64() {
        return btoa(String.fromCharCode(...this.prevhash));
    }

    set prevhashB64(prevhash) {
        let b = atob(prevhash);
        if (b.length !== Block.format.prevhash.len) return;
        this.prevhash = Array.from(b).map(c => c.charCodeAt(0));
    }

    /**Version of the block (int32)
     * @type {number}
     */
    get version() {
        return this.header.getUint32(Block.format.version.pos);
    }

    set version(version) {
        this.header.setUint32(Block.format.version.pos, version);
    }

    /**Time, when the block was mined (float64)
     * @type {number}
     */
    get time() {
        return this.header.getFloat64(Block.format.time.pos);
    }

    set time(time) {
        this.header.setFloat64(Block.format.time.pos, time);
    }

    /**Merklehash of all transactions in this block
     * @type {Uint8Array}
     */
    get txhash() {
        const f = Block.format.txhash;
        return new Uint8Array(this.buffer, f.pos, f.len);
    }

    set txhash(txhash) {
        const p = Block.format.txhash.pos;
        txhash.forEach((b, i) => this.header.setUint8(p + i, b));
    }

    /**Base64 string of the merklehash
     * @type {string}
     */
    get txhashB64() {
        return btoa(String.fromCharCode(...this.txhash));
    }

    set txhashB64(txhash) {
        let b = atob(txhash);
        if (b.length !== Block.format.txhash.len) return;
        this.txhash = Array.from(b).map(c => c.charCodeAt(0));
    }

    /**Nonce of the block. Variable 32 bits which can be changed to get the desired hash. (int32)
     * @type {number}
     */
    get nonce() {
        return this.header.getUint32(Block.format.nonce.pos);
    }

    set nonce(nonce) {
        this.header.setUint32(Block.format.nonce.pos, nonce);
    }

    /**List of Transactions
     * @type {Transaction[]}
     */
    get transactions() {
        return this._transactions;
    }

    set transactions(transactions) {
        this._transactions = transactions;
        this.updateTransactions();
    }

    /** Concatinates all Transactions to create the new body and recalculates the txhash*/
    updateTransactions() {
        const size = this._transactions.reduce((s, t) => s + 4 + t.byteLength, 0);
        this.body = new Uint8Array(size);
        const view = new DataView(this.body.buffer, 0, size);
        let pos = 0;
        this._transactions.forEach(t => {
            const arr = new Uint8Array(t.buffer);
            const len = arr.byteLength;
            view.setUint32(pos, len);
            this.body.set(arr, pos + 4);
            pos += 4 + len;
        });
        this.txhash = hash(this.body);
    }

    /**
     * Hashes the block
     * @type {Uint8Array}
     * @readonly
     */
    get hash() {
        return hash(this.header.buffer);
    }

    /**
     * Verifies the block based on the previous block
     * @param {Block=} prev Previous block
     * @returns {boolean} true if this block was verified
     */
    verify(prev = null) {
        return this.no === 0 || (prev && this.prevhash === prev.hash);
    }

    /**
     * Saves the block
     * @param {string} path path of the file
     */
    save(path) {
        if (!path) throw TypeError('Missing path argument');
        fs.writeFile(path, new Uint8Array(this.buffer, 0, this.buffer.byteLength), (err) => {
            if (err) console.error(err);
        });
    }

    /**
     * Returns a block based on the given object
     * @param {object} obj object the new block is based on
     * @returns {Block} new block
     */
    static from(obj) {
        if (obj instanceof Block) return obj;
        if (typeof obj === 'string') return Block.fromString(obj);
        if (opt.transactions) opt.transactions = obj.transactions.map(Transaction.from);
        return new Block(obj);
    }

    /**
     * Returns a block based on the given buffer
     * @param {ArrayBuffer} buf binary representation of the block
     * @returns {Block} new block
     */
    static fromBuffer(buf) {
        if (buf.byteLength < 84) return null;
        return new Block({ buffer: buf });
    }

    /**
     * Returns a block based on the given string
     * @param {string} str string
     * @returns {Block} new block
     */
    static fromString(str) {
        let obj;
        try {
            obj = JSON.parse(str);
        } catch (e) {
            obj = null;
        }

        return obj ? Block.from(obj) : null;
    }

    /**
     * Returns a block stored in the specified file
     * @param {(string | buffer)} file path of the file
     * @returns {Promise<Block>} Promise resolving to new block
     * @async
     */
    static fromFileAsync(file) {
        return new Promise((resolve, reject) => {
            fs.readFile(file, (err, data) => {
                if (err) {
                    reject(err);
                    return;
                }
                resolve(Block.fromBuffer(data.buffer));
            });
        });
    }

    static get format() {
        return blockFormat;
    }

}

/**Blockchain class */
class Blockchain {

    /**
     * Constructor
     * @param {object=} opt options object
     */
    constructor(opt = {}) {
        /**Local path of the folder containing the block files
         * @type {string}*/
        this.path = opt.path || './blockchain';

        /**Last block on the blockchain
         * @type {Block}*/
        this.tail = null;

        /**Pending transactions
         * @type {Transaction[]}*/
        this.pending = [];

        if (opt.init) this.loadAndVerify().then(no => {
            if (no === 0) this.addBlock(new Block({ no: 0, time: Date.now() }));
        });
    }

    /**
     * Iterates through the blockchain, starting at the startblock and verifies each block.
     * @param {number} startblock block number, to start iterating from
     * @returns {number} number of next block
     */
    async loadAndVerify(startblock = 0) {
        /**@type {Block} */
        let no = startblock;
        let verified = true;
        while (verified) {
            /**@type {Block} */
            let nextBlock;
            try {
                nextBlock = await Block.fromFileAsync(this.path + '/b' + no);
            } catch (e) {
                break;
            }
            if (nextBlock.verify(this.tail)) {
                this.tail = nextBlock;
                no++;
            } else {
                verified = false;
                break;
            }
        }
        console.log(`Blockchain verified: ${verified}. Next block: #${no}`);
        return no;
    }

    addBlock(block) {
        if (block.verify(this.tail)) {
            this.tail = block;
            this.tail.save(this.path + '/b' + this.tail.no);
        }
    }

    mine() {

    }
}

module.exports.Block = Block;
module.exports.Transaction = Transaction;
module.exports.Blockchain = Blockchain;