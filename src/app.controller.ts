import { Controller } from '@nestjs/common';
import { ParserService } from './parser/parser.service';
import { SchedulerRegistry } from '@nestjs/schedule';
import { CronJob } from 'cron';

@Controller()
export class AppController {
	constructor(
		private parserService: ParserService,
		private schedulerRegistry: SchedulerRegistry
	) {}

	async onModuleInit(): Promise<void> {
		const { ping } = this.parserService.getConfig();
		const job = new CronJob(`*/${ping} * * * * *`, this.parserService.start.bind(this.parserService));
		this.schedulerRegistry.addCronJob('main', job);
		job.start();
	}
}
