import express, { Response, Request, NextFunction } from 'express';
import redis from 'redis';
import Axios from 'axios';

const app = express();
const cache = redis.createClient();

cache.on('connect', () => {
	console.log('REDIS READY!!');
});

cache.on('error', e => {
	console.log('REDIS ERROR', e);
});

const redisMiddleware = async (
	req: Request,
	res: Response,
	next: NextFunction
) => {
	const { username } = req.params;

	await cache.get(username, (err, result) => {
		if (err) throw new Error(err.message);

		if (result) {
			return res.status(200).send(`The user ${username} have ${result} repos`);
			// return res.status(200).json(result);
		} else {
			next();
		}
	});
};

app.get('/', (_, res: Response) => res.send('Hello From GITHUB-REPOS-CACHE'));

app.get(
	'/repos/:username',
	redisMiddleware,
	async (req: Request, res: Response) => {
		const { username } = req.params;

		const result = await Axios.get(`https://api.github.com/users/${username}`);

		cache.set(username, result.data.public_repos);

		return res
			.status(200)
			.send(`The user ${username} have ${result.data.public_repos} repos`);
	}
);

const PORT = process.env.PORT || 9000;
app.listen(PORT, () => console.log(`Server Running on PORT: ${PORT}`));
