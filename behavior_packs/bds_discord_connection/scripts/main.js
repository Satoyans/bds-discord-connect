import { world, system } from "@minecraft/server";
import * as mcnet from "@minecraft/server-net";
import lang from "./lang";

//chat event
world.beforeEvents.chatSend.subscribe((e) => {
	system.run(async () => {
		sendChat(e.sender.nameTag, e.message);
	});
});

//playerJoin
world.afterEvents.playerJoin.subscribe((ev) => {
	const text = transrate(lang.join_message, ev.playerName);
	sendChat(text);
	console.log(text);
});

//playerLeave
world.afterEvents.playerLeave.subscribe((ev) => {
	const text = transrate(lang.leave_message, ev.playerName);
	sendChat(text);
	console.log(text);
});

//entityDie
world.afterEvents.entityDie.subscribe((ev) => {
	if (ev.deadEntity.typeId !== "minecraft:player") return;
	const p = ev.deadEntity.location;
	const dead_pos = { x: Math.floor(p.x), y: Math.floor(p.y), z: Math.floor(p.z) };
	const text = transrate(lang.death_message, ev.deadEntity.nameTag, dead_pos.x, dead_pos.y, dead_pos.z);
	sendChat(ev.deadEntity.nameTag, text);
	world.sendMessage(text);
});

function sendChat(playerName, message) {
	const req = new mcnet.HttpRequest("http://localhost:3000/");
	req.body = JSON.stringify({ playerName: `${playerName}`, message: `${message}` });
	req.headers = [new mcnet.HttpHeader("Content-Type", "application/json; charset=utf-8")];
	req.method = mcnet.HttpRequestMethod.Post;
	return mcnet.http.request(req);
}

function transrate(text, ...args) {
	const split_text = text.split(/%.%/);
	let result_text = "";
	for (m in split_text) {
		const n = Number(m);
		result_text += split_text[n];
		if (args[n] === undefined) continue;
		result_text += args[n];
	}
	return result_text;
}

//get chat (20tick)
system.runInterval(async () => {
	let res = await mcnet.http.get("http://localhost:3000/chat");
	const messages = JSON.parse(decodeURI(res.body));
	if (Object.keys(messages).length === 0) return;
	const keys = Object.keys(messages).sort((a, b) => a - b);
	for (let key of keys) {
		const msg_obj = messages[key];
		const playerName = msg_obj["playerName"];
		const message = msg_obj["message"];
		if (playerName === "%system%") {
			//今後増やすかもしれないからcase
			switch (message) {
			}
			continue;
		}
		world.sendMessage(`${playerName} > ${message}`);
	}
}, 20);

//server start
(async () => {
	sendChat(`Notice`, `Server Start`);
})();
