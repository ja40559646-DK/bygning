export function sum(a, b) {
  return a + b;
}

export function areaRectangle(length, width) {
  if (length <= 0 || width <= 0) {
    throw new Error('Length and width must be positive numbers.');
  }

  return length * width;
}
