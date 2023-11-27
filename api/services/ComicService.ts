declare const ComicCategory: any;

export const getSortObject = (type: string) => {
  switch (type) {
    case "hot":
      return { numOfView: -1, numOfLike: -1 };
    case "new":
      return { createdAt: -1 };
    case "old":
      return { createdAt: 1 };
    default:
      return { numOfView: -1, numOfLike: -1 };
  }
};
