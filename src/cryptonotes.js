'use strict';

const { Transaction, Blockchain, hash } = require('./blockchain.js');
const IPFS = require('ipfs');
const EventEmitter = require('events');

const defaultOptions = {
    blockchain_path: './blockchain',
    blockchain_verify: true,
    ipfs_init: { emptyRepo: true },
    ipfs_repo: './ipfs'
};

class NoteChange extends Transaction {

    static get NEW() { return 1; }

    constructor(obj = {}) {
        super(obj instanceof Uint8Array ? obj : new Uint8Array(0));

        if (obj.id && obj.type && obj.metaHash && obj.hash) {
            const b = Buffer.from(obj.metaHash + " " + obj.hash);
            this.buffer = new Uint8Array(obj.id.byteLength + 1 + b.byteLength);
            this.buffer.set(this.id, 0);
            this.buffer.set([obj.type % 256], 32);
            this.buffer.set(b, 33);
        }
    }

    get id() {
        return this.buffer.slice(0, 32);
    }

    get type() {
        return this.buffer.subarray(32, 33)[0];
    }

    get dataString() {
        return Buffer.from(this.buffer.buffer, this.buffer.byteOffset + 33, this.buffer.byteLength - 33).toString();
    }
    get metaHash() {
        return this.dataString.split(" ")[0];
    }
    get hash() {
        return this.dataString.split(" ")[1];
    }


    inspect(depth, opts) {
        return `NoteChange\n` +
            `   ID:${this.id}\n` +
            `   Type:${this.type}\n` +
            `   Hash(meta):${this.metaHash}\n` +
            `   Hash:${this.hash}`;
    }

    static from(obj) {
        if (obj instanceof NoteChange) return obj;
        if (obj instanceof Transaction) return new NoteChange(obj.buffer);
    }
}

class CryptoNotes extends EventEmitter {
    constructor(opt = {}) {
        super();
        Object.assign(opt, defaultOptions);

        /**IPFS Node handling file storage
         * @type {IPFS}*/
        this.ipfs = new IPFS({
            init: opt.ipfs_init,
            repo: opt.ipfs_repo
        });
        this.ipfs.on('ready', () => this.emit('ipfsReady'));

        /**Blockchain handling block verification
         * @type {Blockchain}*/
        this.blockchain = new Blockchain({
            path: opt.blockchain_path,
            verify: opt.blockchain_verify
        });
        this.blockchain.loaded.then(() => this.emit('blockchainReady'));
        this.blockchain.on('block', block => block.transactions.forEach(t => {
            this.update(NoteChange.from(t));
        }));

        /**Promise resolving when everything is ready */
        this.ready = Promise.all([new Promise((res, rej) => this.ipfs.on('ready', res)), this.blockchain.loaded]);
        this.ready.then(() => this.emit('ready'));
    }


    async add(note) {
        if (!(note instanceof CryptoNote)) throw TypeError('Given object is not of type CryptoNote');
        const noteChange = await note.upload(this.ipfs);
        this.blockchain.addTransaction(noteChange);
        this.emit('note', note, noteChange);
    }

    mine() {
        this.blockchain.mine();
    }

    /**
     * updates the state of a note
     * @param {NoteChange} noteChange change
     */
    update(noteChange) {
        console.log(noteChange);
        switch (noteChange.type) {
            case 1:
                this.notes.set(noteChange.id, noteChange.metaHash);
                break;
        }
    }

}
module.exports.CryptoNotes = CryptoNotes;


class CryptoNote {
    constructor(opt = {}) {
        /**Meta information
         * @type {Object}*/
        this.meta = opt.meta || {};
        /**Content of the note
         * @type {Uint8Array}*/
        this.content = opt.content || new Uint8Array(0);
        /**Id of the note (equal to hash of the first version)
         *  @type {Uint8Array}*/
        this.id = opt.id || hash(this.content);
    }

    inspect(depth, opts) {
        return `CryptoNote\n` +
            `   Meta:${JSON.stringify(this.meta)}\n` +
            `   Content:${this.content.inspect(depth, opts)}`;
    }

    get metaBuffer() {
        return Buffer.from(JSON.stringify(this.meta));
    }

    async upload(ipfs) {
        const content = await ipfs.files.add(this.content);
        if (content.length < 1) throw Error('Content file could not be added to IPFS');
        const hash = content[0].hash;
        this.meta.hash = hash;

        const meta = await ipfs.files.add(this.metaBuffer);
        if (content.length < 1) throw Error('Meta file could not be added to IPFS');

        return new NoteChange({ id: this.id, type: NoteChange.NEW, metaHash: meta[0].hash, hash: hash });
    }

}
module.exports.CryptoNote = CryptoNote;