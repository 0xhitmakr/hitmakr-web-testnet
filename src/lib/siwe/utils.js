/**
 * Executes a callback function with the provided value and then returns the value.
 *
 * @param {any} value - The value to be passed to the callback function.
 * @param {Function} cb - The callback function to be executed with the value.
 * @returns {Promise<any>} - A promise that resolves to the original value.
 */
export const tap = async (value, cb) => {
    await cb(value);
    return value;
};
