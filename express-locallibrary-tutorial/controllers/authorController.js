const Author = require("../models/author");
const Book = require("../models/book")

const { body, validationResult } = require('express-validator');
const asyncHandler = require("express-async-handler");

// Display list of all Authors.
exports.author_list = asyncHandler(async (req, res, next) => {
  const allAuthors = await Author.find().sort({
    family_name: 1}).exec();
  res.render("author_list", {
    title: "Author List",
    author_list: allAuthors,
  });
});

// Display detail page for a specific Author.
exports.author_detail = asyncHandler(async (req, res, next) => {
  // Get details of author and books by author
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec()
  ]);

  if (author === null) {
    //no results
    const err = new Error("Author not found");
    err.status = 404;
    return next(err);
  }

  res.render("author_detail", {
    title: "Author Detail",
    author: author,
    author_books: allBooksByAuthor
  });
});

// Display Author create form on GET.
exports.author_create_get = asyncHandler(async (req, res, next) => {
  res.render("author_form", { title: "Create Author" });
});

// Handle Author create on POST.
exports.author_create_post = [
  // validate and sanitise fields
  body("first_name")
    .trim()
    .isLength({ min:1})
    .escape()
    .withMessage("First name must be specified.")
    .isAlphanumeric()
    .withMessage("Family name has non-alphanumeric characters.:"),
    // optional allows for passing of null or empty values
  body("date_of_birth", "Invalid date of birth")
    .optional({ values: "falsy" })
    .isISO8601()
    .toDate(),
  body("date_of_death", "Invalid date of death")
    .optional({ values:"falsy"})
    .isISO8601()
    .toDate(),

  asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);

    const author = new Author({
      first_name: req.body.first_name,
      family_name: req.body.family_name,
      date_of_birth: req.body.date_of_birth,
      date_of_death: req.body.date_of_death,
    });

    if(!errors.isEmpty()) {
      // Render form with errors
      res.render("author_form", {
        title: "Create Author",
        author: author,
        errors: errors.array(),
      });
    } else {
      // Save to database and go to author page
      await author.save();
      res.redirect(author.url);
    }
    
  })
];

// Display Author delete form on GET.
exports.author_delete_get = asyncHandler(async (req, res, next) => {
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (author === null) {
    // no results
    res.redirect("catalog/authors");
  }

  res.render("author_delete", {
    title: "Delete Author",
    author: author,
    author_books: allBooksByAuthor,
  });
});

// Handle Author delete on POST.
exports.author_delete_post = asyncHandler(async (req, res, next) => {
  // get details of author and all their books (in parallel)
  const [author, allBooksByAuthor] = await Promise.all([
    Author.findById(req.params.id).exec(),
    Book.find({ author: req.params.id }, "title summary").exec(),
  ]);

  if (allBooksByAuthor.length > 0) {
    // Author has books, render same as GET route
    res.render("author_delete", {
      title: "Delete Author",
      author: author,
      author_books: allBooksByAuthor,
    });
    return;
  } else {
    // Author has no books, delete object and redirect to author list
    await Author.findByIdAndDelete(req.body.authorid);
    res.redirect("/catalog/authors");
  }
});

// Display Author update form on GET.
exports.author_update_get = asyncHandler(async (req, res, next) => {
  const author = await Author.findById(req.params.id).exec();
  
  if (author === null) {
    redirect('/catalog/authors')
  }

  res.render("author_form", {
    title: "Update Author",
    author: author,
  });


});

// Handle Author update on POST.
exports.author_update_post = [
  // validate body data
  body("first_name")
  .trim()
  .isLength({ min:1})
  .escape()
  .withMessage("First name must be specified.")
  .isAlphanumeric()
  .withMessage("Family name has non-alphanumeric characters.:"),
  // optional allows for passing of null or empty values
body("date_of_birth", "Invalid date of birth")
  .optional({ values: "falsy" })
  .isISO8601()
  .toDate(),
body("date_of_death", "Invalid date of death")
  .optional({ values:"falsy"})
  .isISO8601()
  .toDate(),

asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);

  const author = new Author({
    first_name: req.body.first_name,
    family_name: req.body.family_name,
    date_of_birth: req.body.date_of_birth,
    date_of_death: req.body.date_of_death,
    _id: req.params.id,
  });

  if(!errors.isEmpty()) {
    // Render form with errors
    res.render("author_form", {
      title: "Update Author",
      author: author,
      errors: errors.array(),
    });
  } else {
    // Save to database and go to author page
    const updatedAuthor = await Author.findByIdAndUpdate(req.params.id, author, {});
    res.redirect(author.url);
  }
})
]
