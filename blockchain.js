'use strict';
const crypto = require('crypto');

const blockFormat = {
    no: { pos: 0, len: 32, end: 32, type: 'hex' },//16 byte = 128 bit
    prevhash: { pos: 32, len: 64, end: 96, type: 'hex' },//32 byte = 256 bit
    version: { pos: 96, len: 8, end: 104, type: 'hex' },//4 byte = 64 bit
    time: { pos: 104, len: 8, end: 112, type: 'hex' },//4 byte = 64 bit
    content: { pos: 112, len: 0, end: -8, type: 'str' },
    nonce: { pos: -8, len: 8, end: undefined, type: 'hex' }//4 byte = 64 bit
}

class Block {
    constructor(no, prevhash, version, time, content, nonce) {
        this.no = no;
        this.prevhash = prevhash;
        this.version = version;
        this.time = time;
        this.content = content;
        this.nonce = nonce;
    }

    get hash() {
        const f = Block.format;
        const str = "";
        str += numToHex(this.no, f.no.len);
        str += numToHex(this.prevhash, f.prevhash.len);
        str += numToHex(this.version, f.version.len);
        str += numToHex(this.time, f.time.len);
        str += content.toString();
        str += numToHex(this.nonce, f.nonce.len);
        return str;
    }

    validate(prev = null) {
        return this.no === 0 || (prev && this.prevhash == prev.hash);
    }

    static from(obj) {
        if (!('no' in obj && 'prevhash' in obj && 'version' in obj && 'time' in obj && 'content' in obj && 'nonce' in obj)) return null;
        return new Block(obj.no, obj.prevhash, obj.version, obj.time, obj.content, obj.nonce);
    }

    static fromString(s) {
        const f = Block.format;
        if (s.length < f.reduce((sum, a) => sum + a.len, 0)) return null;
        const obj = {};
        for (let a in f) {
            let val = s.slice(a.pos, a.end);
            if (a.type == 'hex') val = parseInt(val, 16);
            obj[a] = val;
        }
        return Block.from(obj);
    }

    static get format() {
        return blockFormat;
    }

}

function numToHex(num, digits = 1) {
    num = num % (16 ** digits);
    let hex = num.toString(16);
    while (hex.length < digits) hex = '0' + hex;
    return hex;
}

module.exports.Block = Block;