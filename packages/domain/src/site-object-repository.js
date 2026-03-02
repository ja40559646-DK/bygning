export function createInMemorySiteObjectRepository() {
  const items = [];

  return {
    save(siteObject) {
      items.push(siteObject);
      return siteObject;
    },

    list() {
      return [...items];
    }
  };
}
