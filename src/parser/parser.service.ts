import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { homedir } from 'os';
import { join } from 'path';
import { Browser, Page } from 'puppeteer';
import { ParserConfig } from './parser.interfaces';
import { readFile, writeFile } from 'fs/promises';
import { getDefaultParserConfig } from 'src/configs/parser.config';
import { readFileSync } from 'fs';
import { OrderEntity } from 'src/entities/order.entity';
import { BotService } from 'src/bot/bot.service';

@Injectable()
export class ParserService implements OnModuleDestroy, OnModuleInit {
	private filePath: string;

	constructor(
		private browser: Browser,
		private config: ConfigService,
		private botService: BotService
	) {
		this.filePath = join(homedir(), '.atob.config');
	}

	async onModuleInit(): Promise<void> {
		try {
			await readFile(this.filePath, 'utf-8');
		} catch (error) {
			const config = getDefaultParserConfig();
			await writeFile(this.filePath, JSON.stringify(config));
		}
	}

	async start(): Promise<void> {
		performance.mark('start');
		try {
			const page = await this.getPage();
			await page.goto('https://book.atobtransfer.com/login');
			if (page.url().includes('/login')) {
				await this.login(page);
			}
			const links = await this.parseTable(page);
			if (!links.length) {
				return await page.close();
			}
			for (const link of links) {
				const newPage = await this.getPage();
				await newPage.goto(link);
				const order = await this.getOrderInfo(newPage);
				const result = await this.validateOffer(page, order);
				if (!result) {
					await this.botService.sendMessage(order.getCard('Not compliant order'));
					continue;
				}
				await this.acceptOffer(newPage);
				await this.botService.sendMessage(order.getCard('New order accepted!'));
			}
		} catch (error) {
			Logger.error(error);
			await this.botService.sendMessage(`Failed to accept order`);
		} finally {
			Logger.log(
				`Время выполнения скрипта: ${(performance.measure('measurePage', 'start').duration / 1000).toFixed(2)}с`
			);
		}
	}

	getConfig(): ParserConfig {
		return JSON.parse(readFileSync(this.filePath, 'utf-8'));
	}

	async setParserPrice(price: number): Promise<ParserConfig> {
		const config = this.getConfig();
		config.price = price;
		await writeFile(this.filePath, JSON.stringify(config));
		return config;
	}

	async setParserPing(ping: number): Promise<ParserConfig> {
		const config = this.getConfig();
		config.ping = ping;
		await writeFile(this.filePath, JSON.stringify(config));
		return config;
	}

	async getPage(): Promise<Page> {
		const page = await this.browser.newPage();
		await page.setViewport({
			width: 1920,
			height: 1080
		});
		await page.emulateMediaType('screen');
		await page.setUserAgent(
			'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/58.0.3029.110 Safari/537.36'
		);
		return page;
	}

	async onModuleDestroy(): Promise<void> {
		await this.browser.close();
	}

	async login(page: Page): Promise<void> {
		const email = this.config.get('EMAIL');
		const password = this.config.get('PASSWORD');
		await page.type('#email', email);
		await page.type('#password', password);
		await page.click('#remember');
		await page.click('form .buttons .button');
		await page.waitForNavigation({ waitUntil: 'networkidle0' });
	}

	async parseTable(page: Page): Promise<string[]> {
		const links = [];
		const rows = await page.$$('#table tbody tr');
		for (const row of rows) {
			const linkElement = await row.$('td:last-child a');
			if (!linkElement) {
				continue;
			}
			links.push(await linkElement.evaluate((el) => el.href));
		}
		return links;
	}

	async acceptOffer(page: Page): Promise<void> {
		const driverSelect = await page.$('select[name="driver"]');
		const vehicleSelect = await page.$('select[name="vehicle"]');
		if (!driverSelect || !vehicleSelect) {
			throw new Error('Выпадающие списки не найдены');
		}
		await page.select('select[name="driver"]', '134f1ea2-8dd9-4137-a5cc-991793965bd9');
		await page.select('select[name="vehicle"]', '2dcd75c7-10ac-4691-a79d-d96b687cf263');

		await page.click('.button.blue');
	}

	async validateOffer(page: Page, order: OrderEntity): Promise<boolean> {
		const config = this.getConfig();
		if (order.price < config.price) {
			return false;
		}
		return true;
	}

	async getOrderInfo(page: Page): Promise<OrderEntity> {
		const from = await page.evaluate(
			() => document.querySelector('.column.general_info div.item:nth-of-type(1) > p > br').nextSibling.textContent
		);
		const to = await page.evaluate(
			() => document.querySelector('.column.general_info div.item:nth-of-type(2) > p > br').nextSibling.textContent
		);
		const date = await page.evaluate(() => document.querySelector('h2').textContent);
		const price = await page.evaluate(() =>
			document
				.querySelector('div.column.summary_info > ul > li:nth-child(1) > div.value')
				.textContent.replace(/[^\d.]/g, '')
				.trim()
		);
		const vehicle = await page.evaluate(
			() =>
				document.querySelector(
					'div.column.summary_info > div > div:nth-child(2) > select > option[value="2dcd75c7-10ac-4691-a79d-d96b687cf263"]'
				).textContent
		);
		return new OrderEntity(from, to, new Date(date), Number(price), vehicle);
	}
}
