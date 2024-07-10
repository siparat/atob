import { ConfigModule, ConfigService } from '@nestjs/config';
import { TelegrafModuleAsyncOptions, TelegrafModuleOptions } from 'nestjs-telegraf';

export const getBotConfig = (): TelegrafModuleAsyncOptions => {
	return {
		imports: [ConfigModule],
		inject: [ConfigService],
		useFactory: (config: ConfigService): TelegrafModuleOptions => ({
			token: config.get('TOKEN')
		})
	};
};
