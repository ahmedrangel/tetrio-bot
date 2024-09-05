import { Client } from "@haelp/teto";
import type { Room } from "@haelp/teto/dist/types/classes/index";
import type { Piece, Engine } from "@haelp/teto/dist/types/engine/index";
import type { Game } from "@haelp/teto/dist/types/types/index";
import { ORIENTATION_COLUMNS, PIECE_INDEXES, clientOpts, keyPress } from "./utils/helpers";
import ElTetris from "./utils/eltetris";

class TetrioBotClient {
  private eltetris: ElTetris;
  private currentColumn: number;
  private moves: number;
  private client: Client;
  private room: Room;
  private engine: Engine;
  private currentPiece: Piece;
  private nextPieces: Piece[];
  private heldPiece: Piece;
  private playing: boolean;
  private keys: Game.Tick.Keypress[];
  constructor () {
    this.currentColumn = 4; // 5 if O
    this.eltetris = new ElTetris(10, 20);
    this.moves = 0;
    this.client = null;
    this.engine = null;
    this.currentPiece = null;
    this.nextPieces = [];
    this.heldPiece = null;
    this.playing = false;
    this.keys = [];
  }

  async login (credentials: { username: string, password: string } | { token: string }) {
    this.client = await Client.connect({
      ...clientOpts(credentials)
    });
    this.init(this.client);
  }

  async createRoom (type: "public" | "private") {
    return await this.client.rooms.create(type);
  }

  private getFallingPiece () {
    this.currentPiece = this.engine.falling.symbol;
    this.currentColumn = this.currentPiece === "o" ? 5 : 4;
  }

  private getNextPieces () {
    this.nextPieces = this.engine.queue.value;
  }

  private moveLeft () {
    console.info("<- Left");
    this.keys.push(...keyPress("moveLeft", this.engine.frame));
  }

  private moveRight () {
    console.info("-> Right");
    this.keys.push(...keyPress("moveRight", this.engine.frame));
  }

  private hold () {
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

  private drop () {
    console.info("! Drop");
    this.keys.push(...keyPress("hardDrop", this.engine.frame));
  }

  private changeOrientation (orientation: number) {
    console.info("Changing orientation to", orientation);
    if (orientation === 1)
      this.keys.push(...keyPress("rotateCW", this.engine.frame));
    if (orientation === 2)
      this.keys.push(...keyPress("rotate180", this.engine.frame));
    if (orientation === 3)
      this.keys.push(...keyPress("rotateCCW", this.engine.frame));

    this.currentColumn = ORIENTATION_COLUMNS[String(this.currentPiece)][orientation];
  }

  private moveToColumn (column: number) {
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

  private playMove () {
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

  restoreDefaults () {
    this.playing = false;
    this.moves = 0;
    this.keys = [];
    this.currentPiece = null;
    this.currentColumn = 4;
    this.eltetris = new ElTetris(10, 20);
  }

  private async init (client: Client) {
    client.on("client.game.round.start", async (event) => {
      this.playing = true;
      this.engine = this.client.game.engine;
      this.getFallingPiece();
      const tick = event[0];
      tick(async (data) => {
        if (this.playing && data.frame % 10 === 9) {
          this.playMove();
          return { keys: this.keys };
        }
        return {};
      });
    });

    client.on("client.game.over", () => {
      this.restoreDefaults();
    });

    client.on("client.game.round.end", () => {
      this.restoreDefaults();
    });

    client.on("client.error", () => {
      this.restoreDefaults();
    });
  }
}

export default TetrioBotClient;