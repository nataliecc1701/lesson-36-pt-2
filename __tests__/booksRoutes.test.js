const request = require("supertest");

const app = require("../app");
const db = require("../db");
const Book = require("../models/book");

const b1 = {
    isbn: "test1",
    amazon_url: "http://amazon.com",
    author: "test author",
    language: "english",
    pages: 32,
    publisher: "test publisher",
    title: "test book",
    year: 1972,
}

beforeEach(async function () {
    await db.query("DELETE FROM books");

    let bk1 = await Book.create(b1);
});

afterAll(async function () {
    await db.end()
})

describe("GET /books/", function () {
    test("gets all books", async function() {
        const response = await request(app).get("/books");
        
        expect(response.body).toHaveProperty("books");
        expect(response.body.books.length).toEqual(1);
        expect(response.body.books[0]).toEqual(b1);
    })
})

describe("GET /books/:isbn", function () {
    test("gets one book", async function() {
        const response = await request(app).get(`/books/${b1.isbn}`);
        
        expect(response.body).toHaveProperty("book");
        expect(response.body.book).toEqual(b1);
    })
})