import { GatewayIntentBits, Partials } from "discord.js";
import * as discord from "discord.js";
import * as express from "express";
import { config } from "..";
import * as bodyParser from "body-parser";
import { EventEmitter } from "events";
import * as request from "request";
import { exec } from "child_process";
import { CredentialsAuthenticateInitialResponse, CredentialsAuthenticateResponse, authenticate } from "@xboxreplay/xboxlive-auth";
import { getPlayerSettings } from "@xboxreplay/xboxlive-api";

class signalFromBDS {
	onMessage: EventEmitter;
	queue: { [timestamp: string]: { playerName: string; message: string } }; //Discord=>BDSのチャットのキュー
	time: number; //再起動のためのカウント
	constructor() {
		this.time = new Date().getTime();
		this.queue = {};
		const app = express();
		this.onMessage = new EventEmitter();
		app.use(bodyParser.json());
		app.use(
			bodyParser.urlencoded({
				extended: true,
			})
		);
		app.listen(3000, () => {
			console.log("サーバー起動中");
		});

		app.post("/", (req, res) => {
			res.set("content-type", "text/plain; charset=utf-8");
			res.statusCode = 200;
			res.statusMessage = "OK";
			res.send(encodeURI(JSON.stringify({})));
			const body = req.body;
			this.onMessage.emit("event", { playerName: body["playerName"], message: body["message"] });
			return;
		});
		app.get("/chat", (req, res) => {
			this.time = new Date().getTime();
			res.set("content-type", "text/plain; charset=utf-8");
			res.send(encodeURI(JSON.stringify(this.queue)));
			this.queue = {};
			return;
		});
	}
	send(playerName: string, message: string) {
		const timestamp = new Date().getTime();
		this.queue[timestamp] = { playerName: playerName, message: message };
	}
}

class signalFromDiscord {
	client: discord.Client;
	onMessage: EventEmitter;
	mcid_avatar_map: Map<string, string>;
	constructor() {
		const { Client } = discord;
		this.client = new Client({
			intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent],
			partials: [Partials.Channel],
		});
		this.onMessage = new EventEmitter();

		this.client.once("ready", async () => {
			console.log("~~~~~~~~~~~~~~~~~~~");
			console.log("Discord BDS Connect Bot started");
			console.log('logined as "' + this.client.user?.tag + '"');
			console.log("~~~~~~~~~~~~~~~~~~~");
		});

		this.client.on("messageCreate", (msg) => {
			this.onMessage.emit("event", msg);
		});
		this.client.login(config.chat_bot_token);
		this.mcid_avatar_map = new Map();
	}
	send(author: string, message: string, avatar_url?: string | undefined) {
		const body: { username: string; content: string; avatar_url?: string } = { username: author, content: message };
		if (avatar_url !== undefined) body["avatar_url"] = avatar_url;
		this.request_to_webhook(body);
	}
	private request_to_webhook(body: { username: string; content: string; avatar_url?: string }) {
		request.post(
			{
				url: config.chat_webhook_url,
				body: body,
				headers: { "content-type": "application/json; charset=utf-8" },
				json: true,
			},
			(err, res) => {
				if (err) {
					console.error(err);
				}
			}
		);
	}
}
class xboxLiveApiClass {
	x_token: string;
	hash: string;
	constructor() {
		this.hash = "";
		this.x_token = "";
		const re_auth = async () => {
			try {
				const res = await authenticate(config.xbox_api_email, config.xbox_api_pass);
				const isCredentialsAuthenticateInitialResponse = (test: any): test is CredentialsAuthenticateInitialResponse => {
					return typeof test.user_hash === "string";
				};
				if (!isCredentialsAuthenticateInitialResponse(res)) return;
				this.hash = res.user_hash;
				this.x_token = res.xsts_token;
			} catch {
				return;
			}
		};
		re_auth();
		setInterval(re_auth, 15 * 60 * 1000);
	}
	async getXboxAvatar(playerName: string) {
		try {
			const res = await getPlayerSettings(playerName, { userHash: this.hash, XSTSToken: this.x_token }, ["GameDisplayPicRaw"]);
			return res[0].value;
		} catch (err) {
			console.log(err);
			return 404;
		}
	}
}

function main() {
	const SFBDS = new signalFromBDS();
	const Discord = new signalFromDiscord();
	const xboxLiveApi = new xboxLiveApiClass();
	SFBDS.onMessage.on("event", (ev) => {
		//ScriptAPI to Discord
		console.log(`BDS => Discord ${ev.playerName} ${ev.message}`);
		let avatar_url = Discord.mcid_avatar_map.get(ev.playerName);
		if (avatar_url !== undefined && ev.playerName !== "Notice") {
			Discord.send(ev.playerName, ev.message, avatar_url);
		} else {
			Discord.send(ev.playerName, ev.message, "https://i.pinimg.com/564x/e3/30/e0/e330e08e34e9d91093b6b7ea91562fc2.jpg");
			(async () => {
				const res = await xboxLiveApi.getXboxAvatar(ev.playerName);
				if (res === 404) return;
				Discord.mcid_avatar_map.set(ev.playerName, res);
			})();
		}
	});
	Discord.onMessage.on("event", (message: discord.Message) => {
		//Discord to ScriptAPI
		if (message.author.bot) return;
		if (message.guild?.id !== config.chat_guild_id) return;
		if (message.channel.id !== config.chat_channel_id) return;
		console.log(`Discord => BDS ${message.member!.displayName} ${message.content}`);
		SFBDS.send(message.member!.displayName, message.content);
	});
	setInterval(() => {
		const diff = new Date().getTime() - SFBDS.time;
		if (diff > 5 * 1000 && diff < 60 * 60 * 1000) {
			SFBDS.onMessage.emit("event", { playerName: "Notice", message: "Server stoped?" });
			exec(`taskkill /im cmd.exe /fi "WINDOWTITLE eq bedrock_server*"`);
			console.log(`start "${config.bds_bat_path}"`);
			exec(`start "bds-run.bat" "${config.bds_bat_path}"`);
			SFBDS.time = 0;
		}
	}, 1000);
	return { SFBDS: SFBDS, Discord: Discord, xboxLiveApi: xboxLiveApi };
}
const instances = main();
