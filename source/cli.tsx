#!/usr/bin/env node
import "dotenv/config";
import Pastel from 'pastel';

const app = new Pastel({
	importMeta: import.meta,
});

await app.run();
