class ValidatorFactory {
  constructor(private game: Game) {}

  createValidator<T extends object>(target: T, className: string): T {
    const game = this.game;

    return new Proxy(target, {
      get(obj, prop) {
        if (prop in obj) {
          return obj[prop];
        }

        if (typeof prop === 'symbol' || prop.startsWith('_')) { // Исключаем служебные свойства
          return undefined;
        }

        const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(obj))
          .filter(m => m !== 'constructor');

        const closest = ValidatorFactory.findClosestMethods(prop.toString(), methods);

        if (closest.length) {
          const closestString = closest.join(', ');
          game.throwError(ErrorMessages.MISTAKE_METHOD_WITH_CLOSEST, {className, prop, closestString});

        } else {
          game.throwError(ErrorMessages.MISTAKE_METHOD, {className, prop});
        }
      }
    });
  }

  static findClosestMethods(input: string, methods: string[], maxDistance = 2): string[] {
    return methods
      .map(method => ({
        name: method,
        distance: ValidatorFactory.levenshteinDistance(input.toLowerCase(), method.toLowerCase())
      }))
      .filter(({ distance }) => distance <= maxDistance)
      .sort((a, b) => a.distance - b.distance)
      .map(({ name }) => name)
      .slice(0, 3);
  }

  static levenshteinDistance(a: string, b: string): number {
    const matrix = Array(a.length + 1)
      .fill(null)
      .map(() => Array(b.length + 1).fill(0));

    for (let i = 0; i <= a.length; i++) matrix[i][0] = i;
    for (let j = 0; j <= b.length; j++) matrix[0][j] = j;

    for (let i = 1; i <= a.length; i++) {
      for (let j = 1; j <= b.length; j++) {
        const cost = a[i-1] === b[j-1] ? 0 : 1;
        matrix[i][j] = Math.min(
          matrix[i-1][j] + 1,
          matrix[i][j-1] + 1,
          matrix[i-1][j-1] + cost
        );
      }
    }

    return matrix[a.length][b.length];
  }
}
