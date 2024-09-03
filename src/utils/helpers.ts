import type { ClientOptions } from "@haelp/teto/dist/types/classes";
import type { Engine } from "@haelp/teto/dist/types/engine";
import type { Game } from "@haelp/teto/dist/types/types/index";

export const PIECE_INDEXES = {
  I: 0,
  T: 1,
  O: 2,
  J: 3,
  L: 4,
  S: 5,
  Z: 6
};

export const ORIENTATION_COLUMNS = {
  I: [4, 6],
  T: [4, 5, 4, 4],
  O: [5],
  L: [4, 5, 4, 4],
  S: [4, 5],
  J: [4, 5, 4, 4],
  Z: [4, 5]
};

export const clientOpts = (credentials: { username: string, password: string } | { token: string }): ClientOptions => {
  return {
    ...credentials,
    userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 OPR/112.0.0.0",
    handling: {
      arr: 0,
      das: 10,
      dcd: 0,
      sdf: 41,
      safelock: false,
      cancel: false,
      may20g: true
    }
  };
};

export const keyPress = (key: Game.Key, frame: Engine["frame"]): Game.Tick.Keypress[] => {
  return [
    {
      frame: frame,
      type: "keydown",
      data: {
        key,
        subframe: 0
      }
    },
    {
      frame: frame,
      type: "keyup",
      data: {
        key,
        subframe: 0
      }
    }
  ];
};
