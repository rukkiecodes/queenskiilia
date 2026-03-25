export interface QuestionTemplate {
  text: string;
  options: string[];
  correctIndex: number;
}

// Mock question bank keyed by category slug.
// Each category has at least 10 questions so we can always pick 10 random ones.
export const questionBank: Record<string, QuestionTemplate[]> = {
  javascript: [
    {
      text: 'Which keyword declares a block-scoped variable in JavaScript?',
      options: ['var', 'let', 'def', 'dim'],
      correctIndex: 1,
    },
    {
      text: 'What does `===` check in JavaScript?',
      options: ['Value only', 'Type only', 'Value and type', 'Reference equality'],
      correctIndex: 2,
    },
    {
      text: 'Which method adds an element to the end of an array?',
      options: ['shift()', 'unshift()', 'push()', 'pop()'],
      correctIndex: 2,
    },
    {
      text: 'What is the output of `typeof null`?',
      options: ['"null"', '"undefined"', '"object"', '"boolean"'],
      correctIndex: 2,
    },
    {
      text: 'Which statement correctly creates a Promise?',
      options: [
        'new Promise(resolve, reject)',
        'new Promise((resolve, reject) => {})',
        'Promise.create((resolve, reject) => {})',
        'async Promise((resolve) => {})',
      ],
      correctIndex: 1,
    },
    {
      text: 'What does the spread operator `...` do?',
      options: [
        'Creates a new scope',
        'Expands an iterable into individual elements',
        'Declares a rest parameter only',
        'Merges two classes',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which Array method returns a new array with transformed elements?',
      options: ['forEach()', 'filter()', 'map()', 'reduce()'],
      correctIndex: 2,
    },
    {
      text: 'What is a closure in JavaScript?',
      options: [
        'A function with no return value',
        'A function that remembers the variables from its outer scope',
        'A sealed object',
        'An immediately invoked function expression',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which built-in method converts a JSON string to an object?',
      options: ['JSON.stringify()', 'JSON.parse()', 'JSON.decode()', 'JSON.convert()'],
      correctIndex: 1,
    },
    {
      text: 'What does `async/await` rely on under the hood?',
      options: ['Callbacks', 'Generators', 'Promises', 'Event emitters'],
      correctIndex: 2,
    },
    {
      text: 'What is the result of `0.1 + 0.2 === 0.3` in JavaScript?',
      options: ['true', 'false', 'undefined', 'NaN'],
      correctIndex: 1,
    },
    {
      text: 'Which method removes and returns the last element of an array?',
      options: ['shift()', 'splice()', 'pop()', 'slice()'],
      correctIndex: 2,
    },
  ],

  python: [
    {
      text: 'Which keyword is used to define a function in Python?',
      options: ['function', 'func', 'def', 'fn'],
      correctIndex: 2,
    },
    {
      text: 'What is the output of `type([])` in Python?',
      options: ["<class 'array'>", "<class 'list'>", "<class 'tuple'>", "<class 'dict'>"],
      correctIndex: 1,
    },
    {
      text: 'Which operator is used for integer (floor) division in Python 3?',
      options: ['/', '%', '//', '**'],
      correctIndex: 2,
    },
    {
      text: 'How do you create a virtual environment in Python?',
      options: [
        'python -m env create',
        'python -m venv myenv',
        'pip install venv',
        'virtualenv --new myenv',
      ],
      correctIndex: 1,
    },
    {
      text: 'What does `*args` allow in a Python function?',
      options: [
        'Keyword-only arguments',
        'A fixed number of positional arguments',
        'An arbitrary number of positional arguments',
        'Default argument values',
      ],
      correctIndex: 2,
    },
    {
      text: 'Which Python data structure is immutable?',
      options: ['list', 'dict', 'set', 'tuple'],
      correctIndex: 3,
    },
    {
      text: 'What is a list comprehension?',
      options: [
        'A way to import lists from another module',
        'A concise syntax for creating lists from iterables',
        'A method to sort a list in place',
        'A decorator for list-returning functions',
      ],
      correctIndex: 1,
    },
    {
      text: 'What does the `with` statement ensure?',
      options: [
        'A variable is globally scoped',
        'A context manager is properly entered and exited',
        'A loop runs at least once',
        'An exception is always caught',
      ],
      correctIndex: 1,
    },
    {
      text: 'How do you inherit from a parent class in Python?',
      options: [
        'class Child extends Parent:',
        'class Child inherits Parent:',
        'class Child(Parent):',
        'class Child -> Parent:',
      ],
      correctIndex: 2,
    },
    {
      text: 'Which module provides regular expression support in Python?',
      options: ['regex', 're', 'regexp', 'string'],
      correctIndex: 1,
    },
    {
      text: 'What does `enumerate()` return?',
      options: [
        'A list of values',
        'A dictionary of index-value pairs',
        'An iterator of (index, value) tuples',
        'A sorted iterable',
      ],
      correctIndex: 2,
    },
    {
      text: 'Which decorator marks a static method in Python?',
      options: ['@classmethod', '@property', '@staticmethod', '@abstract'],
      correctIndex: 2,
    },
  ],

  'data-science': [
    {
      text: 'What does "overfitting" mean in machine learning?',
      options: [
        'The model performs poorly on both train and test data',
        'The model performs well on training data but poorly on new data',
        'The model is too simple to capture patterns',
        'The model has too few parameters',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which library is commonly used for numerical computing in Python?',
      options: ['pandas', 'numpy', 'scipy', 'matplotlib'],
      correctIndex: 1,
    },
    {
      text: 'What is a confusion matrix used for?',
      options: [
        'Visualising feature distributions',
        'Evaluating the performance of a classification model',
        'Normalising input data',
        'Reducing dimensionality',
      ],
      correctIndex: 1,
    },
    {
      text: 'What does PCA stand for?',
      options: [
        'Partial Cluster Analysis',
        'Principal Component Analysis',
        'Probabilistic Classification Algorithm',
        'Predictive Correlation Approach',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which metric is most appropriate when classes are imbalanced?',
      options: ['Accuracy', 'F1-score', 'Mean squared error', 'R-squared'],
      correctIndex: 1,
    },
    {
      text: 'What is the purpose of cross-validation?',
      options: [
        'To increase training data size',
        'To estimate how well a model generalises to unseen data',
        'To remove duplicate rows',
        'To normalise feature scales',
      ],
      correctIndex: 1,
    },
    {
      text: 'In a neural network, what is backpropagation?',
      options: [
        'Forward pass through each layer',
        'The process of updating weights using gradient of the loss',
        'The activation function applied at each node',
        'The technique of adding noise to inputs',
      ],
      correctIndex: 1,
    },
    {
      text: 'What does a high variance model indicate?',
      options: [
        'The model is underfitting',
        'The model is too simple',
        'The model is sensitive to noise in training data',
        'The model has low training error and low test error',
      ],
      correctIndex: 2,
    },
    {
      text: 'What is feature engineering?',
      options: [
        'Training a model on raw hardware',
        'The process of using domain knowledge to create informative input features',
        'Selecting only numerical columns',
        'Tuning hyperparameters automatically',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which algorithm is a type of ensemble method?',
      options: ['Logistic Regression', 'k-Nearest Neighbours', 'Random Forest', 'Support Vector Machine'],
      correctIndex: 2,
    },
    {
      text: 'What does "regularisation" do in model training?',
      options: [
        'Speeds up gradient descent',
        'Penalises large weights to reduce overfitting',
        'Increases the learning rate dynamically',
        'Removes outliers from the dataset',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which pandas method fills missing values?',
      options: ['dropna()', 'fillna()', 'replace()', 'impute()'],
      correctIndex: 1,
    },
  ],

  'web-development': [
    {
      text: 'What does HTML stand for?',
      options: [
        'HyperText Markup Language',
        'HighText Machine Language',
        'HyperTransfer Markup Language',
        'HyperText Multiple Language',
      ],
      correctIndex: 0,
    },
    {
      text: 'Which CSS property controls the stacking order of elements?',
      options: ['position', 'display', 'z-index', 'opacity'],
      correctIndex: 2,
    },
    {
      text: 'What is the box model in CSS?',
      options: [
        'A 3D layout system',
        'A description of how margin, border, padding and content compose an element',
        'A flexbox configuration',
        'A grid template definition',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which HTTP method is typically used to update a resource?',
      options: ['GET', 'POST', 'PUT', 'DELETE'],
      correctIndex: 2,
    },
    {
      text: 'What is the purpose of semantic HTML?',
      options: [
        'To add styling directly in HTML',
        'To use tags that convey meaning about their content',
        'To reduce file size',
        'To make JavaScript execution faster',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which React hook manages local component state?',
      options: ['useEffect', 'useContext', 'useState', 'useReducer'],
      correctIndex: 2,
    },
    {
      text: 'What does REST stand for?',
      options: [
        'Rapid Endpoint State Transfer',
        'Representational State Transfer',
        'Remote Execution Service Technology',
        'Relational Endpoint Schema Template',
      ],
      correctIndex: 1,
    },
    {
      text: 'What is a CSS media query used for?',
      options: [
        'Fetching media files from a server',
        'Applying styles conditionally based on device characteristics',
        'Creating animations',
        'Defining CSS variables',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which tool is used to manage JavaScript project dependencies?',
      options: ['Webpack', 'Babel', 'npm', 'ESLint'],
      correctIndex: 2,
    },
    {
      text: 'What is CORS?',
      options: [
        'A CSS preprocessor',
        'A security mechanism that controls cross-origin HTTP requests',
        'A JavaScript bundling format',
        'A database query language',
      ],
      correctIndex: 1,
    },
    {
      text: 'What does the `defer` attribute on a `<script>` tag do?',
      options: [
        'Prevents the script from running',
        'Loads the script asynchronously and executes it after the document is parsed',
        'Runs the script before the DOM is ready',
        'Disables caching for the script',
      ],
      correctIndex: 1,
    },
    {
      text: 'Which HTTP status code means "Not Found"?',
      options: ['200', '301', '403', '404'],
      correctIndex: 3,
    },
  ],

  general: [
    {
      text: 'What does CPU stand for?',
      options: ['Central Processing Unit', 'Computer Personal Unit', 'Core Processing Utility', 'Central Peripheral Unit'],
      correctIndex: 0,
    },
    {
      text: 'What is an algorithm?',
      options: [
        'A programming language',
        'A step-by-step procedure for solving a problem',
        'A type of database',
        'A network protocol',
      ],
      correctIndex: 1,
    },
    {
      text: 'What is version control?',
      options: [
        'Controlling the speed of software execution',
        'A system for tracking changes to files over time',
        'A method for compressing files',
        'A technique for encrypting data',
      ],
      correctIndex: 1,
    },
    {
      text: 'What does API stand for?',
      options: [
        'Application Programming Interface',
        'Automated Program Interaction',
        'Advanced Processing Integration',
        'Application Protocol Index',
      ],
      correctIndex: 0,
    },
    {
      text: 'What is the purpose of a database index?',
      options: [
        'To encrypt stored data',
        'To speed up data retrieval operations',
        'To back up the database automatically',
        'To enforce foreign key constraints',
      ],
      correctIndex: 1,
    },
    {
      text: 'What is the difference between `==` and `===` in many languages?',
      options: [
        'They are identical operators',
        '`==` checks value only; `===` checks value and type',
        '`===` checks value only; `==` checks type only',
        '`===` is for strings; `==` is for numbers',
      ],
      correctIndex: 1,
    },
    {
      text: 'What is recursion in programming?',
      options: [
        'A loop that runs indefinitely',
        'A function that calls itself to solve a smaller instance of the same problem',
        'A method for sorting arrays',
        'A design pattern for UI components',
      ],
      correctIndex: 1,
    },
    {
      text: 'What does OOP stand for?',
      options: [
        'Object-Oriented Programming',
        'Ordered Output Processing',
        'Optional Operation Pattern',
        'Open-Origin Protocol',
      ],
      correctIndex: 0,
    },
    {
      text: 'What is a stack data structure?',
      options: [
        'A structure where the first element added is the first removed (FIFO)',
        'A structure where the last element added is the first removed (LIFO)',
        'A sorted linked list',
        'A two-dimensional array',
      ],
      correctIndex: 1,
    },
    {
      text: 'What is Big O notation used for?',
      options: [
        'Measuring memory usage in bytes',
        'Describing the time or space complexity of an algorithm',
        'Documenting API endpoints',
        'Formatting code consistently',
      ],
      correctIndex: 1,
    },
    {
      text: 'What does SQL stand for?',
      options: [
        'Simple Query Language',
        'Structured Query Language',
        'Standard Question Logic',
        'Sequential Query Lookup',
      ],
      correctIndex: 1,
    },
    {
      text: 'What is a binary search tree?',
      options: [
        'A tree where each node has exactly two children',
        'A sorted tree where left children are smaller and right children are larger than the parent',
        'A tree used only for binary files',
        'A heap-based priority queue',
      ],
      correctIndex: 1,
    },
  ],
};

/**
 * Returns 10 random questions for the given category.
 * Falls back to the "general" bank if the category is unknown.
 */
export function pickQuestions(category: string): QuestionTemplate[] {
  const normalised = category.toLowerCase().replace(/\s+/g, '-');
  const bank = questionBank[normalised] ?? questionBank['general'];
  const shuffled = [...bank].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 10);
}
