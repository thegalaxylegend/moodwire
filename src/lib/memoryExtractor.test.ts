import test, { mock } from 'node:test';
import assert from 'node:assert';
import { extractAndSaveMemory } from './memoryExtractor.ts';
import { modelRouter } from './modelRouter.ts';

test('extractAndSaveMemory error paths', async (t) => {
    t.afterEach(() => {
        mock.restoreAll();
    });

    await t.test('returns empty array and handles API error', async () => {
        mock.method(modelRouter, 'route', async () => {
            throw new Error('API down');
        });

        const consoleMock = mock.method(console, 'error', () => {});

        const result = await extractAndSaveMemory('Hello');
        assert.deepStrictEqual(result, []);
        assert.strictEqual(consoleMock.mock.callCount(), 1);
        assert.ok(consoleMock.mock.calls[0].arguments[0].includes('Memory extraction failed'));
    });

    await t.test('returns empty array when AI returns invalid JSON', async () => {
        mock.method(modelRouter, 'route', async () => {
            return { choices: [{ message: { content: 'invalid json' } }] };
        });

        const consoleWarnMock = mock.method(console, 'warn', () => {});

        const result = await extractAndSaveMemory('Hello');
        assert.deepStrictEqual(result, []);
        assert.strictEqual(consoleWarnMock.mock.callCount(), 1);
        assert.ok(consoleWarnMock.mock.calls[0].arguments[0].includes('could not parse JSON'));
    });
});
