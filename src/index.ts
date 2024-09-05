import TetrioBotClient from "./client";
import "dotenv/config";

const token = process.env.TETRIO_TOKEN;
const username = process.env.TETRIO_USERNAME;
const password = process.env.TETRIO_PASSWORD;
const credentials = token ? { token } : { username, password };

const client = new TetrioBotClient();
await client.login(credentials);
const room = await client.createRoom("private");
room.update({ index: "autoStart", value: 15 });
console.info("Joined room:", room.id);