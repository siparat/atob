import dedent from 'dedent';

export class OrderEntity {
	constructor(
		public from: string,
		public to: string,
		public date: Date,
		public price: number,
		public vehicle: string
	) {}

	getCard(title: string): string {
		const formattedDate = `${String(this.date.getDate()).padStart(2, '0')}.${String(this.date.getMonth() + 1).padStart(2, '0')}.${this.date.getFullYear()}. ${String(this.date.getHours()).padStart(2, '0')}:${String(this.date.getMinutes()).padStart(2, '0')} h`;
		return dedent`
			*${title}*
			From: ${this.from}
			To: ${this.to}
			Date: ${formattedDate}
			Vehicle: ${this.vehicle}
			Price: ${this.price}€
		`;
	}
}
