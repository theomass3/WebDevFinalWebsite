const { useState, useEffect } = React;

const BOOK_COLORS = [
    '#8B4513', // Saddle Brown
    '#2C5F2D', // Forest Green
    '#1C4587', // Navy Blue
    '#7B241C', // Burgundy
    '#145A32', // Dark Green
    '#7D3C98', // Purple
    '#B7950B', // Dark Gold
    '#AF601A', // Burnt Orange
    '#154360', // Midnight Blue
    '#7E5109', // Dark Tan
    '#641E16', // Dark Red
    '#145A32', // Emerald
    '#512E5F', // Dark Purple
    '#784212', // Brown
    '#0E6655'  // Teal
];

function pickColor() {
    return BOOK_COLORS[Math.floor(Math.random() * BOOK_COLORS.length)];
}

function generateId() {
    return Date.now() + Math.random();
}

// Main App Component
function App() {
    const [shelves, setShelves] = useState({
        wishlist: [],
        reading: [],
        read: [],
        suggested: []
    });

    useEffect(() => {
        const savedBooks = localStorage.getItem('SavedBooks');
        if (savedBooks) {
            setShelves(JSON.parse(savedBooks));
        }
    }, []); // Empty array = runs ONCE when app loads

    // 2. SAVE to localStorage whenever shelves change
    useEffect(() => {
        localStorage.setItem('SavedBooks', JSON.stringify(shelves));
    }, [shelves]); // Runs whenever shelves state changes
    // console.log((shelves))

    const HARDCOVER_API_KEY = 'Bearer eyJhbGciOiJIUzI1NiJ9.eyJpc3MiOiJIYXJkY292ZXIiLCJ2ZXJzaW9uIjoiOCIsImp0aSI6ImYwMzNkMzc2LTc5ZDUtNDkzNS05YTYzLTQ1OTFjOWZiZDM3MCIsImFwcGxpY2F0aW9uSWQiOjIsInN1YiI6IjU1OTczIiwiYXVkIjoiMSIsImlkIjoiNTU5NzMiLCJsb2dnZWRJbiI6dHJ1ZSwiaWF0IjoxNzYzODc3NDkxLCJleHAiOjE3OTU0MTM0OTEsImh0dHBzOi8vaGFzdXJhLmlvL2p3dC9jbGFpbXMiOnsieC1oYXN1cmEtYWxsb3dlZC1yb2xlcyI6WyJ1c2VyIl0sIngtaGFzdXJhLWRlZmF1bHQtcm9sZSI6InVzZXIiLCJ4LWhhc3VyYS1yb2xlIjoidXNlciIsIlgtaGFzdXJhLXVzZXItaWQiOiI1NTk3MyJ9LCJ1c2VyIjp7ImlkIjo1NTk3M319.VtISJ9upyqw3hD297WBN63ZxFxqdVF6Z-oVWuG5P3HY';


    // Proxied, corrected request
    const proxyUrl = 'https://corsproxy.io/?';
    const hardcoverApiUrl = 'https://api.hardcover.app/v1/graphql';
    const proxiedUrl = proxyUrl + encodeURIComponent(hardcoverApiUrl);

    const bookHeight = 500;
    const [theme, setTheme] = useState('day');
    const [showAddModal, setShowAddModal] = useState(false);
    const [modalMode, setModalMode] = useState('add'); // 'add' | 'edit'
    const [modalData, setModalData] = useState(null);  // Data passed into modal
    // const books = [1, 2, 3, 4, 5, 6, 7]
    const getBooksByTitle = (title) => {
        
        const query = `
    {
      search(
              query: "${title}",
              query_type: "Book",
              per_page: 10,
              page: 1
          ) {
              results
          }
    }`;

        return fetch(proxiedUrl, {  // ✅ Add 'return'
            headers: {
                'content-type': 'application/json',
                authorization: HARDCOVER_API_KEY,
            },
            body: JSON.stringify({ query }),
            method: 'POST',
        })
            .then((response) => response.json())
            .then(({ data }) => {
                let searchedBooks = []
                data.search.results.hits.forEach(bookResult => {
                    searchedBooks.push(bookResult.document)
                });
                searchedBooks.sort((a, b) => b.ratings_count - a.ratings_count)
                console.log(searchedBooks)
                return searchedBooks[0];  // ✅ Return the array
            });
    }

    const getBookInfo = (title) => {
        return getBooksByTitle(title).then(book => {  // returns document
            if (book) {
                return {
                    rating: book.rating,
                    coverUrl: book.image.url
                };
            }
            return { rating: 0, coverUrl: '' };
        });
    }
    
    const addBook = async ({ title, shelf, rating, isUserRated }) => {
        const { rating: apiRating, coverUrl: apiCover } = await getBookInfo(title);
        let finalRating = rating;
        let finalIsUserRated = isUserRated;
        const finalCoverUrl = apiCover || '';

        if (shelf === 'wishlist' || shelf === 'suggested') {
            finalRating = Math.round(apiRating);
            finalIsUserRated = false;
        } else {
            finalRating = Math.max(1, Math.min(5, Math.round(rating || 0)));
            finalIsUserRated = true;
        }

        const newBook = {
            id: generateId(),
            title,
            rating: finalRating,
            color: pickColor(),
            height: 200 + Math.floor(Math.random() * 150),
            width: 60 + Math.floor(Math.random() * 30),
            shelf,
            isUserRated: finalIsUserRated,
            coverUrl: finalCoverUrl
        };

        setShelves(prev => ({
            ...prev,
            [shelf]: [...prev[shelf], newBook]
        }));
    };
    const deleteBook = (id, shelf) => {
        setShelves({
            ...shelves,
            [shelf]: shelves[shelf].filter(book => book.id !== id)
        });
    };

    const openAddModal = (shelfName) => {
        setModalMode('add');
        setModalData({
            title: '',
            shelf: shelfName,
            rating: 0,
            isUserRated: shelfName === 'wishlist' ? false : true,
        });
        setShowAddModal(true);
    };

    const openEditModal = (book) => {
        if (book.shelf === 'suggested') return; // view-only
        setModalMode('edit');
        setModalData({
            id: book.id,
            title: book.title,
            shelf: book.shelf,
            rating: book.rating,
            isUserRated: book.isUserRated,
            previousShelf: book.shelf,
            color: book.color,
            height: book.height,
            width: book.width,
            coverUrl: book.coverUrl || '',
        });
        setShowAddModal(true);
    };

    const updateBook = async ({ id, title, shelf, rating, isUserRated, previousShelf, color, height, width, coverUrl }) => {
        const { rating: apiRating, coverUrl: apiCover } = await getBookInfo(title);
        let finalRating = rating;
        let finalIsUserRated = isUserRated;
        const finalCoverUrl = apiCover || coverUrl || '';

        if (shelf === 'wishlist' || shelf === 'suggested') {
            finalRating = Math.round(apiRating);
            finalIsUserRated = false;
        } else {
            finalRating = Math.max(1, Math.min(5, Math.round(rating || 0)));
            finalIsUserRated = true;
        }

        setShelves(prev => {
            const next = {
                wishlist: prev.wishlist.filter(b => b.id !== id),
                reading: prev.reading.filter(b => b.id !== id),
                read: prev.read.filter(b => b.id !== id),
                suggested: prev.suggested.filter(b => b.id !== id),
            };

            // Keep other books intact even if previousShelf not provided
            // Now add the updated book into target shelf (preserve appearance when provided)
            next[shelf] = [...next[shelf], {
                id,
                title,
                rating: finalRating,
                color: color ?? pickColor(),
                height: height ?? (200 + Math.floor(Math.random() * 150)),
                width: width ?? (60 + Math.floor(Math.random() * 30)),
                shelf,
                isUserRated: finalIsUserRated,
                coverUrl: finalCoverUrl
            }];

            return next;
        });
    };

    const handleModalSave = async (bookData) => {
        if (modalMode === 'add') {
            await addBook(bookData);
        } else if (modalMode === 'edit') {
            await updateBook(bookData);
        }
        setShowAddModal(false);
        setModalData(null);
    };


    return (
        <div className="app">
            <header className="header">
                <h1>My Book Tracker</h1>
            </header>

            <main className="shelvesContainer">
                <BookShelf
                    title="Wish List"
                    books={shelves.wishlist}
                    showAddButton={true}
                    shelf={shelves[0]}
                    onDelete={deleteBook}
                    onAddClick={() => openAddModal('wishlist')}
                    onEdit={openEditModal}
                />
                <BookShelf
                    title="Currently Reading"
                    books={shelves.reading}
                    showAddButton={true}
                    shelf={shelves[1]}
                    onDelete={deleteBook}
                    onAddClick={() => openAddModal('reading')}
                    onEdit={openEditModal}
                />
                <BookShelf
                    title="Already Read"
                    books={shelves.read}
                    showAddButton={true}
                    shelf={shelves[2]}
                    onDelete={deleteBook}
                    onAddClick={() => openAddModal('read')}
                    onEdit={openEditModal}
                />
                <BookShelf
                    title="Suggested Books"
                    books={shelves.suggested}
                    shelf={shelves[3]}
                    onDelete={deleteBook}
                    showAddButton={false}  // No add button for suggested
                    onEdit={openEditModal}
                />
            </main>

            {/* Render modal if showAddModal is true */}
            {showAddModal && (
                <BookDetailsModal
                    mode={modalMode}
                    initialData={modalData}
                    onSave={handleModalSave}
                    onClose={() => { setShowAddModal(false); setModalData(null); }}
                />
            )}
        </div>
    );
}

function BookShelf({ title, books, showAddButton, onAddClick, onDelete, onEdit }) {
    return (
        <div className="shelfContainer">
            <div className="shelfHeader">
                <div className="shelfLabel">{title}</div>
                {showAddButton && (
                    <button className="addButton" onClick={onAddClick}>
                        + Add Book
                    </button>
                )}
            </div>

            <div className="booksArea">
                {books && books.map(book => (
                    <Book
                        key={book.id}
                        book={book}
                        shelf={book.shelf}
                        onDelete={onDelete}
                        onClick={onEdit}
                    />
                ))}
            </div>
        </div>
    );
}



function Book({ book, onClick, onDelete, shelf }) {
    return (
        <div 
            className="book"
            style={{ 
                backgroundColor: book.color,
                height: `${book.height}px`,
                width: `${book.width}px`  // ✅ Dynamic width
            }}
            onClick={() => onClick?.(book)}
        >
            <button 
                className="delete-btn"
            
                onClick={(e) => { e.stopPropagation(); onDelete(book.id, shelf); }}
                title="Delete book"
            >
                ×
            </button>

            

            <div className="book-title-vertical">
                {book.title}
            </div>

            <div className="book-rating">
                <StarRating rating={book.rating} isUserRated={book.isUserRated} />
            </div>
        </div>
    );
}

function StarRating({ rating, interactive = false, onRate, isUserRated = false }) {
    const totalStars = 5;
    
    return (
        <div className="star-rating">
            {Array.from({ length: totalStars }, (_, index) => {
                const starNumber = index + 1;
                
                if (rating >= starNumber) {
                    return (
                        <span
                            className={`star ${isUserRated ? 'star-user' : 'star-api'}`}
                            key={index}
                            onClick={interactive ? () => onRate?.(starNumber) : undefined}
                        >
                            ★
                        </span>
                    );
                } else {
                    return (
                        <span
                            className={`star ${isUserRated ? 'star-user' : 'star-api'}`}
                            key={index}
                            onClick={interactive ? () => onRate?.(starNumber) : undefined}
                        >
                            ☆
                        </span>
                    );
                }
            })}
        </div>
    );
}

function BookDetailsModal({ mode = 'add', initialData, onSave, onClose }) {
    const [title, setTitle] = useState(initialData?.title || '');
    const [shelf, setShelf] = useState(initialData?.shelf || 'wishlist');
    const [rating, setRating] = useState(initialData?.rating || 0);
    const [isUserRated, setIsUserRated] = useState(initialData?.isUserRated || false);
    const [isSaving, setIsSaving] = useState(false);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!title.trim()) return;

        const payload = {
            id: initialData?.id,
            title: title.trim(),
            shelf,
            rating,
            isUserRated,
            previousShelf: initialData?.previousShelf,
            color: initialData?.color,
            height: initialData?.height,
            width: initialData?.width,
            coverUrl: initialData?.coverUrl || '',
        };

        setIsSaving(true);
        Promise.resolve(onSave(payload)).finally(() => setIsSaving(false));
    };

    const handleShelfChange = (value) => {
        setShelf(value);
        if (value === 'wishlist' || value === 'suggested') {
            setIsUserRated(false);
        } else {
            setIsUserRated(true);
        }
    };

    const canUserRate = shelf === 'reading' || shelf === 'read';

    return (
        <div className="modalOverlay" onClick={onClose}>
            <div className="modalContent" onClick={(e) => e.stopPropagation()}>
                <h2>{mode === 'add' ? 'Add New Book' : 'Edit Book'}</h2>

                <form onSubmit={handleSubmit}>
                    <input
                        type="text"
                        placeholder="Book title..."
                        value={title}
                        onChange={(e) => setTitle(e.target.value)}
                        className="bookInput"
                        autoFocus
                        disabled={mode === 'edit'}
                        readOnly={mode === 'edit'}
                    />

                    <div className="field">
                        <label htmlFor="shelf-select">Shelf</label>
                        <select
                            id="shelf-select"
                            value={shelf}
                            onChange={(e) => handleShelfChange(e.target.value)}
                        >
                            <option value="wishlist">Wish List</option>
                            <option value="reading">Currently Reading</option>
                            <option value="read">Already Read</option>
                        </select>
                    </div>
                    {/* <img className="field" src={coverUrl}/> */}

                    <div className="field">
                        <label>User Rating (only for Reading/Read)</label>
                        <StarRating
                            rating={rating}
                            interactive={canUserRate}
                            isUserRated={isUserRated}
                            onRate={(value) => {
                                if (canUserRate) {
                                    setRating(value);
                                    setIsUserRated(true);
                                }
                            }}
                        />
                        {!canUserRate && (
                            <p className="helper-text">
                                {shelf === 'wishlist' || shelf === 'suggested'
                                    ? 'API rating will be used.'
                                    : ''}
                            </p>
                        )}
                    </div>

                    <div className="modalButtons">
                        <button type="submit" className="submitButton" disabled={isSaving}>
                            {mode === 'add' ? 'Save Book' : 'Save Changes'}
                        </button>
                        <button
                            type="button"
                            className="cancelButton"
                            onClick={onClose}
                        >
                            Cancel
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

function DeleteButton(onClickDelete) {

}

// Render the app
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);

