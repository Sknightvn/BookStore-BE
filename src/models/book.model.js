const mongoose = require("mongoose");

const bookSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
  },
  author: {
    type: String,
    required: true,
  },
  ISSN: {
    type: String,
    trim: true,
    unique: true,
    sparse: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Category",
    required: true,
  },
  price: {
    type: Number,
    required: true,
  },
  //   discount: {
  //   type: Number,
  //   default: 0,
  //   min: 0,
  
  // },
  //test
  stock: {
    type: Number,
    default: 0,
    min: 0,
  },
  publishYear: {
    type: Number,
  },
  pages: {
    type: Number,
  },
  coverImage: {
    type: String,
  },
  description: {
    type: String,
  },
  volume: {
    type: String, 
    default: null,
  },
  reviews: [
    {
      customer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Customer",
        required: true,
      },
      rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5,
      },
      review: {
        type: String,
        default: "",
      },
      createdAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
  averageRating: {
    type: Number,
    default: 0,
    min: 0,
    max: 5,
  },
  isDelete: {
    type: Boolean,
    default: false,
  },
});

module.exports = mongoose.model("Book", bookSchema);