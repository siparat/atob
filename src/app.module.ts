import { Module } from '@nestjs/common';
import { BotModule } from './bot/bot.module';
import { TelegrafModule } from 'nestjs-telegraf';
import { getBotConfig } from './configs/bot.config';
import { ConfigModule } from '@nestjs/config';
import { ParserModule } from './parser/parser.module';
import { AppController } from './app.controller';
import { ScheduleModule } from '@nestjs/schedule';

@Module({
	controllers: [AppController],
	imports: [
		ScheduleModule.forRoot(),
		ConfigModule.forRoot({ isGlobal: true }),
		ParserModule.forRoot({ headless: true, browser: 'chrome' }),
		BotModule,
		ParserModule,
		TelegrafModule.forRootAsync(getBotConfig())
	]
})
export class AppModule {}
