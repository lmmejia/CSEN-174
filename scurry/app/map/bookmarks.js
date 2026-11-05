// helpers for adding/removing place bookmarks
export class BookmarkManager {
  isBookmarked(bookmarks, placeName) {
    return (bookmarks || []).includes(placeName);
  }

  addBookmark(bookmarks, placeName) {
    if (!placeName) {
      throw new Error("Place name is required");
    }

    const current = bookmarks || [];
    if (current.includes(placeName)) {
      throw new Error("Place is already bookmarked");
    }

    return [...current, placeName];
  }

  removeBookmark(bookmarks, placeName) {
    if (!placeName) {
      throw new Error("Place name is required");
    }

    return (bookmarks || []).filter((name) => name !== placeName);
  }
}
