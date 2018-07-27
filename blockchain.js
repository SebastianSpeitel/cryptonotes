'use strict';
const crypto = require('crypto');

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
        const str = "";
        str += numToHex(this.no, 32);//16 byte = 128 bit
        str += numToHex(this.prevhash, 64);//32 byte = 256 bit
        str += numToHex(this.version, 8);//4 byte = 64 bit
        str += numToHex(this.time, 8);//4 byte = 64 bit
        str += content.toString();
        str += numToHex(this.nonce, 8);//4 byte = 64 bit
        return str;
    }

    validate(prev = null) {
        return this.no === 0 || (prev && this.prevhash == prev.hash);
    }

    static fromJSON(json) {
        if (!('no' in json && 'prevhash' in json && 'version' in json && 'time' in json && 'content' in json && 'nonce' in json)) return null;
        return new Block(json.no, json.prevhash, json.version, json.time, json.content, json.nonce);
    }

}

function numToHex(num, digits = 1) {
    if (num > 4 ** digits) throw Error('Number doesn\'t fit');
    let hex = num.toString(16);
    while (hex.length < digits) hex = '0' + hex;
    return hex;
}

module.exports.Block = Block;