const Genre = require("../models/genre");
const Book = require("../models/book");

const { body, validationResult } = require("express-validator")
const asyncHandler = require("express-async-handler");
const genre = require("../models/genre");


// Display list of all Genre.
exports.genre_list = asyncHandler(async (req, res, next) => {
  const allGenres = await Genre.find().sort({name: 1}).exec();
  res.render('genre_list', {
    title: "Genre List",
    genre_list: allGenres
  });
});

// Display detail page for a specific Genre.
exports.genre_detail = asyncHandler(async (req, res, next) => {
  const [genre, booksInGenre] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "title summary").exec()
  ]);
  if (genre === null) {
    //no results.
    const err = new Error("Genre not found");
    err.status = 404;
    return next(err);
  }
  res.render("genre_detail", {
    title: "Genre Detail",
    genre: genre,
    genre_books: booksInGenre,
  });
});

// Display Genre create form on GET.
exports.genre_create_get = asyncHandler(async (req, res, next) => {
  res.render("genre_form", { title: 'Create Genre' });
});

// Handle Genre create on POST.
exports.genre_create_post = [
  // validate and sanitise the name field
  body("name", "genre name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3})
    .escape(),
  
  // process request after validation an sanitization
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({ name: req.body.name });

  if (!errors.isEmpty()) {
    // There must be errors
    res.render("genre_form", {
      title: "Create Genre",
      genre: genre,
      errors: errors.array(),
    });
    return;
  } else {
    const genreExists = await Genre.findOne({ name: req.body.name })
    .collation({ locale: "en", strength: 2})
    .exec();
    if (genreExists) {
      res.redirect(genreExists.url);
    } else {
      await genre.save();
      res.redirect(genre.url)
    }
  }
  })
];

// Display Genre delete form on GET.
exports.genre_delete_get = asyncHandler(async (req, res, next) => {
  const [ genre, allBooksInGenre ] = await Promise.all([
    Genre.findById(req.params.id).exec(),
    Book.find({ genre: req.params.id }, "genre summary").populate('title').exec(),
  ]);
  
  if (genre === null) {
    res.redirect("catalog/genres");
  }

  res.render('genre_delete', {
    title: 'Delete Genre',
    genre: genre,
    genre_books: allBooksInGenre
  });
});

// Handle Genre delete on POST.
exports.genre_delete_post = asyncHandler(async (req, res, next) => {
  await Genre.findByIdAndDelete(req.params.id);
  res.redirect('/catalog/genres')

});

// Display Genre update form on GET.
exports.genre_update_get = asyncHandler(async (req, res, next) => {
  const genre = await Genre.findById(req.params.id).exec();

  if (genre === null) {
    res.redirect('/catalog/genres')
  }

  res.render('genre_form', {
    title: "Update Genre",
    genre: genre,
  });
});

// Handle Genre update on POST.
exports.genre_update_post = [
  // validate field
  body("name", "Genre must be more than three characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),
  
  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const genre = new Genre({
      name: req.body.name,
      _id: req.params.id
    });
  
    if (!errors.isEmpty()) {
      // if there are errors, render form again
      res.render("genre_form", {
        title: 'Update Genre',
        genre: genre,
        errors: errors.array(),
      });
      return;
    }
    else {
      // data from form is valid
      const updatedGenre = await Genre.findByIdAndUpdate(req.params.id, genre, {});
      res.redirect(updatedGenre.url)
    }
  }),
];