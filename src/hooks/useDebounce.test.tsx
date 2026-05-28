import test from 'node:test';
import assert from 'node:assert';
import { renderHook } from '@testing-library/react';
import { useDebounce } from './useDebounce.ts';
import 'global-jsdom/register';

test('useDebounce', async (t) => {
    t.beforeEach(() => {
        t.mock.timers.enable({ apis: ['setTimeout'] });
    });

    t.afterEach(() => {
        t.mock.timers.reset();
    });

    await t.test('calls callback after delay', () => {
        let callCount = 0;
        const callback = () => { callCount++; };
        const { result } = renderHook(() => useDebounce(callback, 100));

        result.current();
        assert.strictEqual(callCount, 0);

        t.mock.timers.tick(50);
        assert.strictEqual(callCount, 0);

        t.mock.timers.tick(50);
        assert.strictEqual(callCount, 1);
    });

    await t.test('clears timeout on consecutive calls', () => {
        let callCount = 0;
        const callback = () => { callCount++; };
        const { result } = renderHook(() => useDebounce(callback, 100));

        result.current();
        t.mock.timers.tick(50);
        result.current(); // This should clear the first timeout
        t.mock.timers.tick(50);

        // At 100ms total, the first call would have fired, but it was cancelled
        assert.strictEqual(callCount, 0);

        t.mock.timers.tick(50);
        // At 150ms total, the second call fires (50ms + 100ms)
        assert.strictEqual(callCount, 1);
    });

    await t.test('passes correct arguments to callback', () => {
        let lastArgs: any[] = [];
        const callback = (...args: any[]) => { lastArgs = args; };
        const { result } = renderHook(() => useDebounce(callback, 100));

        result.current('hello', 42);
        t.mock.timers.tick(100);

        assert.deepStrictEqual(lastArgs, ['hello', 42]);
    });

    await t.test('clears timeout on unmount', () => {
        let callCount = 0;
        const callback = () => { callCount++; };
        const { result, unmount } = renderHook(() => useDebounce(callback, 100));

        result.current();
        t.mock.timers.tick(50);
        unmount();
        t.mock.timers.tick(50);

        assert.strictEqual(callCount, 0);
    });
});
