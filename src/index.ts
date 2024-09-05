import { Client } from "@haelp/teto";
import type { Room } from "@haelp/teto/dist/types/classes/index";
import type { Piece, Engine } from "@haelp/teto/dist/types/engine/index";
import type { Game } from "@haelp/teto/dist/types/types/index";
import { ORIENTATION_COLUMNS, PIECE_INDEXES, clientOpts, keyPress } from "./utils/helpers";
import ElTetris from "./utils/eltetris";
import "dotenv/config";

const token = process.env.TETRIO_TOKEN;
const username = process.env.TETRIO_USERNAME;
const password = process.env.TETRIO_PASSWORD;

class TetrioBot {
  eltetris: ElTetris;
  currentColumn: number;
  moves: number;
  client: Client;
  room: Room;
  engine: Engine;
  currentPiece: Piece;
  nextPieces: Piece[];
  heldPiece: Piece;
  playing: boolean;
  keys: Game.Tick.Keypress[];
  constructor () {
    this.currentColumn = 4; // 5 if O
    this.eltetris = new ElTetris(10, 20);
    this.moves = 0;
    this.client = null;
    this.room = null;
    this.engine = null;
    this.currentPiece = null;
    this.nextPieces = [];
    this.heldPiece = null;
    this.playing = false;
    this.keys = [];
  }

  async login (credentials: { username: string, password: string } | { token: string }) {
    return this.client = await Client.connect({
      ...clientOpts(credentials)
    });
  }

  async createRoom (type: "public" | "private") {
    this.room = await this.client.rooms.create(type);
    this.room.update({ index: "autoStart", value: 15 });
    console.info("Joined room", this.room.id);
    return this.room;
  }

  getFallingPiece () {
    this.currentPiece = this.engine.falling.symbol;
    this.currentColumn = this.currentPiece === "o" ? 5 : 4;
  }

  getNextPieces () {
    this.nextPieces = this.engine.queue.value;
  }

  moveLeft () {
    console.info("<- Left");
    this.keys.push(...keyPress("moveLeft", this.engine.frame));
  }

  moveRight () {
    console.info("-> Right");
    this.keys.push(...keyPress("moveRight", this.engine.frame));
  }

  hold () {
    console.info("[] Hold");
    this.keys.push(...keyPress("hold", this.engine.frame));
    if (!this.heldPiece) {
      this.heldPiece = this.currentPiece;
      this.currentPiece = this.nextPieces[0];
    }
    else {
      const tmp = this.heldPiece;
      this.heldPiece = this.currentPiece;
      this.currentPiece = tmp;
    }
  }

  drop () {
    console.info("! Drop");
    this.keys.push(...keyPress("hardDrop", this.engine.frame));
  }

  changeOrientation (orientation: number) {
    console.info("Changing orientation to", orientation);
    if (orientation === 1)
      this.keys.push(...keyPress("rotateCW", this.engine.frame));
    if (orientation === 2)
      this.keys.push(...keyPress("rotate180", this.engine.frame));
    if (orientation === 3)
      this.keys.push(...keyPress("rotateCCW", this.engine.frame));

    this.currentColumn = ORIENTATION_COLUMNS[String(this.currentPiece)][orientation];
  }

  moveToColumn (column: number) {
    const deltaColumn = column - this.currentColumn + 1;
    if (deltaColumn < 0) {
      let i = 0;
      while (i < Math.abs(deltaColumn)) {
        this.moveLeft();
        i++;
      }
    }
    else if (deltaColumn > 0) {
      let i = 0;
      while (i < Math.abs(deltaColumn)) {
        this.moveRight();
        i++;
      }
    }
  }

  playMove () {
    this.getFallingPiece();
    this.getNextPieces();
    const holdConsideration = this.heldPiece ? PIECE_INDEXES[String(this.heldPiece)] : PIECE_INDEXES[String(this.nextPieces[0])];
    const move = this.eltetris.pickMove(PIECE_INDEXES[String(this.currentPiece)], holdConsideration);
    const { orientationIndex, orientation, column, hold } = move;
    if (hold) this.hold();
    this.eltetris.updateTetrioBoard(this.engine.board.state);
    this.eltetris.playMove(this.eltetris.board, orientation, column);
    console.info("\nMove #", this.moves, "piece:", this.currentPiece.toUpperCase(), "columna:", column);
    this.changeOrientation(orientationIndex);
    this.moveToColumn(column);
    this.drop();
    this.moves++;
  }

  restartDefaults () {
    this.playing = false;
    this.moves = 0;
    this.keys = [];
    this.currentPiece = null;
    this.currentColumn = 4;
    this.eltetris = new ElTetris(10, 20);
  }

  async init () {
    const credentials = token ? { token } : { username, password };
    await this.login(credentials);
    await this.createRoom("private");

    this.client.on("client.game.round.start", async (event) => {
      this.playing = true;
      this.engine = this.client.game.engine;
      this.getFallingPiece();
      const tick = event[0];
      tick(async (data) => {
        if (this.playing && data.frame % 10 === 9) {
          this.playMove();
          return {
            keys: this.keys
          };
        }
        return {};
      });
    });

    this.client.on("client.game.over", () => {
      this.restartDefaults();
    });

    this.client.on("client.game.round.end", () => {
      this.restartDefaults();
    });

    this.client.on("client.error", () => {
      this.restartDefaults();
    });
  }
}

const tetrioBot = new TetrioBot();
await tetrioBot.init();