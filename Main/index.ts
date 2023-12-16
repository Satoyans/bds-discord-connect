import { config as dotenv_config } from "dotenv";
const result = dotenv_config();
type config_type = {
	chat_bot_token: string;
	chat_guild_id: string;
	chat_channel_id: string;
	chat_webhook_url: string;
	xbox_api_email: string;
	xbox_api_pass: string;
	bds_bat_path: string;
	backup_from_dir: string;
	backup_at_dir: string;
	backup_interval_min: string;
};
export const config = <config_type>result.parsed;
import "./chat";
import "./backup";
