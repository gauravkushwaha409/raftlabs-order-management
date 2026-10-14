const formatter = new Intl.NumberFormat("en-US", {
	style: "currency",
	currency: "USD",
});

export const formatPrice = (cents: number) => formatter.format(cents / 100);
