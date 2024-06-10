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

const b2 = {
    isbn: "test2",
    amazon_url: "http://amazon.com",
    author: "test author",
    language: "english",
    pages: 64,
    publisher: "test publisher",
    title: "test book",
    year: 2024,
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
        
        expect(response.status).toEqual(200);
        expect(response.body).toHaveProperty("books");
        expect(response.body.books.length).toEqual(1);
        expect(response.body.books[0]).toEqual(b1);
    })
})

describe("404 handling", function () {
    test("returns a 404 with bad route", async function () {
        const response = await request(app).get("/badRouteDoNotUse");
        
        expect(response.status).toEqual(404);
    })
})

describe("GET /books/:isbn", function () {
    test("gets one book", async function() {
        const response = await request(app).get(`/books/${b1.isbn}`);
        
        expect(response.status).toEqual(200);
        expect(response.body).toHaveProperty("book");
        expect(response.body.book).toEqual(b1);
    })
    test("404s on invalid isbn", async function() {
        const response = await request(app).get("/books/0");
        
        expect(response.status).toEqual(404)
        expect(response.body.message).toEqual(`There is no book with an isbn '0'`)
    })
})

describe("POST /books/", function () {
    test("adds a book", async function () {
        const response = await request(app).post("/books").send(b2);
        
        expect(response.status).toEqual(201);
        expect(response.body).toHaveProperty("book");
        expect(response.body.book).toEqual(b2);
    })
    
    test("returns errors with validation failure", async function () {
        const response = await request(app).post("/books").send({});
        
        expect(response.status).toEqual(400);
        expect(response.body.message).toEqual(expect.any(Array));
        const errStr = 'instance requires property';
        const reqdProps = ['isbn', 'amazon_url', 'author', 'language', 'pages', 'publisher',
            'title', 'year'];
        for (p of reqdProps) {
            expect(response.body.message).toContain(`${errStr} "${p}"`)
        }
    })
    
    test("errors on a single missing property", async function () {
        const errStr = 'instance requires property';
        const reqdProps = ['isbn', 'amazon_url', 'author', 'language', 'pages', 'publisher',
            'title', 'year'];
        
        for (p of reqdProps) {
            const b3 = { ...b2 };
            delete b3[p];
            
            const response = await request(app).post("/books").send(b3);
            
            expect(response.status).toEqual(400);
            expect(response.body.message[0]).toEqual(`${errStr} "${p}"`);
        }
    })
})

describe("PUT /books", function () {
    test("changes a book", async function() {
        const b3 = {...b1};
        b3.title = "teest book";
        const response = await request(app).put(`/books/${b3.isbn}`).send(b3);
        
        expect(response.status).toEqual(200);
        expect(response.body.book).toEqual(b3);
    })
    
    test("404s on bad ISBN", async function() {
        const response = await request(app).put(`/books/${b2.isbn}`).send(b2);
        
        expect(response.status).toEqual(404);
        expect(response.body.message).toEqual(`There is no book with an isbn '${b2.isbn}`)
    })
    
    test("error 400 on missing property", async function() {
        const errStr = 'instance requires property';
        const reqdProps = ['amazon_url', 'author', 'language', 'pages', 'publisher',
            'title', 'year'];
        
        for (p of reqdProps) {
            const b3 = {...b1};
            delete b3[p];
            const isbn = b3.isbn;
            delete b3.isbn;
            
            const response = await request(app).put(`/books/${isbn}`).send(b3)
            
            expect(response.status).toEqual(400);
            expect(response.body.message[0]).toEqual(`${errStr} "${p}"`)
        }
    })
})