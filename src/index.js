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

export default {
	async fetch(request, env, ctx) {
		let url = request.url;
		let KV = env.KV;
		console.log("Handling request for: " + url);
		let page = url.split("?page=")[1];
		if (page == undefined) {
			return new Response("No page specified", { status: 400 });
		}
		let count = await KV.get(page);
		if (count == null) {
			count = 0;
		}
		count++;
		await KV.put(page, count);
		return new Response("OK", { status: 200 });
	},
};
