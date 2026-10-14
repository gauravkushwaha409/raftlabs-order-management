const photo = (id: string) =>
	`https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=600&q=70`;

export const MENU_SEED = [
	{
		name: "Margherita Pizza",
		description:
			"San Marzano tomato, fresh mozzarella, basil and olive oil on a wood-fired crust.",
		priceCents: 1299,
		category: "Pizza",
		image: photo("1513104890138-7c749659a591"),
	},
	{
		name: "Pepperoni Pizza",
		description:
			"Crisp-edged pepperoni, mozzarella and our slow-simmered tomato sauce.",
		priceCents: 1499,
		category: "Pizza",
		image: photo("1628840042765-356cda07504e"),
	},
	{
		name: "Classic Cheeseburger",
		description:
			"Grass-fed beef patty, cheddar, pickles, lettuce and house sauce on a brioche bun.",
		priceCents: 1199,
		category: "Burgers",
		image: photo("1568901346375-23c9450c58cd"),
	},
	{
		name: "Garden Veggie Burger",
		description:
			"Smoky black bean and beetroot patty with avocado, tomato and herb mayo.",
		priceCents: 1099,
		category: "Burgers",
		image: photo("1520072959219-c595dc870360"),
	},
	{
		name: "Buffalo Wings",
		description:
			"Eight crispy wings tossed in tangy buffalo sauce with a cool ranch dip.",
		priceCents: 999,
		category: "Sides",
		image: photo("1567620832903-9fc6debc209f"),
	},
	{
		name: "Loaded Fries",
		description: "Golden fries with melted cheese, spring onion and jalapeño.",
		priceCents: 599,
		category: "Sides",
		image: photo("1573080496219-bb080dd4f877"),
	},
	{
		name: "Caesar Salad",
		description:
			"Crisp romaine, parmesan, sourdough croutons and creamy Caesar dressing.",
		priceCents: 899,
		category: "Salads",
		image: photo("1546793665-c74683f339c1"),
	},
	{
		name: "Spaghetti Carbonara",
		description:
			"Spaghetti with egg yolk, pecorino, black pepper and crispy guanciale.",
		priceCents: 1399,
		category: "Pasta",
		image: photo("1612874742237-6526221588e3"),
	},
	{
		name: "Fudge Brownie",
		description: "Warm, gooey chocolate brownie with a dusting of cocoa.",
		priceCents: 549,
		category: "Dessert",
		image: photo("1606313564200-e75d5e30476c"),
	},
	{
		name: "Fresh Lemonade",
		description: "Squeezed-to-order lemonade with mint and a touch of honey.",
		priceCents: 399,
		category: "Drinks",
		image: photo("1621263764928-df1444c5e859"),
	},
] as const;

/** Dev/staging demo accounts. Production never uses these: it only seeds credentials passed via env. */
export const DEMO_ACCOUNTS = {
	admin: { email: "admin@raftlabs.com", password: "Admin@12345", name: "Admin" },
	customer: {
		email: "customer@raftlabs.com",
		password: "Customer@12345",
		name: "Demo Customer",
	},
} as const;

/** Past orders for the demo customer (development only), so the dashboards are not empty. */
export const DEMO_ORDERS = [
	{
		status: "DELIVERED",
		hoursAgo: 26,
		customerName: "Demo Customer",
		address: "12 Analytical Way, London",
		phone: "+44 20 7946 0000",
		lines: [
			{ menuItem: "Margherita Pizza", quantity: 2 },
			{ menuItem: "Fresh Lemonade", quantity: 1 },
		],
	},
	{
		status: "CANCELLED",
		hoursAgo: 3,
		customerName: "Demo Customer",
		address: "12 Analytical Way, London",
		phone: "+44 20 7946 0000",
		lines: [{ menuItem: "Classic Cheeseburger", quantity: 1 }],
	},
] as const;
