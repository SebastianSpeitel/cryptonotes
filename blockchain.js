'use strict';
const crypto = require('crypto');

function hash(buf) {
    return crypto.createHash('sha256').update(buf).digest();
}

const blockFormat = {
    no: { pos: 0, len: 4, end: 4, type: 'uint32' },//4 byte = 32 bit
    prevhash: { pos: 4, len: 32, end: 36, type: 'base64' },//32 byte = 256 bit
    version: { pos: 36, len: 4, end: 40, type: 'uint32' },//4byte = 32 bit
    time: { pos: 40, len: 8, end: 48, type: 'float64' },//8 byte = 64 bit
    txhash: { pos: 48, len: 32, end: 80, type: 'base64' },//32 byte = 256 bit
    nonce: { pos: 80, len: 4, end: 84, type: 'uint32' },//4 byte = 32 bit
    transactions: { pos: 84, type: 'utf-8' }
}

class Transaction {
    constructor(buffer) {
        this.buffer = buffer;
    }

    static from(obj) {
        if (obj instanceof Transaction) return obj;

    }
}

/**
 * Concatinates two Uint8Arrays into one.
 * @param {Uint8Array} a
 * @param {Uint8Array} b
 * @returns {Uint8Array}
 */
function concatUint8Arrays(a, b) {
    const c = new Uint8Array(a.length + b.length);
    c.set(a);
    c.set(b, a.length);
    return c;
}

const tHashed = Symbol('Transactions hashed');

class Block {
    constructor(no, prevhash, version, time = Date.now(), transactions = [], nonce = 0) {
        const f = Block.format;
        const buffer = new ArrayBuffer(84);

        this.bytes = new DataView(buffer, 0, buffer.byteLength);

        this.no = no;
        this._prevhash = new Uint8Array(buffer, f.prevhash.pos, f.prevhash.len);
        this.prevhash = prevhash;
        this.version = version;
        this.time = time;
        this._txhash = new Uint8Array(buffer, f.txhash.pos, f.txhash.len);
        this.nonce = nonce;

        this.transactions = transactions;
    }

    get no() {
        return this.bytes.getUint32(Block.format.no.pos);
    }

    set no(no) {
        this.bytes.setUint32(0, no);
    }

    get prevhash() {
        return btoa(String.fromCharCode(...this._prevhash));
    }

    set prevhash(prevhash) {
        let b = atob(prevhash);
        if (b.length !== Block.format.prevhash.len) return;
        this._prevhash.set(Array.from(b).map(c => c.charCodeAt(0)));
    }

    get version() {
        return this.bytes.getUint32(Block.format.version.pos);
    }

    set version(version) {
        this.bytes.setUint32(Block.format.version.pos, version);
    }

    get time() {
        return this.bytes.getFloat64(Block.format.time.pos);
    }

    set time(time) {
        this.bytes.setFloat64(Block.format.time.pos, time);
    }

    get txhash() {
        return btoa(String.fromCharCode(...this._txhash));
    }

    set txhash(txhash) {
        let b = atob(txhash);
        if (b.length !== Block.format.txhash.len) return;
        this._txhash.set(Array.from(b).map(c => c.charCodeAt(0)));
    }

    get nonce() {
        return this.bytes.getUint32(Block.format.nonce.pos);
    }

    set nonce(nonce) {
        this.bytes.setUint32(Block.format.nonce.pos, nonce);
    }

    get transactions() {
        return this._transactions;
    }

    set transactions(transactions) {
        this._transactions = transactions;
        this.txhash = hash(this.transactions.reduce((a, t) => concatUint8Arrays(a, t.uint8Array), new Uint8Array(0)).buffer);
    }

    get hash() {
        return hash(this.raw.buffer);
    }

    validate(prev = null) {
        return this.no === 0 || (prev && this.prevhash == prev.hash);
    }

    static from(obj) {
        if (obj instanceof Block) return obj;
        if (typeof obj === 'string') return Block.fromString(obj);
        if (!('no' in obj && 'prevhash' in obj && 'version' in obj && 'time' in obj && 'transactions' in obj && 'nonce' in obj)) return null;
        return new Block(obj.no, obj.prevhash, obj.version, obj.time, obj.transactions.map(Transaction.from), obj.nonce);
    }

    static fromString(s) {
        let obj;
        try {
            obj = JSON.parse(s);
        } catch (e) {
            obj = null;
        }

        return obj ? Block.from(obj) : null;
    }



    static get format() {
        return blockFormat;
    }

    static get headerLength() {
        const f = Block.format;
        return f.transactions.pos;
    }

}

module.exports.Block = Block;
module.exports.Transaction = Transaction;