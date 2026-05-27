import test from 'node:test';
import assert from 'node:assert';
import { resolveTopicId } from './utils.ts';

test('resolveTopicId mapping tests', async (t) => {
    await t.test('resolves exactly matching topics to their id from SYLLABUS_DB', () => {
        assert.strictEqual(resolveTopicId('Units and Measurements'), 'phy_11_unit_meas');
        assert.strictEqual(resolveTopicId('Motion in a Straight Line'), 'phy_11_motion_line');
        assert.strictEqual(resolveTopicId('Electric Charges and Fields'), 'phy_12_electrostatics');
    });

    await t.test('resolves topics case-insensitively', () => {
        assert.strictEqual(resolveTopicId('units and measurements'), 'phy_11_unit_meas');
        assert.strictEqual(resolveTopicId('UNITS AND MEASUREMENTS'), 'phy_11_unit_meas');
        assert.strictEqual(resolveTopicId('uNiTs AnD mEaSuReMeNtS'), 'phy_11_unit_meas');
    });

    await t.test('fallbacks to a slugified version of the topic name with underscores if no match is found', () => {
        assert.strictEqual(resolveTopicId('Some Random Topic'), 'some_random_topic');
        assert.strictEqual(resolveTopicId('A Very-Complex Topic!'), 'a_very_complex_topic');
        assert.strictEqual(resolveTopicId('Hello World 123'), 'hello_world_123');
    });

    await t.test('handles empty or whitespace strings', () => {
        assert.strictEqual(resolveTopicId(''), '');
        assert.strictEqual(resolveTopicId('   '), '');
    });
});
