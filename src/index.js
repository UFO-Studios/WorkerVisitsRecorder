/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 */

//FORMAT:
//stats.thealiendoctor.com?page=/ufo-studios.html

async function scheduled(env, sendMsg) {
	console.log('Cron func is running...');
	const KV = env.KV;
	const webhookURL = env.url;
	var pages = [];

	const list = await KV.list();
	console.log('Key list aquired');
	var total = 0;
	for (const { name, expiration } of list.keys) {
		console.log('Getting value for ' + name);
		const value = await KV.get(name);
		if ((name == 'total') | (name == undefined) | (name == 'undefined')) {
			console.log('Invalid Entry, skipping');
		} else {
			pages.push({ name: name, count: parseInt(value) });
			total += parseInt(value);
		}
	}
	pages.sort((a, b) => b.count - a.count); // Sort repos by count in descending order
	let currentDate = new Date();

	var message =
		'# Page Views as of ' +
		currentDate.toUTCString() +
		'\n\n' +
		pages.map((pages) => `Page: ${pages.name}, Count: ${pages.count}\n`).join('');
	var message = message + '\n\nTotal views: ' + total;
	console.log('Message generated. Sending to Discord...');
	console.log(message);

	if (sendMsg) {
		await fetch(webhookURL, {
			method: 'POST',
			headers: {
				'Content-Type': 'application/json',
			},
			body: JSON.stringify({
				content: message,
			}),
		})
			.then((response) => console.log(response))
			.catch((error) => console.error(error));
		console.log('Message sent to Discord');
		return 'Complete! Message sent.';
	} else {
		console.log('Returning mesage');
		return message;
	}
}

export default {
	async fetch(request, env, ctx) {
		let url = request.url;
		let KV = env.KV;
		console.log('Handling request for: ' + url);
		if (url == 'https://stats.thealiendoctor.com') {
			return new Response('No page specified', { status: 400 });
		}
		if (url == 'https://stats.thealiendoctor.com/cron' || url == "127.0.0.1:8787/cron") {
			return new Response(await scheduled(env, false), { status: 200 });
		}
		let page = url.split('?page=')[1];
		if (page == undefined) {
			return new Response('No page specified', { status: 400 });
		}
		let count = await KV.get(page);
		if (count == null) {
			count = 0;
		}
		count++;
		await KV.put(page, count);
		return new Response('OK', { status: 200 });
	},
	async cron(env, ctx) {
		scheduled(env, True);
	},
};
