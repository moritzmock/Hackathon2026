// One clock for everything that moves on the map. Shaders share the same object as
// a uniform, so trees, water and buildings all read the time the Ticker sets.
export const motionTime = { value: 0 };
