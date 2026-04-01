// Интегрированные книги, извлеченные из предоставленного контекста
const defaultLibrary = [
    {
        id: 'book-1',
        title: 'Акида Уаситийя',
        author: 'Шейхуль-ислам Ибн Таймийя',
        summary: 'Краткое послание, содержащее великий смысл, затрагивающее исламские убеждения, в частности имена и качества Аллаха, а также веру. Убеждения берутся только из Книги Аллаха и достоверной Сунны.',
        tags: ['Акида', 'Таухид', 'Имена и Атрибуты'],
        sections: [
            {
                title: 'Основы веры и её шесть столбов',
                content: 'Ими являются вера в Аллаха, в Его ангелов, в Его Книги, в Его Посланников, в воскресение после смерти и вера в предопределение добра и зла Аллахом. К вере в Аллаха относится вера в то, как Он Сам описал Себя, без искажения, без отрицания, без придания определенного образа и без уподобления.'
            },
            {
                title: 'Срединное положение Ахлю-с-Сунна',
                content: 'Приверженцы Сунны занимают срединное положение среди течений точно так же, как сама мусульманская умма занимает срединное положение среди всех общин. Они находятся посередине в вопросах атрибутов Аллаха между людьми отрицания и людьми уподобления.'
            }
        ]
    },
    {
        id: 'book-2',
        title: 'Достижение цели (Булуг аль-Марам)',
        author: 'Ибн Хаджар аль-Аскалани',
        summary: 'Достижение цели в уяснении священных текстов, на которые опирается мусульманское право (фикх). Труд, ставший энциклопедией Сунны в правовых аспектах.',
        tags: ['Фикх', 'Сунна', 'Очищение'],
        sections: [
            {
                title: 'Книга очищения',
                content: 'Вода остается чистой и пригодной для очищения, если в нее не попали нечистоты, которые изменили ее запах, вкус или цвет. Морская вода чиста и пригодна для очищения, а умерших в ней животных разрешается употреблять в пищу.'
            },
            {
                title: 'Намаз (Молитва)',
                content: 'Посланник Аллаха определил строгие сроки для каждого намаза. Намаз не засчитывается тому, кто не совершил омовения. Самым лучшим деянием является намаз, совершенный в начале отведенного для него времени.'
            }
        ]
    },
    {
        id: 'book-3',
        title: 'Основы имана',
        author: 'Редакция «К Исламу»',
        summary: 'Книга содержит необходимый минимум знаний основ исламского вероучения и разъяснение каждого из них, отвечая на вопросы, ради чего сотворен человек.',
        tags: ['Иман', 'Поклонение', 'Убеждения'],
        sections: [
            {
                title: 'Единобожие в божественности (Улюхийя)',
                content: 'Убеждение сердцем в том, что только один Аллах является истинным божеством. Поклоняться следует только Ему путем подчинения, взывания с мольбами, надежды, страха, прибегания за помощью и упования.'
            },
            {
                title: 'Условия свидетельства',
                content: 'Для того, чтобы свидетельство "Нет божества, достойного поклонения, кроме Аллаха" принесло пользу, необходимо соблюсти семь условий: знание, уверенность, согласие, подчинение, правдивость, искренность и любовь.'
            }
        ]
    }
];

class LibraryApp {
    constructor() {
        this.books = JSON.parse(localStorage.getItem('libraryos_books')) || defaultLibrary;
        this.initDOM();
        this.bindEvents();
        this.renderLibrary();
        this.initTheme();
    }

    initDOM() {
        this.booksGrid = document.getElementById('booksGrid');
        this.emptyState = document.getElementById('emptyState');
        this.libraryView = document.getElementById('libraryView');
        this.bookView = document.getElementById('bookView');
        this.bookDetailContent = document.getElementById('bookDetailContent');
        this.searchInput = document.getElementById('searchInput');
        this.uploadModal = document.getElementById('uploadModal');
        this.dropZone = document.getElementById('dropZone');
        this.fileInput = document.getElementById('fileInput');
        this.progressBar = document.getElementById('progressBar');
        this.progressContainer = document.getElementById('progressContainer');
    }

    bindEvents() {
        // Навигация
        document.querySelector('[data-view="library"]').addEventListener('click', () => this.switchView('library'));
        document.getElementById('backBtn').addEventListener('click', () => this.switchView('library'));
        
        // Поиск
        this.searchInput.addEventListener('input', (e) => this.handleSearch(e.target.value));

        // Модальное окно
        document.getElementById('uploadBtn').addEventListener('click', () => this.uploadModal.classList.remove('hidden'));
        document.getElementById('closeModal').addEventListener('click', () => this.uploadModal.classList.add('hidden'));

        // Drag & Drop
        this.dropZone.addEventListener('dragover', (e) => { e.preventDefault(); this.dropZone.classList.add('dragover'); });
        this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('dragover'));
        this.dropZone.addEventListener('drop', (e) => {
            e.preventDefault();
            this.dropZone.classList.remove('dragover');
            if (e.dataTransfer.files.length) this.processFile(e.dataTransfer.files[0]);
        });
        this.dropZone.addEventListener('click', () => this.fileInput.click());
        this.fileInput.addEventListener('change', (e) => {
            if (e.target.files.length) this.processFile(e.target.files[0]);
        });

        // Тема
        document.getElementById('themeToggle').addEventListener('click', () => this.toggleTheme());
    }

    initTheme() {
        const theme = localStorage.getItem('libraryos_theme') || 'dark';
        document.body.setAttribute('data-theme', theme);
    }

    toggleTheme() {
        const current = document.body.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        document.body.setAttribute('data-theme', next);
        localStorage.setItem('libraryos_theme', next);
    }

    saveBooks() {
        localStorage.setItem('libraryos_books', JSON.stringify(this.books));
    }

    switchView(viewName) {
        if (viewName === 'library') {
            this.bookView.classList.add('hidden');
            setTimeout(() => this.libraryView.classList.remove('hidden'), 200);
            this.renderLibrary();
        } else if (viewName === 'book') {
            this.libraryView.classList.add('hidden');
            setTimeout(() => this.bookView.classList.remove('hidden'), 200);
        }
    }

    renderLibrary(filterText = '') {
        this.booksGrid.innerHTML = '';
        const lowerFilter = filterText.toLowerCase();
        
        const filtered = this.books.filter(book => 
            book.title.toLowerCase().includes(lowerFilter) ||
            book.author.toLowerCase().includes(lowerFilter) ||
            book.summary.toLowerCase().includes(lowerFilter)
        );

        if (filtered.length === 0) {
            this.emptyState.classList.remove('hidden');
        } else {
            this.emptyState.classList.add('hidden');
            filtered.forEach(book => {
                const card = document.createElement('div');
                card.className = 'book-card glass';
                card.innerHTML = `
                    <div class="book-cover">📖</div>
                    <div class="book-info">
                        <h3>${book.title}</h3>
                        <p class="muted">${book.author}</p>
                        <div class="book-tags">
                            ${book.tags.map(t => `<span class="tag">${t}</span>`).join('')}
                        </div>
                    </div>
                `;
                card.addEventListener('click', () => this.openBook(book));
                this.booksGrid.appendChild(card);
            });
        }
    }

    handleSearch(text) {
        this.renderLibrary(text);
    }

    openBook(book) {
        let sectionsHTML = book.sections.map(sec => `
            <div class="book-section">
                <h3>${sec.title}</h3>
                <p>${sec.content.replace(/\n/g, '<br><br>')}</p>
            </div>
        `).join('');

        this.bookDetailContent.innerHTML = `
            <h1 class="book-title-large">${book.title}</h1>
            <p class="book-author-large">${book.author}</p>
            <div class="book-summary">
                <strong>Краткая мысль:</strong><br>
                ${book.summary}
            </div>
            <div class="book-body">
                ${sectionsHTML}
            </div>
        `;
        this.switchView('book');
    }

    // Имитация умного парсинга текста
    processFile(file) {
        this.progressContainer.classList.remove('hidden');
        this.progressBar.style.width = '20%';

        if (file.name.endsWith('.txt')) {
            const reader = new FileReader();
            reader.onload = (e) => {
                this.progressBar.style.width = '60%';
                setTimeout(() => {
                    this.parseTextContent(file.name, e.target.result);
                    this.progressBar.style.width = '100%';
                    setTimeout(() => {
                        this.uploadModal.classList.add('hidden');
                        this.progressContainer.classList.add('hidden');
                        this.progressBar.style.width = '0%';
                        this.renderLibrary();
                    }, 500);
                }, 600); // Имитация времени обработки ML
            };
            reader.readAsText(file);
        } else {
            // Для PDF/других - базовая концептуальная обработка (заглушка согласно правилам отсутствия внешних либ)
            setTimeout(() => {
                const dummyBook = {
                    id: 'book-' + Date.now(),
                    title: file.name.replace(/\.[^/.]+$/, ""),
                    author: 'Неизвестный автор',
                    summary: 'PDF/Документ успешно импортирован. Поскольку использование внешних библиотек (pdf.js) отключено, представлен базовый макет данных для этой книги.',
                    tags: ['Импорт', 'Документ'],
                    sections: [{ title: 'Содержимое', content: 'Текст документа будет доступен здесь...' }]
                };
                this.books.unshift(dummyBook);
                this.saveBooks();
                this.uploadModal.classList.add('hidden');
                this.progressContainer.classList.add('hidden');
                this.renderLibrary();
            }, 1000);
        }
    }

    parseTextContent(filename, text) {
        // Примитивная логика извлечения: первые строки - заголовки, затем параграфы
        const lines = text.split('\n').filter(l => l.trim().length > 0);
        const title = lines[0] ? lines[0].trim() : filename;
        const author = lines[1] ? lines[1].trim() : "Неизвестный автор";
        const summary = lines.slice(2, 5).join(' ').substring(0, 200) + '...';
        
        // Разбивка на секции по пустым строкам или условным главам
        let sections = [];
        let currentSection = { title: 'Основная часть', content: '' };

        for (let i = 2; i < lines.length && i < 50; i++) { // Ограничение для демо
            if (lines[i].length < 50 && lines[i].endsWith('.')) {
                if (currentSection.content) sections.push(currentSection);
                currentSection = { title: lines[i], content: '' };
            } else {
                currentSection.content += lines[i] + ' ';
            }
        }
        if (currentSection.content) sections.push(currentSection);

        const newBook = {
            id: 'book-' + Date.now(),
            title,
            author,
            summary,
            tags: ['Новая', 'Текст'],
            sections: sections.length > 0 ? sections : [{ title: 'Текст', content: text.substring(0, 1000) }]
        };

        this.books.unshift(newBook);
        this.saveBooks();
    }
}

// Инициализация
document.addEventListener('DOMContentLoaded', () => {
    window.app = new LibraryApp();
});
