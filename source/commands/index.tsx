import React from 'react';
import {Text} from 'ink';
import zod from 'zod';

export const options = zod.object({
	name: zod.string().default('Stranger').describe('Name'),
});


export default function Index() {
	return <Text>hello</Text>;
}
