import { DynamicModule, Provider } from '@nestjs/common';
import puppeteer, { Browser, LaunchOptions } from 'puppeteer';
import { ParserService } from './parser.service';
import { ParserModuleAsyncOptions } from './parser.interfaces';
import { BotModule } from 'src/bot/bot.module';

export class ParserModule {
	static async forRoot(options?: LaunchOptions): Promise<DynamicModule> {
		const browser = await puppeteer.launch(options);
		const provider: Provider = {
			provide: Browser,
			useValue: browser
		};

		return {
			global: true,
			module: ParserModule,
			imports: [BotModule],
			providers: [ParserService, provider],
			exports: [ParserService]
		};
	}

	static async forRootAsync(options: ParserModuleAsyncOptions): Promise<DynamicModule> {
		const provider: Provider = ParserModule.getBrowserProvide(options);
		return {
			global: true,
			module: ParserModule,
			imports: options.imports,
			providers: [ParserService, provider],
			exports: [ParserService]
		};
	}

	private static getBrowserProvide(options: ParserModuleAsyncOptions): Provider {
		return {
			provide: Browser,
			inject: options.inject || [],
			useFactory: async (...args: any[]): Promise<Browser> => {
				const config = await options.useFactory(...args);
				return puppeteer.launch(config);
			}
		};
	}
}
