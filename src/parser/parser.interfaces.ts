import { InjectionToken, ModuleMetadata } from '@nestjs/common';
import { LaunchOptions } from 'puppeteer';

export interface ParserModuleAsyncOptions extends Pick<ModuleMetadata, 'imports'> {
	inject?: InjectionToken[];
	useFactory: (...args: any[]) => Promise<LaunchOptions> | LaunchOptions;
}

export interface ParserConfig {
	price: number;
	ping: number;
}
