import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';

@Injectable()
export class BotService {
	private chatId: string;

	constructor(
		@InjectBot() private bot: Telegraf,
		config: ConfigService
	) {
		this.chatId = config.get('CHAT_ID');
	}

	async sendMessage(text: string): Promise<void> {
		await this.bot.telegram.sendMessage(this.chatId, text, { parse_mode: 'Markdown' });
	}
}
