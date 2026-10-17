import { useEffect, useState } from "react";
import "./App.css";

const API = "/api";

async function request(path, options = {}) {
  const response = await fetch(`${API}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...options.headers,
    },
  });

  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    throw new Error(data.message || "Prišlo je do napake.");
  }

  return data;
}

function App() {
  const [tab, setTab] = useState("books");

  const [books, setBooks] = useState([]);
  const [authors, setAuthors] = useState([]);
  const [bookAuthors, setBookAuthors] = useState([]);

  const [authorPage, setAuthorPage] = useState(1);
  const [authorSearch, setAuthorSearch] = useState("");
  const [authorTotalPages, setAuthorTotalPages] = useState(1);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [bookForm, setBookForm] = useState({
    title: "",
    author: "",
  });
  const [bookAuthorSearch, setBookAuthorSearch] = useState("");
  const [showAuthorOptions, setShowAuthorOptions] = useState(false);
  const [editingBook, setEditingBook] = useState(null);

  const [authorForm, setAuthorForm] = useState({
    firstName: "",
    lastName: "",
  });
  const [editingAuthor, setEditingAuthor] = useState(null);

  const [showBookForm, setShowBookForm] = useState(false);
  const [showAuthorForm, setShowAuthorForm] = useState(false);

  async function loadAuthors() {
    const params = new URLSearchParams({
      page: String(authorPage),
      limit: "20",
    });

    if (authorSearch.trim()) {
      params.set("search", authorSearch.trim());
    }

    const result = await request(`/authors?${params}`);

    setAuthors(result.data);
    setAuthorTotalPages(
      Math.max(1, result.pagination.totalPages)
    );
  }

  async function loadBookAuthors() {
    const result = await request("/authors");

    const allAuthors = Array.isArray(result)
      ? result
      : result.data || [];

    setBookAuthors(allAuthors);
  }

  async function loadBooks() {
    setLoading(true);
    setError("");

    try {
      const params = new URLSearchParams({
        page: String(page),
        limit: "20",
      });

      if (search.trim()) {
        params.set("search", search.trim());
      }

      const data = await request(`/books?${params}`);

      setBooks(data.data);
      setTotalPages(
        Math.max(1, data.pagination.totalPages)
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadAuthors().catch((err) => setError(err.message));
  }, [authorPage, authorSearch]);

  useEffect(() => {
    loadBookAuthors().catch((err) => setError(err.message));
  }, []);

  useEffect(() => {
    loadBooks();
  }, [page, search]);

  function clearMessages() {
    setMessage("");
    setError("");
  }

  const filteredBookAuthors = bookAuthors.filter((author) =>
    `${author.firstName} ${author.lastName}`
      .toLowerCase()
      .includes(bookAuthorSearch.trim().toLowerCase())
  );

  const selectedBookAuthor = bookAuthors.find(
    (author) => author._id === bookForm.author
  );

  function startNewBook() {
    clearMessages();
    setShowBookForm(true);
    setEditingBook(null);
    setBookForm({
      title: "",
      author: "",
    });
    setBookAuthorSearch("");
    setShowAuthorOptions(false);
  }

  function startEditBook(book) {
    clearMessages();
    setShowBookForm(true);
    setEditingBook(book._id);
    setBookForm({
      title: book.title,
      author: book.author?._id || "",
    });
    setBookAuthorSearch("");
    setShowAuthorOptions(false);
  }

  async function saveBook(event) {
    event.preventDefault();
    clearMessages();

    try {
      const editing = Boolean(editingBook);

      await request(
        editing ? `/books/${editingBook}` : "/books",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(bookForm),
        }
      );

      setMessage(
        editing
          ? "Knjiga je posodobljena."
          : "Knjiga je dodana."
      );

      setShowBookForm(false);
      setEditingBook(null);
      setBookForm({ title: "", author: "" });
      setBookAuthorSearch("");
      setShowAuthorOptions(false);

      await loadBooks();
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteBook(book) {
    if (
      !window.confirm(
        `Res želiš izbrisati knjigo »${book.title}«?`
      )
    ) {
      return;
    }

    clearMessages();

    try {
      await request(`/books/${book._id}`, {
        method: "DELETE",
      });

      setMessage("Knjiga je izbrisana.");
      await loadBooks();
    } catch (err) {
      setError(err.message);
    }
  }

  function startNewAuthor() {
    clearMessages();
    setShowAuthorForm(true);
    setEditingAuthor(null);
    setAuthorForm({
      firstName: "",
      lastName: "",
    });
  }

  function startEditAuthor(author) {
    clearMessages();
    setShowAuthorForm(true);
    setEditingAuthor(author._id);
    setAuthorForm({
      firstName: author.firstName,
      lastName: author.lastName,
    });
  }

  async function saveAuthor(event) {
    event.preventDefault();
    clearMessages();

    try {
      const editing = Boolean(editingAuthor);

      await request(
        editing ? `/authors/${editingAuthor}` : "/authors",
        {
          method: editing ? "PUT" : "POST",
          body: JSON.stringify(authorForm),
        }
      );

      setAuthorPage(1);
      await loadBookAuthors();
      await loadBooks();

      setShowAuthorForm(false);
      setEditingAuthor(null);
      setAuthorForm({
        firstName: "",
        lastName: "",
      });

      setMessage(
        editing
          ? "Avtor je posodobljen."
          : "Avtor je dodan."
      );
    } catch (err) {
      setError(err.message);
    }
  }

  async function deleteAuthor(author) {
    if (
      !window.confirm(
        `Res želiš izbrisati avtorja ${author.firstName} ${author.lastName}?`
      )
    ) {
      return;
    }

    clearMessages();

    try {
      await request(`/authors/${author._id}`, {
        method: "DELETE",
      });

      await loadAuthors();
      await loadBookAuthors();

      setMessage("Avtor je izbrisan.");
    } catch (err) {
      setError(err.message);
    }
  }

  return (
    <main className="app">
      <nav className="tabs">
        <button
          className={tab === "books" ? "tab active" : "tab"}
          onClick={() => {
            setTab("books");
            clearMessages();
          }}
        >
          Knjige
        </button>

        <button
          className={tab === "authors" ? "tab active" : "tab"}
          onClick={() => {
            setTab("authors");
            clearMessages();
          }}
        >
          Avtorji
        </button>
      </nav>

      {message && (
        <div className="notice success">{message}</div>
      )}

      {error && (
        <div className="notice error">{error}</div>
      )}

      {tab === "books" && (
        <>
          <section className="toolbar">
            <div>
              <h2>Knjige</h2>
            </div>

            <button className="primary" onClick={startNewBook}>
              + Dodaj knjigo
            </button>
          </section>

          <input
            className="search"
            type="search"
            placeholder="Išči po naslovu knjige ..."
            value={search}
            onChange={(event) => {
              setSearch(event.target.value);
              setPage(1);
            }}
          />

          {showBookForm && (
            <form className="editor" onSubmit={saveBook}>
              <h3>
                {editingBook ? "Uredi knjigo" : "Nova knjiga"}
              </h3>

              <label>
                Naslov
                <input
                  required
                  value={bookForm.title}
                  onChange={(event) =>
                    setBookForm({
                      ...bookForm,
                      title: event.target.value,
                    })
                  }
                  placeholder="Naslov knjige"
                />
              </label>

              <label>
                Avtor
                <input
                  type="text"
                  placeholder="Išči avtorja po imenu ali priimku ..."
                  value={
                    showAuthorOptions
                      ? bookAuthorSearch
                      : selectedBookAuthor
                        ? `${selectedBookAuthor.firstName} ${selectedBookAuthor.lastName}`
                        : bookAuthorSearch
                  }
                  onFocus={() => {
                    setBookAuthorSearch("");
                    setShowAuthorOptions(true);
                  }}
                  onChange={(event) => {
                    setBookAuthorSearch(event.target.value);
                    setShowAuthorOptions(true);
                    setBookForm({
                      ...bookForm,
                      author: "",
                    });
                  }}
                  required={!bookForm.author}
                />

                {showAuthorOptions && (
                  <div className="author-options">
                    {filteredBookAuthors.length > 0 ? (
                      filteredBookAuthors
                        .slice(0, 20)
                        .map((author) => (
                          <button
                            key={author._id}
                            type="button"
                            className="author-option"
                            onClick={() => {
                              setBookForm({
                                ...bookForm,
                                author: author._id,
                              });

                              setBookAuthorSearch(
                                `${author.firstName} ${author.lastName}`
                              );

                              setShowAuthorOptions(false);
                            }}
                          >
                            {author.firstName} {author.lastName}
                          </button>
                        ))
                    ) : (
                      <p className="empty">
                        Ni najdenih avtorjev.
                      </p>
                    )}
                  </div>
                )}
              </label>

              <div className="form-actions">
                <button className="primary" type="submit">
                  Shrani
                </button>

                <button
                  className="secondary"
                  type="button"
                  onClick={() => {
                    setShowBookForm(false);
                    setEditingBook(null);
                    setBookForm({
                      title: "",
                      author: "",
                    });
                    setBookAuthorSearch("");
                    setShowAuthorOptions(false);
                  }}
                >
                  Prekliči
                </button>
              </div>
            </form>
          )}

          <section className="table-wrap">
            {loading ? (
              <p className="empty">Nalaganje knjig ...</p>
            ) : books.length === 0 ? (
              <p className="empty">Ni najdenih knjig.</p>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>Naslov</th>
                    <th>Avtor</th>
                    <th className="actions-heading">Dejanja</th>
                  </tr>
                </thead>

                <tbody>
                  {books.map((book) => (
                    <tr key={book._id}>
                      <td className="book-title">
                        {book.title}
                      </td>

                      <td>
                        {book.author
                          ? `${book.author.firstName} ${book.author.lastName}`
                          : "Neznan avtor"}
                      </td>

                      <td className="actions">
                        <button
                          className="text-button"
                          onClick={() => startEditBook(book)}
                        >
                          Uredi
                        </button>

                        <button
                          className="text-button danger-text"
                          onClick={() => deleteBook(book)}
                        >
                          Izbriši
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </section>

          <footer className="pagination">
            <button
              className="secondary"
              disabled={page <= 1}
              onClick={() => setPage((value) => value - 1)}
            >
              ← Prejšnja
            </button>

            <span>
              Stran {page} od {totalPages}
            </span>

            <button
              className="secondary"
              disabled={page >= totalPages}
              onClick={() => setPage((value) => value + 1)}
            >
              Naslednja →
            </button>
          </footer>
        </>
      )}

      {tab === "authors" && (
        <>
          <section className="toolbar">
            <div>
              <h2>Avtorji</h2>
            </div>

            <button className="primary" onClick={startNewAuthor}>
              + Dodaj avtorja
            </button>
          </section>

          <input
            className="search"
            type="search"
            placeholder="Išči po imenu ali priimku ..."
            value={authorSearch}
            onChange={(event) => {
              setAuthorSearch(event.target.value);
              setAuthorPage(1);
            }}
          />

          {showAuthorForm && (
            <form className="editor" onSubmit={saveAuthor}>
              <h3>
                {editingAuthor ? "Uredi avtorja" : "Nov avtor"}
              </h3>

              <div className="form-grid">
                <label>
                  Ime
                  <input
                    required
                    value={authorForm.firstName}
                    onChange={(event) =>
                      setAuthorForm({
                        ...authorForm,
                        firstName: event.target.value,
                      })
                    }
                    placeholder="Ime"
                  />
                </label>

                <label>
                  Priimek
                  <input
                    required
                    value={authorForm.lastName}
                    onChange={(event) =>
                      setAuthorForm({
                        ...authorForm,
                        lastName: event.target.value,
                      })
                    }
                    placeholder="Priimek"
                  />
                </label>
              </div>

              <div className="form-actions">
                <button className="primary" type="submit">
                  Shrani
                </button>

                <button
                  className="secondary"
                  type="button"
                  onClick={() => {
                    setShowAuthorForm(false);
                    setEditingAuthor(null);
                    setAuthorForm({
                      firstName: "",
                      lastName: "",
                    });
                  }}
                >
                  Prekliči
                </button>
              </div>
            </form>
          )}

          <section className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Ime</th>
                  <th>Priimek</th>
                  <th className="actions-heading">Dejanja</th>
                </tr>
              </thead>

              <tbody>
                {authors.map((author) => (
                  <tr key={author._id}>
                    <td>{author.firstName}</td>
                    <td>{author.lastName}</td>

                    <td className="actions">
                      <button
                        className="text-button"
                        onClick={() => startEditAuthor(author)}
                      >
                        Uredi
                      </button>

                      <button
                        className="text-button danger-text"
                        onClick={() => deleteAuthor(author)}
                      >
                        Izbriši
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          <footer className="pagination">
            <button
              className="secondary"
              disabled={authorPage <= 1}
              onClick={() => setAuthorPage((value) => value - 1)}
            >
              ← Prejšnja
            </button>

            <span>
              Stran {authorPage} od {authorTotalPages}
            </span>

            <button
              className="secondary"
              disabled={authorPage >= authorTotalPages}
              onClick={() => setAuthorPage((value) => value + 1)}
            >
              Naslednja →
            </button>
          </footer>
        </>
      )}
    </main>
  );
}

export default App;
