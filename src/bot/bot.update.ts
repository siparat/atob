import { Command, Ctx, Message, On, Update } from 'nestjs-telegraf';
import { Context } from 'telegraf';
import { Message as IMessage } from 'telegraf/typings/core/types/typegram';
import { getRegExpTag } from './helpers/tags.helper';
import { BotService } from './bot.service';
import { ParserService } from 'src/parser/parser.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Update()
export class BotUpdate {
	constructor(
		private botService: BotService,
		private parserService: ParserService,
		private schedulerRegistry: SchedulerRegistry
	) {}

	@On('new_chat_members')
	getChatId(@Ctx() ctx: Context, @Message() msg: IMessage.NewChatMembersMessage): string {
		for (const user of msg.new_chat_members) {
			if (user.id !== ctx.botInfo.id) {
				continue;
			}
			return 'Ваш chat_id: ' + ctx.chat.id;
		}
	}

	@Command(getRegExpTag('price'))
	async setPriceLimit(@Ctx() ctx: Context, @Message() { text }: IMessage.TextMessage): Promise<void> {
		const { price: priceNow } = this.parserService.getConfig();
		const [, priceString] = text.split(' ');
		const price = Number(priceString);
		if (Number.isNaN(price)) {
			await ctx.reply(
				`[${priceNow}€] Specify the price that the request must match (including), in the form: /price PRICE`
			);
			return;
		}
		await this.parserService.setParserPrice(price);
		await this.botService.sendMessage(`Price updated (${price}€)`);
	}

	@Command(getRegExpTag('ping'))
	async setPingLimit(@Ctx() ctx: Context, @Message() { text }: IMessage.TextMessage): Promise<void> {
		const { ping: pingNow } = this.parserService.getConfig();
		const [, pingString] = text.split(' ');
		const ping = Number(pingString);
		if (Number.isNaN(ping) || ping % 1 !== 0 || ping < 1) {
			await ctx.reply(`[${pingNow}s] Specify the ping in seconds, like: /ping SECONDS`);
			return;
		}
		await this.parserService.setParserPing(ping);

		const job = this.schedulerRegistry.getCronJob('main');
		job.stop();
		this.schedulerRegistry.deleteCronJob('main');

		const newJob = new CronJob(`*/${ping} * * * * *`, this.parserService.start.bind(this.parserService));
		this.schedulerRegistry.addCronJob('main', newJob);
		newJob.start();

		await this.botService.sendMessage(`Ping updated (${ping}s)`);
	}
}
