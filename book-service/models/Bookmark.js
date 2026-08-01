const mongoose = require('mongoose');

const bookmarkSchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'User',
    },
    bookId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: 'Book',
    },
  },
  {
    timestamps: true,
  }
);

// One bookmark per user per book
bookmarkSchema.index({ user: 1, bookId: 1 }, { unique: true });
bookmarkSchema.index({ user: 1, createdAt: -1 });

const Bookmark = mongoose.model('Bookmark', bookmarkSchema, 'book_bookmarks');

module.exports = Bookmark;
