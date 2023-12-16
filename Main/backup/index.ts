import { execSync, exec } from "child_process";
import { config } from "..";
const backup_interval_min = Number(config.backup_interval_min);
const backup_max = Math.ceil((60 * 24 * 7) / backup_interval_min); //1week
function backup() {
	const date = new Date();
	const yyyy = date.getFullYear();
	const mm = date.getMonth() + 1;
	const dd = date.getDate();
	const hh = date.getHours();
	const mn = date.getMinutes();
	const ss = date.getSeconds();
	const timestamp = `${yyyy}${mm}${dd}${hh}${mn}${ss}`;

	const from_dir = config.backup_from_dir;
	const at_dir = config.backup_at_dir;

	console.log(`Backup Start: at ${at_dir}\\BACKUP${timestamp}`);
	exec(`start /min call "${__dirname}\\backup.bat" "${from_dir}" "${at_dir}" "${timestamp}" "${backup_max}"`);
}

backup();
setInterval(() => {
	backup();
}, backup_interval_min * 60 * 1000);
