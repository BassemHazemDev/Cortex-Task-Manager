# Node.js Backend with TypeScript Complete Guide

A comprehensive guide covering Node.js backend development with TypeScript, from fundamentals to advanced patterns, with practical examples and detailed explanations.

---

## Table of Contents

1. [Introduction to Node.js Backend Development](#1-introduction-to-nodejs-backend-development)
2. [Project Setup & TypeScript Configuration](#2-project-setup--typescript-configuration)
3. [Project Structure (Modular Monolith)](#3-project-structure-modular-monolith)
4. [Express.js Fundamentals](#4-expressjs-fundamentals)
5. [Three-Layer Architecture](#5-three-layer-architecture)
6. [Database Layer (MongoDB/Mongoose)](#6-database-layer-mongodbmongoose)
7. [Validation & Schema Design](#7-validation--schema-design)
8. [Authentication Patterns](#8-authentication-patterns)
9. [Authorization & Role-Based Access](#9-authorization--role-based-access)
10. [Error Handling](#10-error-handling)
11. [Middleware Patterns](#11-middleware-patterns)
12. [API Features](#12-api-features)
13. [Redis & Caching Strategies](#13-redis--caching-strategies)
14. [Testing Node.js Applications](#14-testing-nodejs-applications)
15. [Security Best Practices](#15-security-best-practices)
16. [Logging & Monitoring](#16-logging--monitoring)
17. [Deployment & Production](#17-deployment--production)
18. [Best Practices Summary](#18-best-practices-summary)
19. [Common Patterns Cheat Sheet](#19-common-patterns-cheat-sheet)
20. [Resources for Further Learning](#20-resources-for-further-learning)

---

## 1. Introduction to Node.js Backend Development

**What is Node.js?**

Node.js is a JavaScript runtime built on Chrome's V8 engine that allows you to run JavaScript on the server side. It uses an event-driven, non-blocking I/O model that makes it lightweight and efficient for building scalable network applications.

**Why TypeScript for Backend?**

TypeScript adds static type checking to JavaScript, providing:
- **Compile-time error detection** - Catch bugs before runtime
- **Better IDE support** - Autocomplete, refactoring, navigation
- **Self-documenting code** - Types serve as documentation
- **Safer refactoring** - Type system catches breaking changes
- **Enterprise-ready** - Better maintainability for large codebases

**Node.js vs Other Backend Technologies:**

| Feature | Node.js | Python (Django/Flask) | Java (Spring) | Go |
|---------|---------|----------------------|---------------|-----|
| Performance | High (V8) | Medium | High | Very High |
| Concurrency | Event Loop | Threads/Async | Threads | Goroutines |
| Learning Curve | Low | Low | High | Medium |
| Ecosystem | Excellent (npm) | Good | Excellent | Growing |
| Real-time Apps | Excellent | Good | Good | Excellent |
| JSON Handling | Native | Library | Library | Library |

**When to Choose Node.js:**
- Real-time applications (chat, gaming, live updates)
- API servers and microservices
- Single-page application backends
- Streaming applications
- When your team knows JavaScript
- When you need fast development cycles

**Key Concepts:**
- Node.js is single-threaded but handles concurrency through the event loop
- Non-blocking I/O makes it excellent for I/O-heavy operations
- npm (Node Package Manager) provides access to millions of packages
- TypeScript compiles to JavaScript and runs on Node.js

---

## 2. Project Setup & TypeScript Configuration

**Initializing a Node.js + TypeScript Project:**

```bash
# Create project directory
mkdir my-backend && cd my-backend

# Initialize package.json
npm init -y

# Install TypeScript and Node.js types
npm install -D typescript @types/node ts-node nodemon

# Install Express and its types
npm install express
npm install -D @types/express

# Generate tsconfig.json
npx tsc --init
```

**Recommended tsconfig.json for Backend:**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "NodeNext",
    "moduleResolution": "NodeNext",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": "./src",
    "paths": {
      "@/*": ["./*"],
      "@modules/*": ["./modules/*"],
      "@utils/*": ["./utils/*"],
      "@config/*": ["./config/*"]
    }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**Package.json Scripts:**

```json
{
  "scripts": {
    "dev": "nodemon --exec ts-node src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "lint": "eslint src/**/*.ts",
    "lint:fix": "eslint src/**/*.ts --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

**Nodemon Configuration (nodemon.json):**

```json
{
  "watch": ["src"],
  "ext": "ts,json",
  "ignore": ["src/**/*.test.ts"],
  "exec": "ts-node ./src/server.ts"
}
```

**ESLint Configuration (.eslintrc.js):**

```javascript
module.exports = {
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    project: './tsconfig.json',
  },
  plugins: ['@typescript-eslint'],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/recommended',
    'plugin:@typescript-eslint/recommended-requiring-type-checking',
  ],
  rules: {
    '@typescript-eslint/explicit-function-return-type': 'warn',
    '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
    '@typescript-eslint/no-explicit-any': 'warn',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
  },
  env: {
    node: true,
    es2022: true,
  },
};
```

**Prettier Configuration (.prettierrc):**

```json
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 100,
  "tabWidth": 2,
  "useTabs": false
}
```

**Environment Variables (.env.example):**

```env
# Server
NODE_ENV=development
PORT=3000

# Database
DATABASE_URL=mongodb://localhost:27017/myapp

# JWT
JWT_SECRET=your-secret-key
JWT_EXPIRES_IN=7d

# Redis
REDIS_URL=redis://localhost:6379
```

**Key Concepts:**
- Use `ts-node` for development, compiled JavaScript for production
- Configure path aliases in `tsconfig.json` for cleaner imports
- Enable strict mode for maximum type safety
- Set up nodemon for automatic restart during development
- Keep environment variables in `.env` files (never commit secrets)

---

## 3. Project Structure (Modular Monolith)

**What is a Modular Monolith?**

A modular monolith organizes code into self-contained feature modules while deploying as a single application. It combines the simplicity of a monolith with the organization benefits of microservices.

**Recommended Directory Structure:**

```
my-backend/
├── src/
│   ├── server.ts                 # Application Entry Point
│   ├── app.ts                    # Express App Configuration
│   │
│   ├── config/                   # Configuration
│   │   ├── index.ts              # Config aggregator
│   │   ├── database.ts           # Database config
│   │   ├── redis.ts              # Redis config
│   │   └── environment.ts        # Environment variables
│   │
│   ├── modules/                  # FEATURE MODULES
│   │   ├── index.ts              # Main Router (aggregates all routes)
│   │   │
│   │   ├── auth/                 # Authentication Module
│   │   │   ├── auth.routes.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.validator.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── user/                 # User Module
│   │   │   ├── user.routes.ts
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.validator.ts
│   │   │   └── user.types.ts
│   │   │
│   │   └── product/              # Product Module
│   │       ├── product.routes.ts
│   │       ├── product.controller.ts
│   │       ├── product.service.ts
│   │       ├── product.validator.ts
│   │       └── product.types.ts
│   │
│   ├── database/                 # Database Layer
│   │   ├── connection.ts         # Database connection
│   │   └── models/               # Mongoose/TypeORM Models
│   │       ├── user.model.ts
│   │       ├── product.model.ts
│   │       └── index.ts
│   │
│   ├── utils/                    # Shared Utilities
│   │   ├── features/             # API Features (pagination, etc.)
│   │   │   └── apiFeatures.ts
│   │   ├── handlers/             # Error Handlers
│   │   │   ├── appError.ts
│   │   │   ├── catchAsync.ts
│   │   │   └── errorHandler.ts
│   │   ├── middleware/           # Express Middleware
│   │   │   ├── auth.middleware.ts
│   │   │   ├── validate.middleware.ts
│   │   │   └── rateLimit.middleware.ts
│   │   └── services/             # Shared Services
│   │       ├── email.service.ts
│   │       ├── redis.service.ts
│   │       └── upload.service.ts
│   │
│   └── types/                    # Global TypeScript Types
│       ├── express.d.ts          # Express type extensions
│       └── global.d.ts           # Global type declarations
│
├── tests/                        # Test Files
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── uploads/                      # Static Asset Storage
├── logs/                         # Log Files
├── dist/                         # Compiled JavaScript
│
├── .env                          # Environment Variables
├── .env.example                  # Example Environment
├── .gitignore
├── package.json
├── tsconfig.json
├── nodemon.json
└── README.md
```

**Module Index File (src/modules/index.ts):**

```typescript
import { Router } from 'express';
import authRoutes from './auth/auth.routes';
import userRoutes from './user/user.routes';
import productRoutes from './product/product.routes';

const router = Router();

// Mount module routes
router.use('/auth', authRoutes);
router.use('/users', userRoutes);
router.use('/products', productRoutes);

export default router;
```

**Express App Configuration (src/app.ts):**

```typescript
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import mongoSanitize from 'express-mongo-sanitize';

import moduleRoutes from './modules';
import { errorHandler } from './utils/handlers/errorHandler';
import { AppError } from './utils/handlers/appError';

const app: Application = express();

// Security Middleware
app.use(helmet());
app.use(cors());
app.use(mongoSanitize());

// Rate Limiting
const limiter = rateLimit({
  max: 100,
  windowMs: 60 * 60 * 1000, // 1 hour
  message: 'Too many requests from this IP, please try again later.',
});
app.use('/api', limiter);

// Body Parsing
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// Compression
app.use(compression());

// Logging
if (process.env.NODE_ENV === 'development') {
  app.use(morgan('dev'));
}

// Static Files
app.use('/uploads', express.static('uploads'));

// API Routes
app.use('/api/v1', moduleRoutes);

// Health Check
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 404 Handler
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

// Global Error Handler
app.use(errorHandler);

export default app;
```

**Server Entry Point (src/server.ts):**

```typescript
import app from './app';
import { connectDatabase } from './database/connection';
import { connectRedis } from './utils/services/redis.service';

const PORT = process.env.PORT || 3000;

async function bootstrap(): Promise<void> {
  try {
    // Connect to MongoDB
    await connectDatabase();
    console.log('✅ Database connected successfully');

    // Connect to Redis
    await connectRedis();
    console.log('✅ Redis connected successfully');

    // Start Server
    app.listen(PORT, () => {
      console.log(`🚀 Server running on port ${PORT}`);
      console.log(`📍 Environment: ${process.env.NODE_ENV}`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

// Handle uncaught exceptions
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('UNHANDLED REJECTION! 💥 Shutting down...');
  console.error(err.name, err.message);
  process.exit(1);
});

bootstrap();
```

**Key Concepts:**
- Each module is self-contained with its own routes, controller, service, and types
- The `modules/index.ts` aggregates all module routes
- Shared utilities live in `utils/` and are imported across modules
- Database models are centralized in `database/models/`
- Configuration is separated by concern (database, redis, environment)
- Use path aliases (`@modules/`, `@utils/`) for cleaner imports

---

## 4. Express.js Fundamentals

**What is Express.js?**

Express is a minimal and flexible Node.js web application framework that provides a robust set of features for building web and mobile applications.

**Basic Express Server with TypeScript:**

```typescript
import express, { Request, Response, NextFunction } from 'express';

const app = express();

// Middleware
app.use(express.json());

// Route
app.get('/', (req: Request, res: Response) => {
  res.json({ message: 'Hello, World!' });
});

// Start server
app.listen(3000, () => {
  console.log('Server running on port 3000');
});
```

**Express Type Definitions:**

```typescript
import { Request, Response, NextFunction, RequestHandler } from 'express';

// Typed Request with Body
interface CreateUserBody {
  name: string;
  email: string;
  password: string;
}

// Typed Request with Params
interface UserParams {
  id: string;
}

// Typed Request with Query
interface SearchQuery {
  q?: string;
  page?: string;
  limit?: string;
}

// Combined Typed Request
type TypedRequest<TBody = any, TParams = any, TQuery = any> = Request<
  TParams,
  any,
  TBody,
  TQuery
>;

// Usage in controller
const createUser = (
  req: TypedRequest<CreateUserBody>,
  res: Response,
  next: NextFunction
): void => {
  const { name, email, password } = req.body; // Fully typed!
  // ...
};

const getUser = (
  req: TypedRequest<{}, UserParams>,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params; // string
  // ...
};
```

**Extending Express Request (src/types/express.d.ts):**

```typescript
import { IUser } from '../database/models/user.model';

declare global {
  namespace Express {
    interface Request {
      user?: IUser;
      requestTime?: string;
    }
  }
}

export {};
```

**Route Definition Patterns:**

```typescript
import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate } from '@utils/middleware/auth.middleware';
import { validate } from '@utils/middleware/validate.middleware';
import { createUserSchema, updateUserSchema } from './user.validator';

const router = Router();

// Public routes
router.post('/register', validate(createUserSchema), userController.register);
router.post('/login', userController.login);

// Protected routes (require authentication)
router.use(authenticate); // All routes below require auth

router
  .route('/')
  .get(userController.getAllUsers)
  .post(validate(createUserSchema), userController.createUser);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(validate(updateUserSchema), userController.updateUser)
  .delete(userController.deleteUser);

export default router;
```

**Request Lifecycle:**

```
Request → Middleware Chain → Route Handler → Response

1. Global Middleware (cors, helmet, body-parser)
2. Route-specific Middleware (auth, validation)
3. Controller (handle request)
4. Service (business logic)
5. Response sent back to client
```

**Async Route Handler Pattern:**

```typescript
// Without wrapper - need try/catch in every handler
app.get('/users', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const users = await User.find();
    res.json(users);
  } catch (error) {
    next(error);
  }
});

// With catchAsync wrapper - cleaner code
import { catchAsync } from '@utils/handlers/catchAsync';

app.get('/users', catchAsync(async (req: Request, res: Response) => {
  const users = await User.find();
  res.json(users);
}));
```

**Response Patterns:**

```typescript
// Success responses
res.status(200).json({ success: true, data: users });
res.status(201).json({ success: true, data: newUser });
res.status(204).send(); // No content

// Error responses (handled by error middleware)
next(new AppError('User not found', 404));
next(new AppError('Invalid credentials', 401));

// Standardized Response Format
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Usage
const response: ApiResponse<IUser[]> = {
  success: true,
  data: users,
  pagination: {
    page: 1,
    limit: 10,
    total: 100,
    pages: 10,
  },
};
res.json(response);
```

**Key Concepts:**
- Express is middleware-based - requests flow through a chain
- Use TypeScript generics to type request body, params, and query
- Extend Express Request interface for custom properties (like user)
- Use route parameter chaining for cleaner route definitions
- Wrap async handlers to avoid repetitive try/catch blocks

---

## 5. Three-Layer Architecture

**The Three-Layer Separation:**

We strictly separate **HTTP handling** from **Business Logic** to improve testability, maintainability, and code organization.

```
┌─────────────────────────────────────────────────────┐
│                    CLIENT                            │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              ROUTES (Traffic Cop)                    │
│  - Define URL paths                                  │
│  - Apply middleware (auth, validation)               │
│  - Route to correct controller                       │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│            CONTROLLERS (Interface)                   │
│  - Extract data from request                         │
│  - Call service methods                              │
│  - Send HTTP response                                │
│  - NO business logic                                 │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│              SERVICES (Brain)                        │
│  - All business logic                                │
│  - Database operations                               │
│  - External API calls                                │
│  - NO req/res handling                               │
└─────────────────────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────┐
│                  DATABASE                            │
└─────────────────────────────────────────────────────┘
```

### Layer 1: Routes (*.routes.ts)

**Role:** The "Traffic Cop" - defines endpoints and applies middleware.

```typescript
// src/modules/product/product.routes.ts
import { Router } from 'express';
import * as productController from './product.controller';
import { authenticate, authorize } from '@utils/middleware/auth.middleware';
import { validate } from '@utils/middleware/validate.middleware';
import {
  createProductSchema,
  updateProductSchema,
  getProductsQuerySchema,
} from './product.validator';

const router = Router();

// Public routes
router.get('/', validate(getProductsQuerySchema, 'query'), productController.getAll);
router.get('/:id', productController.getOne);

// Protected routes
router.use(authenticate);

// Admin only routes
router.post(
  '/',
  authorize('admin'),
  validate(createProductSchema),
  productController.create
);

router.patch(
  '/:id',
  authorize('admin'),
  validate(updateProductSchema),
  productController.update
);

router.delete('/:id', authorize('admin'), productController.remove);

export default router;
```

**Key Rules for Routes:**
- Only define URL paths and HTTP methods
- Apply middleware in the correct order
- Never contain business logic
- Keep them short and declarative

### Layer 2: Controllers (*.controller.ts)

**Role:** The "Interface" - handles HTTP request/response.

```typescript
// src/modules/product/product.controller.ts
import { Request, Response, NextFunction } from 'express';
import { catchAsync } from '@utils/handlers/catchAsync';
import * as productService from './product.service';
import { CreateProductDTO, UpdateProductDTO, ProductQuery } from './product.types';

// Get all products
export const getAll = catchAsync(async (req: Request, res: Response) => {
  const query = req.query as ProductQuery;
  const result = await productService.findAll(query);
  
  res.status(200).json({
    success: true,
    results: result.products.length,
    data: result.products,
    pagination: result.pagination,
  });
});

// Get single product
export const getOne = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const product = await productService.findById(id);
  
  res.status(200).json({
    success: true,
    data: product,
  });
});

// Create product
export const create = catchAsync(async (req: Request, res: Response) => {
  const data: CreateProductDTO = req.body;
  const product = await productService.create(data);
  
  res.status(201).json({
    success: true,
    data: product,
  });
});

// Update product
export const update = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: UpdateProductDTO = req.body;
  const product = await productService.update(id, data);
  
  res.status(200).json({
    success: true,
    data: product,
  });
});

// Delete product
export const remove = catchAsync(async (req: Request, res: Response) => {
  const { id } = req.params;
  await productService.remove(id);
  
  res.status(204).send();
});
```

**Key Rules for Controllers:**
- Extract data from `req.body`, `req.params`, `req.query`
- Call appropriate service method
- Send HTTP response with correct status code
- **NEVER** contain database queries
- **NEVER** contain business logic

### Layer 3: Services (*.service.ts)

**Role:** The "Brain" - contains all business logic.

```typescript
// src/modules/product/product.service.ts
import { Product, IProduct } from '@database/models/product.model';
import { AppError } from '@utils/handlers/appError';
import { APIFeatures } from '@utils/features/apiFeatures';
import { CreateProductDTO, UpdateProductDTO, ProductQuery } from './product.types';
import { redisService } from '@utils/services/redis.service';

const CACHE_KEY_PREFIX = 'product:';
const CACHE_TTL = 3600; // 1 hour

class ProductService {
  async findAll(query: ProductQuery) {
    // Check cache first
    const cacheKey = `products:${JSON.stringify(query)}`;
    const cached = await redisService.get(cacheKey);
    if (cached) {
      return JSON.parse(cached);
    }

    // Build query with features
    const features = new APIFeatures(Product.find(), query)
      .filter()
      .sort()
      .limitFields()
      .paginate();

    // Execute query
    const products = await features.query;
    const total = await Product.countDocuments(features.filterQuery);

    const result = {
      products,
      pagination: {
        page: Number(query.page) || 1,
        limit: Number(query.limit) || 10,
        total,
        pages: Math.ceil(total / (Number(query.limit) || 10)),
      },
    };

    // Cache result
    await redisService.setEx(cacheKey, CACHE_TTL, JSON.stringify(result));

    return result;
  }

  async findById(id: string): Promise<IProduct> {
    // Check cache
    const cached = await redisService.get(`${CACHE_KEY_PREFIX}${id}`);
    if (cached) {
      return JSON.parse(cached);
    }

    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Cache product
    await redisService.setEx(
      `${CACHE_KEY_PREFIX}${id}`,
      CACHE_TTL,
      JSON.stringify(product)
    );

    return product;
  }

  async create(data: CreateProductDTO): Promise<IProduct> {
    // Business rule: Check if product exists
    const exists = await Product.exists({ name: data.name });
    if (exists) {
      throw new AppError('Product with this name already exists', 400);
    }

    // Business rule: Validate stock
    if (data.stock < 0) {
      throw new AppError('Stock cannot be negative', 400);
    }

    const product = await Product.create(data);

    // Invalidate list cache
    await this.invalidateListCache();

    return product;
  }

  async update(id: string, data: UpdateProductDTO): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });

    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Invalidate caches
    await redisService.del(`${CACHE_KEY_PREFIX}${id}`);
    await this.invalidateListCache();

    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }

    // Invalidate caches
    await redisService.del(`${CACHE_KEY_PREFIX}${id}`);
    await this.invalidateListCache();
  }

  private async invalidateListCache(): Promise<void> {
    const keys = await redisService.keys('products:*');
    if (keys.length > 0) {
      await redisService.del(...keys);
    }
  }
}

export default new ProductService();
```

**Key Rules for Services:**
- Contain ALL business logic
- Interact with database models
- Call external APIs (Stripe, email, etc.)
- **NEVER** use `req` or `res` objects
- Can be called by controllers, scripts, cron jobs, or tests

### Type Definitions (*.types.ts)

```typescript
// src/modules/product/product.types.ts

export interface CreateProductDTO {
  name: string;
  description: string;
  price: number;
  stock: number;
  category: string;
  images?: string[];
}

export interface UpdateProductDTO {
  name?: string;
  description?: string;
  price?: number;
  stock?: number;
  category?: string;
  images?: string[];
}

export interface ProductQuery {
  page?: string;
  limit?: string;
  sort?: string;
  fields?: string;
  name?: string;
  category?: string;
  'price[gte]'?: string;
  'price[lte]'?: string;
}
```

**Benefits of Three-Layer Architecture:**

| Benefit | Description |
|---------|-------------|
| **Testability** | Services can be tested without HTTP overhead |
| **Reusability** | Services can be called from anywhere (cron, scripts) |
| **Maintainability** | Changes in one layer don't affect others |
| **Clarity** | Clear mental model of where code belongs |
| **Scalability** | Easy to split into microservices later |

**Key Concepts:**
- Routes define endpoints and apply middleware only
- Controllers handle HTTP - extract data and send responses
- Services contain all business logic and database operations
- Never let HTTP concepts (req/res) leak into services
- This pattern is 90% compatible with NestJS for future migration

---

## 6. Database Layer (MongoDB/Mongoose)

**What is Mongoose?**

Mongoose is an Object Document Mapper (ODM) for MongoDB that provides schema-based solutions with validation, type casting, and query building.

**Database Connection (src/database/connection.ts):**

```typescript
import mongoose from 'mongoose';

const connectDatabase = async (): Promise<void> => {
  const dbUrl = process.env.DATABASE_URL;
  
  if (!dbUrl) {
    throw new Error('DATABASE_URL environment variable is not defined');
  }

  try {
    await mongoose.connect(dbUrl, {
      // Connection options
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    });

    console.log('✅ MongoDB connected successfully');

    // Handle connection events
    mongoose.connection.on('error', (err) => {
      console.error('MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('MongoDB disconnected');
    });

  } catch (error) {
    console.error('❌ MongoDB connection failed:', error);
    throw error;
  }
};

const disconnectDatabase = async (): Promise<void> => {
  await mongoose.disconnect();
  console.log('MongoDB disconnected');
};

export { connectDatabase, disconnectDatabase };
```

**Schema Definition with TypeScript:**

```typescript
// src/database/models/user.model.ts
import mongoose, { Document, Schema, Model } from 'mongoose';
import bcrypt from 'bcryptjs';
import validator from 'validator';

// Interface for User document
export interface IUser extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  email: string;
  password: string;
  role: 'user' | 'admin' | 'moderator';
  photo?: string;
  isActive: boolean;
  passwordChangedAt?: Date;
  passwordResetToken?: string;
  passwordResetExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  
  // Instance methods
  comparePassword(candidatePassword: string): Promise<boolean>;
  changedPasswordAfter(jwtTimestamp: number): boolean;
}

// Interface for User Model (static methods)
export interface IUserModel extends Model<IUser> {
  findByEmail(email: string): Promise<IUser | null>;
}

// Schema definition
const userSchema = new Schema<IUser, IUserModel>(
  {
    name: {
      type: String,
      required: [true, 'Name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [50, 'Name cannot exceed 50 characters'],
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      validate: [validator.isEmail, 'Please provide a valid email'],
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [8, 'Password must be at least 8 characters'],
      select: false, // Never include password in query results by default
    },
    role: {
      type: String,
      enum: ['user', 'admin', 'moderator'],
      default: 'user',
    },
    photo: {
      type: String,
      default: 'default.jpg',
    },
    isActive: {
      type: Boolean,
      default: true,
      select: false,
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes
userSchema.index({ email: 1 });
userSchema.index({ role: 1 });

// Pre-save middleware: Hash password
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Pre-save middleware: Update passwordChangedAt
userSchema.pre('save', function (next) {
  if (!this.isModified('password') || this.isNew) return next();
  
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

// Query middleware: Exclude inactive users
userSchema.pre(/^find/, function (next) {
  (this as mongoose.Query<any, any>).find({ isActive: { $ne: false } });
  next();
});

// Instance method: Compare password
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

// Instance method: Check if password changed after JWT issued
userSchema.methods.changedPasswordAfter = function (
  jwtTimestamp: number
): boolean {
  if (this.passwordChangedAt) {
    const changedTimestamp = Math.floor(
      this.passwordChangedAt.getTime() / 1000
    );
    return jwtTimestamp < changedTimestamp;
  }
  return false;
};

// Static method: Find by email
userSchema.statics.findByEmail = function (email: string) {
  return this.findOne({ email }).select('+password');
};

// Virtual: Full profile URL
userSchema.virtual('photoUrl').get(function () {
  return `${process.env.APP_URL}/uploads/users/${this.photo}`;
});

export const User = mongoose.model<IUser, IUserModel>('User', userSchema);
```

**Product Model Example:**

```typescript
// src/database/models/product.model.ts
import mongoose, { Document, Schema } from 'mongoose';

export interface IProduct extends Document {
  _id: mongoose.Types.ObjectId;
  name: string;
  slug: string;
  description: string;
  price: number;
  priceDiscount?: number;
  stock: number;
  category: mongoose.Types.ObjectId;
  images: string[];
  isActive: boolean;
  ratingsAverage: number;
  ratingsQuantity: number;
  createdAt: Date;
  updatedAt: Date;
}

const productSchema = new Schema<IProduct>(
  {
    name: {
      type: String,
      required: [true, 'Product name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    slug: {
      type: String,
      unique: true,
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    priceDiscount: {
      type: Number,
      validate: {
        validator: function (this: IProduct, val: number): boolean {
          return val < this.price;
        },
        message: 'Discount price ({VALUE}) must be below regular price',
      },
    },
    stock: {
      type: Number,
      required: true,
      min: [0, 'Stock cannot be negative'],
      default: 0,
    },
    category: {
      type: Schema.Types.ObjectId,
      ref: 'Category',
      required: [true, 'Product must belong to a category'],
    },
    images: {
      type: [String],
      default: [],
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    ratingsAverage: {
      type: Number,
      default: 0,
      min: [0, 'Rating must be at least 0'],
      max: [5, 'Rating cannot exceed 5'],
      set: (val: number) => Math.round(val * 10) / 10,
    },
    ratingsQuantity: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for common queries
productSchema.index({ price: 1, ratingsAverage: -1 });
productSchema.index({ slug: 1 });
productSchema.index({ category: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Pre-save: Generate slug
productSchema.pre('save', function (next) {
  if (this.isModified('name')) {
    this.slug = this.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
  }
  next();
});

// Virtual populate reviews
productSchema.virtual('reviews', {
  ref: 'Review',
  foreignField: 'product',
  localField: '_id',
});

export const Product = mongoose.model<IProduct>('Product', productSchema);
```

**Model Index File:**

```typescript
// src/database/models/index.ts
export { User, IUser, IUserModel } from './user.model';
export { Product, IProduct } from './product.model';
export { Category, ICategory } from './category.model';
export { Order, IOrder } from './order.model';
```

**Common Query Patterns:**

```typescript
// Find with filters
const products = await Product.find({
  price: { $gte: 100, $lte: 500 },
  category: categoryId,
  isActive: true,
})
  .sort('-createdAt')
  .limit(10)
  .skip(0)
  .populate('category', 'name slug');

// Find one with select
const user = await User.findById(id).select('name email role');

// Update with options
const updated = await Product.findByIdAndUpdate(
  id,
  { $inc: { stock: -1 } },
  { new: true, runValidators: true }
);

// Aggregation pipeline
const stats = await Product.aggregate([
  { $match: { category: categoryId } },
  {
    $group: {
      _id: null,
      totalProducts: { $sum: 1 },
      avgPrice: { $avg: '$price' },
      minPrice: { $min: '$price' },
      maxPrice: { $max: '$price' },
    },
  },
]);

// Text search
const results = await Product.find(
  { $text: { $search: 'laptop gaming' } },
  { score: { $meta: 'textScore' } }
).sort({ score: { $meta: 'textScore' } });
```

**Key Concepts:**
- Define TypeScript interfaces for your documents
- Use schema validation for data integrity
- Create indexes for frequently queried fields
- Use pre/post hooks for automatic processing
- Virtual fields for computed properties
- Static methods for model-level operations
- Instance methods for document-level operations

---

## 7. Validation & Schema Design

**Why Validation?**

Validation ensures that incoming data meets your application's requirements before processing. It prevents invalid data from reaching your database and provides helpful error messages to clients.

### Joi Validation

Joi is a powerful schema validation library with a rich API:

```typescript
// src/modules/user/user.validator.ts
import Joi from 'joi';

// Register user schema
export const registerSchema = Joi.object({
  name: Joi.string()
    .min(2)
    .max(50)
    .required()
    .messages({
      'string.min': 'Name must be at least 2 characters',
      'string.max': 'Name cannot exceed 50 characters',
      'any.required': 'Name is required',
    }),
  
  email: Joi.string()
    .email()
    .required()
    .messages({
      'string.email': 'Please provide a valid email',
      'any.required': 'Email is required',
    }),
  
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .required()
    .messages({
      'string.min': 'Password must be at least 8 characters',
      'string.pattern.base': 'Password must contain uppercase, lowercase, and number',
      'any.required': 'Password is required',
    }),
  
  passwordConfirm: Joi.string()
    .valid(Joi.ref('password'))
    .required()
    .messages({
      'any.only': 'Passwords do not match',
      'any.required': 'Password confirmation is required',
    }),
});

// Login schema
export const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

// Update user schema (partial)
export const updateUserSchema = Joi.object({
  name: Joi.string().min(2).max(50),
  email: Joi.string().email(),
  photo: Joi.string(),
}).min(1).messages({
  'object.min': 'At least one field is required for update',
});
```

### Zod Validation (TypeScript-First)

Zod provides TypeScript-first schema validation with type inference:

```typescript
// src/modules/product/product.validator.ts
import { z } from 'zod';

// Create product schema
export const createProductSchema = z.object({
  body: z.object({
    name: z
      .string({
        required_error: 'Name is required',
      })
      .min(2, 'Name must be at least 2 characters')
      .max(100, 'Name cannot exceed 100 characters'),
    
    description: z.string().min(10, 'Description must be at least 10 characters'),
    
    price: z
      .number({
        required_error: 'Price is required',
        invalid_type_error: 'Price must be a number',
      })
      .positive('Price must be positive'),
    
    priceDiscount: z
      .number()
      .positive('Discount must be positive')
      .optional(),
    
    stock: z
      .number()
      .int('Stock must be an integer')
      .nonnegative('Stock cannot be negative')
      .default(0),
    
    category: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid category ID'),
    
    images: z.array(z.string().url()).optional(),
  }).refine(
    (data) => !data.priceDiscount || data.priceDiscount < data.price,
    {
      message: 'Discount price must be less than regular price',
      path: ['priceDiscount'],
    }
  ),
});

// Update product schema
export const updateProductSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid product ID'),
  }),
  body: z.object({
    name: z.string().min(2).max(100).optional(),
    description: z.string().min(10).optional(),
    price: z.number().positive().optional(),
    priceDiscount: z.number().positive().optional(),
    stock: z.number().int().nonnegative().optional(),
    category: z.string().regex(/^[0-9a-fA-F]{24}$/).optional(),
    images: z.array(z.string().url()).optional(),
  }).refine(
    (data) => Object.keys(data).length > 0,
    { message: 'At least one field is required for update' }
  ),
});

// Query schema for GET requests
export const getProductsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(10),
    sort: z.string().optional(),
    fields: z.string().optional(),
    name: z.string().optional(),
    category: z.string().optional(),
    'price[gte]': z.coerce.number().optional(),
    'price[lte]': z.coerce.number().optional(),
  }),
});

// Infer types from schemas
export type CreateProductInput = z.infer<typeof createProductSchema>['body'];
export type UpdateProductInput = z.infer<typeof updateProductSchema>['body'];
export type ProductQueryParams = z.infer<typeof getProductsQuerySchema>['query'];
```

### Validation Middleware

**Joi Validation Middleware:**

```typescript
// src/utils/middleware/validate.middleware.ts (Joi version)
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { AppError } from '@utils/handlers/appError';

type ValidationTarget = 'body' | 'query' | 'params';

export const validate = (
  schema: Joi.ObjectSchema,
  target: ValidationTarget = 'body'
) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    const { error, value } = schema.validate(req[target], {
      abortEarly: false,
      stripUnknown: true,
    });

    if (error) {
      const errorMessage = error.details
        .map((detail) => detail.message)
        .join(', ');
      return next(new AppError(errorMessage, 400));
    }

    // Replace with validated/sanitized data
    req[target] = value;
    next();
  };
};
```

**Zod Validation Middleware:**

```typescript
// src/utils/middleware/validate.middleware.ts (Zod version)
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { AppError } from '@utils/handlers/appError';

export const validate = (schema: AnyZodObject) => {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parsed = await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });
      
      // Replace with parsed/validated data
      req.body = parsed.body;
      req.query = parsed.query;
      req.params = parsed.params;
      
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errorMessages = error.errors
          .map((e) => `${e.path.join('.')}: ${e.message}`)
          .join(', ');
        return next(new AppError(errorMessages, 400));
      }
      next(error);
    }
  };
};
```

### Common Validation Patterns

```typescript
// Custom Zod validators
const objectIdSchema = z.string().regex(
  /^[0-9a-fA-F]{24}$/,
  'Invalid ObjectId format'
);

const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain uppercase letter')
  .regex(/[a-z]/, 'Password must contain lowercase letter')
  .regex(/[0-9]/, 'Password must contain number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain special character');

const phoneSchema = z.string().regex(
  /^\+?[1-9]\d{1,14}$/,
  'Invalid phone number format'
);

const dateSchema = z.coerce.date();

// Reusable pagination schema
const paginationSchema = z.object({
  page: z.coerce.number().int().positive().optional().default(1),
  limit: z.coerce.number().int().min(1).max(100).optional().default(10),
  sort: z.string().optional(),
});

// Using in other schemas
export const getOrdersSchema = z.object({
  query: paginationSchema.extend({
    status: z.enum(['pending', 'processing', 'shipped', 'delivered']).optional(),
    startDate: dateSchema.optional(),
    endDate: dateSchema.optional(),
  }),
});
```

### DTO Pattern with Validation

```typescript
// src/modules/auth/auth.dto.ts
import { z } from 'zod';

export const RegisterDTO = z.object({
  name: z.string().min(2).max(50),
  email: z.string().email(),
  password: z.string().min(8),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

export const LoginDTO = z.object({
  email: z.string().email(),
  password: z.string().min(1, 'Password is required'),
});

export const ForgotPasswordDTO = z.object({
  email: z.string().email(),
});

export const ResetPasswordDTO = z.object({
  password: z.string().min(8),
  passwordConfirm: z.string(),
}).refine((data) => data.password === data.passwordConfirm, {
  message: 'Passwords do not match',
  path: ['passwordConfirm'],
});

// Type exports
export type RegisterInput = z.infer<typeof RegisterDTO>;
export type LoginInput = z.infer<typeof LoginDTO>;
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordDTO>;
export type ResetPasswordInput = z.infer<typeof ResetPasswordDTO>;
```

**Key Concepts:**
- Validate all incoming data before processing
- Use Joi for JavaScript-first validation with rich error messages
- Use Zod for TypeScript-first validation with type inference
- Create reusable validation schemas for common patterns
- Strip unknown fields to prevent injection attacks
- Return clear, actionable error messages
- Use DTOs (Data Transfer Objects) to define input/output shapes

---

## 8. Authentication Patterns

**What is Authentication?**

Authentication verifies the identity of a user. The most common approach in APIs is JWT (JSON Web Token) based authentication.

### JWT Authentication Flow

```
1. User sends credentials (email/password)
2. Server validates credentials
3. Server creates JWT with user info
4. Server sends JWT to client
5. Client stores JWT (localStorage, cookie)
6. Client sends JWT with each request
7. Server verifies JWT before processing request
```

### Auth Service Implementation

```typescript
// src/modules/auth/auth.service.ts
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User, IUser } from '@database/models/user.model';
import { AppError } from '@utils/handlers/appError';
import { emailService } from '@utils/services/email.service';

interface TokenPayload {
  id: string;
  email: string;
  role: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

class AuthService {
  private readonly JWT_SECRET = process.env.JWT_SECRET!;
  private readonly JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '15m';
  private readonly REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET!;
  private readonly REFRESH_TOKEN_EXPIRES_IN = '7d';

  // Sign JWT token
  private signToken(payload: TokenPayload, secret: string, expiresIn: string): string {
    return jwt.sign(payload, secret, { expiresIn });
  }

  // Generate access and refresh tokens
  private createTokens(user: IUser): AuthTokens {
    const payload: TokenPayload = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
    };

    return {
      accessToken: this.signToken(payload, this.JWT_SECRET, this.JWT_EXPIRES_IN),
      refreshToken: this.signToken(payload, this.REFRESH_TOKEN_SECRET, this.REFRESH_TOKEN_EXPIRES_IN),
    };
  }

  // Register new user
  async register(data: {
    name: string;
    email: string;
    password: string;
  }): Promise<{ user: IUser; tokens: AuthTokens }> {
    // Check if user exists
    const existingUser = await User.findOne({ email: data.email });
    if (existingUser) {
      throw new AppError('Email already registered', 400);
    }

    // Create user
    const user = await User.create({
      name: data.name,
      email: data.email,
      password: data.password,
    });

    // Remove password from output
    user.password = undefined as any;

    const tokens = this.createTokens(user);

    return { user, tokens };
  }

  // Login user
  async login(email: string, password: string): Promise<{ user: IUser; tokens: AuthTokens }> {
    // Find user with password
    const user = await User.findByEmail(email);
    if (!user) {
      throw new AppError('Invalid email or password', 401);
    }

    // Check password
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      throw new AppError('Invalid email or password', 401);
    }

    // Remove password from output
    user.password = undefined as any;

    const tokens = this.createTokens(user);

    return { user, tokens };
  }

  // Verify access token
  verifyAccessToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.JWT_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid or expired token', 401);
    }
  }

  // Verify refresh token
  verifyRefreshToken(token: string): TokenPayload {
    try {
      return jwt.verify(token, this.REFRESH_TOKEN_SECRET) as TokenPayload;
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  // Refresh tokens
  async refreshTokens(refreshToken: string): Promise<AuthTokens> {
    const payload = this.verifyRefreshToken(refreshToken);
    
    const user = await User.findById(payload.id);
    if (!user) {
      throw new AppError('User no longer exists', 401);
    }

    return this.createTokens(user);
  }

  // Forgot password
  async forgotPassword(email: string): Promise<void> {
    const user = await User.findOne({ email });
    if (!user) {
      throw new AppError('No user found with this email', 404);
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.passwordResetToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');
    user.passwordResetExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    await user.save({ validateBeforeSave: false });

    // Send email
    const resetURL = `${process.env.FRONTEND_URL}/reset-password/${resetToken}`;
    await emailService.sendPasswordReset(user.email, user.name, resetURL);
  }

  // Reset password
  async resetPassword(token: string, newPassword: string): Promise<void> {
    const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AppError('Token is invalid or has expired', 400);
    }

    user.password = newPassword;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
  }

  // Update password
  async updatePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<AuthTokens> {
    const user = await User.findById(userId).select('+password');
    if (!user) {
      throw new AppError('User not found', 404);
    }

    const isPasswordValid = await user.comparePassword(currentPassword);
    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    user.password = newPassword;
    await user.save();

    return this.createTokens(user);
  }
}

export default new AuthService();
```

### Auth Controller

```typescript
// src/modules/auth/auth.controller.ts
import { Request, Response } from 'express';
import { catchAsync } from '@utils/handlers/catchAsync';
import authService from './auth.service';

export const register = catchAsync(async (req: Request, res: Response) => {
  const { user, tokens } = await authService.register(req.body);

  res.status(201).json({
    success: true,
    data: { user },
    tokens,
  });
});

export const login = catchAsync(async (req: Request, res: Response) => {
  const { email, password } = req.body;
  const { user, tokens } = await authService.login(email, password);

  // Optionally set refresh token as HTTP-only cookie
  res.cookie('refreshToken', tokens.refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  });

  res.status(200).json({
    success: true,
    data: { user },
    accessToken: tokens.accessToken,
  });
});

export const refreshToken = catchAsync(async (req: Request, res: Response) => {
  const refreshToken = req.cookies.refreshToken || req.body.refreshToken;
  const tokens = await authService.refreshTokens(refreshToken);

  res.status(200).json({
    success: true,
    accessToken: tokens.accessToken,
  });
});

export const forgotPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.forgotPassword(req.body.email);

  res.status(200).json({
    success: true,
    message: 'Password reset link sent to email',
  });
});

export const resetPassword = catchAsync(async (req: Request, res: Response) => {
  await authService.resetPassword(req.params.token, req.body.password);

  res.status(200).json({
    success: true,
    message: 'Password reset successful',
  });
});

export const updatePassword = catchAsync(async (req: Request, res: Response) => {
  const tokens = await authService.updatePassword(
    req.user!._id.toString(),
    req.body.currentPassword,
    req.body.newPassword
  );

  res.status(200).json({
    success: true,
    message: 'Password updated successfully',
    accessToken: tokens.accessToken,
  });
});

export const logout = catchAsync(async (req: Request, res: Response) => {
  res.cookie('refreshToken', '', {
    httpOnly: true,
    expires: new Date(0),
  });

  res.status(200).json({
    success: true,
    message: 'Logged out successfully',
  });
});
```

**Key Concepts:**
- Use short-lived access tokens (15m) and long-lived refresh tokens (7d)
- Store refresh tokens in HTTP-only cookies for security
- Hash password reset tokens before storing
- Always remove password from response objects
- Implement proper token rotation on refresh

---

## 9. Authorization & Role-Based Access

**What is Authorization?**

Authorization determines what actions an authenticated user can perform. Role-based access control (RBAC) is the most common pattern.

### Auth Middleware

```typescript
// src/utils/middleware/auth.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/handlers/appError';
import authService from '@modules/auth/auth.service';
import { User } from '@database/models/user.model';

// Authenticate user via JWT
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get token from header
    let token: string | undefined;
    if (req.headers.authorization?.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return next(new AppError('Please login to access this resource', 401));
    }

    // Verify token
    const decoded = authService.verifyAccessToken(token);

    // Check if user still exists
    const user = await User.findById(decoded.id);
    if (!user) {
      return next(new AppError('User no longer exists', 401));
    }

    // Check if password was changed after token was issued
    const jwtIssuedAt = decoded.iat as number;
    if (user.changedPasswordAfter(jwtIssuedAt)) {
      return next(new AppError('Password was changed. Please login again', 401));
    }

    // Attach user to request
    req.user = user;
    next();
  } catch (error) {
    next(error);
  }
};

// Authorize by role
export const authorize = (...roles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Please login first', 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

// Check resource ownership
export const isOwner = (resourceField: string = 'user') => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Please login first', 401));
    }

    // Allow admin to access any resource
    if (req.user.role === 'admin') {
      return next();
    }

    // Check if user owns the resource
    const resourceUserId = req.body[resourceField] || req.params.userId;
    if (resourceUserId && resourceUserId.toString() !== req.user._id.toString()) {
      return next(
        new AppError('You can only access your own resources', 403)
      );
    }

    next();
  };
};
```

### Using Authorization in Routes

```typescript
// src/modules/user/user.routes.ts
import { Router } from 'express';
import * as userController from './user.controller';
import { authenticate, authorize, isOwner } from '@utils/middleware/auth.middleware';
import { validate } from '@utils/middleware/validate.middleware';
import { updateUserSchema } from './user.validator';

const router = Router();

// All routes require authentication
router.use(authenticate);

// User's own profile
router.get('/me', userController.getMe);
router.patch('/me', validate(updateUserSchema), userController.updateMe);
router.delete('/me', userController.deleteMe);

// Admin only routes
router.use(authorize('admin'));

router.get('/', userController.getAllUsers);
router.get('/:id', userController.getUser);
router.patch('/:id', validate(updateUserSchema), userController.updateUser);
router.delete('/:id', userController.deleteUser);

export default router;
```

### Permission-Based Access

```typescript
// src/types/permissions.ts
export const PERMISSIONS = {
  // User permissions
  USER_READ: 'user:read',
  USER_CREATE: 'user:create',
  USER_UPDATE: 'user:update',
  USER_DELETE: 'user:delete',
  
  // Product permissions
  PRODUCT_READ: 'product:read',
  PRODUCT_CREATE: 'product:create',
  PRODUCT_UPDATE: 'product:update',
  PRODUCT_DELETE: 'product:delete',
  
  // Order permissions
  ORDER_READ: 'order:read',
  ORDER_CREATE: 'order:create',
  ORDER_UPDATE: 'order:update',
  ORDER_DELETE: 'order:delete',
} as const;

export type Permission = typeof PERMISSIONS[keyof typeof PERMISSIONS];

// Role to permissions mapping
export const ROLE_PERMISSIONS: Record<string, Permission[]> = {
  admin: Object.values(PERMISSIONS),
  moderator: [
    PERMISSIONS.USER_READ,
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.PRODUCT_UPDATE,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_UPDATE,
  ],
  user: [
    PERMISSIONS.PRODUCT_READ,
    PERMISSIONS.ORDER_READ,
    PERMISSIONS.ORDER_CREATE,
  ],
};
```

### Permission Middleware

```typescript
// src/utils/middleware/permission.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from '@utils/handlers/appError';
import { Permission, ROLE_PERMISSIONS } from '@/types/permissions';

export const hasPermission = (...requiredPermissions: Permission[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new AppError('Please login first', 401));
    }

    const userPermissions = ROLE_PERMISSIONS[req.user.role] || [];
    const hasAllPermissions = requiredPermissions.every((permission) =>
      userPermissions.includes(permission)
    );

    if (!hasAllPermissions) {
      return next(
        new AppError('You do not have permission to perform this action', 403)
      );
    }

    next();
  };
};

// Usage in routes
router.delete(
  '/:id',
  authenticate,
  hasPermission(PERMISSIONS.PRODUCT_DELETE),
  productController.remove
);
```

**Key Concepts:**
- Authenticate first, then authorize
- Use role-based access control (RBAC) for simple apps
- Use permission-based access for more granular control
- Always check resource ownership for user-specific data
- Admin role typically bypasses ownership checks
- Return 401 for authentication errors, 403 for authorization errors

---

## 10. Error Handling

**Why Structured Error Handling?**

Proper error handling ensures consistent error responses, prevents sensitive information leakage, and improves debugging.

### AppError Class

```typescript
// src/utils/handlers/appError.ts
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly status: string;
  public readonly isOperational: boolean;
  public readonly code?: string;

  constructor(
    message: string,
    statusCode: number,
    code?: string
  ) {
    super(message);
    
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;
    this.code = code;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Predefined error types
export class NotFoundError extends AppError {
  constructor(resource: string = 'Resource') {
    super(`${resource} not found`, 404, 'NOT_FOUND');
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 400, 'VALIDATION_ERROR');
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Please login to access this resource') {
    super(message, 401, 'UNAUTHORIZED');
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'You do not have permission') {
    super(message, 403, 'FORBIDDEN');
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(message, 409, 'CONFLICT');
  }
}
```

### catchAsync Wrapper

```typescript
// src/utils/handlers/catchAsync.ts
import { Request, Response, NextFunction, RequestHandler } from 'express';

type AsyncHandler = (
  req: Request,
  res: Response,
  next: NextFunction
) => Promise<any>;

export const catchAsync = (fn: AsyncHandler): RequestHandler => {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
```

### Global Error Handler

```typescript
// src/utils/handlers/errorHandler.ts
import { Request, Response, NextFunction } from 'express';
import { AppError } from './appError';
import mongoose from 'mongoose';

interface ErrorResponse {
  success: false;
  status: string;
  message: string;
  code?: string;
  errors?: any;
  stack?: string;
}

// Handle specific error types
const handleCastErrorDB = (err: mongoose.Error.CastError): AppError => {
  const message = `Invalid ${err.path}: ${err.value}`;
  return new AppError(message, 400);
};

const handleDuplicateFieldsDB = (err: any): AppError => {
  const value = Object.keys(err.keyValue).join(', ');
  const message = `Duplicate field value: ${value}. Please use another value.`;
  return new AppError(message, 400);
};

const handleValidationErrorDB = (err: mongoose.Error.ValidationError): AppError => {
  const errors = Object.values(err.errors).map((el) => el.message);
  const message = `Invalid input data: ${errors.join('. ')}`;
  return new AppError(message, 400);
};

const handleJWTError = (): AppError => {
  return new AppError('Invalid token. Please log in again.', 401);
};

const handleJWTExpiredError = (): AppError => {
  return new AppError('Your token has expired. Please log in again.', 401);
};

// Send error response
const sendErrorDev = (err: AppError, res: Response): void => {
  const response: ErrorResponse = {
    success: false,
    status: err.status,
    message: err.message,
    code: err.code,
    stack: err.stack,
  };
  
  res.status(err.statusCode).json(response);
};

const sendErrorProd = (err: AppError, res: Response): void => {
  // Operational, trusted error: send message to client
  if (err.isOperational) {
    const response: ErrorResponse = {
      success: false,
      status: err.status,
      message: err.message,
      code: err.code,
    };
    
    res.status(err.statusCode).json(response);
  } else {
    // Programming or unknown error: don't leak details
    console.error('ERROR 💥:', err);
    
    res.status(500).json({
      success: false,
      status: 'error',
      message: 'Something went wrong!',
    });
  }
};

// Main error handler middleware
export const errorHandler = (
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  err.statusCode = err.statusCode || 500;
  err.status = err.status || 'error';

  if (process.env.NODE_ENV === 'development') {
    sendErrorDev(err, res);
  } else {
    let error = { ...err, message: err.message, name: err.name };

    // Handle specific error types
    if (err.name === 'CastError') {
      error = handleCastErrorDB(err);
    }
    if (err.code === 11000) {
      error = handleDuplicateFieldsDB(err);
    }
    if (err.name === 'ValidationError') {
      error = handleValidationErrorDB(err);
    }
    if (err.name === 'JsonWebTokenError') {
      error = handleJWTError();
    }
    if (err.name === 'TokenExpiredError') {
      error = handleJWTExpiredError();
    }

    sendErrorProd(error, res);
  }
};
```

### HTTP Status Code Reference

| Code | Name | Usage |
|------|------|-------|
| 200 | OK | Successful GET, PUT, PATCH |
| 201 | Created | Successful POST (resource created) |
| 204 | No Content | Successful DELETE |
| 400 | Bad Request | Validation error, malformed request |
| 401 | Unauthorized | Missing or invalid authentication |
| 403 | Forbidden | Authenticated but not authorized |
| 404 | Not Found | Resource doesn't exist |
| 409 | Conflict | Duplicate resource, state conflict |
| 422 | Unprocessable Entity | Semantic validation error |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

**Key Concepts:**
- Use `AppError` for operational errors (expected, handleable)
- Use `catchAsync` to eliminate try/catch in every controller
- Show detailed errors in development, hide in production
- Transform database errors into user-friendly messages
- Always include error code for programmatic handling

---

## 11. Middleware Patterns

**What is Middleware?**

Middleware functions have access to the request and response objects and can modify them, execute code, and call the next middleware in the chain.

### Request Logging Middleware

```typescript
// src/utils/middleware/logger.middleware.ts
import { Request, Response, NextFunction } from 'express';

export const requestLogger = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const start = Date.now();
  
  // Log request
  console.log(`→ ${req.method} ${req.originalUrl}`);
  
  // Log response when finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
      `← ${req.method} ${req.originalUrl} ${res.statusCode} ${duration}ms`
    );
  });
  
  next();
};

// Add request timestamp
export const requestTime = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  req.requestTime = new Date().toISOString();
  next();
};
```

### Rate Limiting Middleware

```typescript
// src/utils/middleware/rateLimit.middleware.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import { redisClient } from '@utils/services/redis.service';

// General API rate limiter
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: {
    success: false,
    message: 'Too many requests, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
  // Use Redis store for distributed rate limiting
  store: new RedisStore({
    sendCommand: (...args: string[]) => redisClient.sendCommand(args),
  }),
});

// Strict rate limiter for auth routes
export const authLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 5, // 5 attempts per hour
  message: {
    success: false,
    message: 'Too many login attempts, please try again after an hour.',
  },
});

// Custom rate limiter factory
export const createRateLimiter = (windowMs: number, max: number) => {
  return rateLimit({
    windowMs,
    max,
    message: {
      success: false,
      message: 'Rate limit exceeded.',
    },
  });
};
```

### File Upload Middleware

```typescript
// src/utils/middleware/upload.middleware.ts
import multer, { FileFilterCallback } from 'multer';
import path from 'path';
import { Request } from 'express';
import { AppError } from '@utils/handlers/appError';

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${uniqueSuffix}${ext}`);
  },
});

// Memory storage (for processing before saving)
const memoryStorage = multer.memoryStorage();

// File filter
const imageFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: FileFilterCallback
): void => {
  const allowedMimes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  
  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Only image files are allowed', 400) as any, false);
  }
};

// Upload configurations
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
  },
});

export const uploadImages = multer({
  storage,
  fileFilter: imageFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 10, // Max 10 files
  },
});

// Usage in routes:
// router.post('/upload', uploadImage.single('photo'), controller.upload);
// router.post('/gallery', uploadImages.array('images', 10), controller.uploadGallery);
```

### CORS Configuration

```typescript
// src/utils/middleware/cors.middleware.ts
import cors from 'cors';

const allowedOrigins = [
  'http://localhost:3000',
  'https://yourdomain.com',
  process.env.FRONTEND_URL,
].filter(Boolean) as string[];

export const corsOptions: cors.CorsOptions = {
  origin: (origin, callback) => {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);
    
    if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count'],
  maxAge: 86400, // 24 hours
};

// Usage: app.use(cors(corsOptions));
```

### Compression & Security Middleware

```typescript
// src/app.ts
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import mongoSanitize from 'express-mongo-sanitize';
import hpp from 'hpp';

const app = express();

// Security headers
app.use(helmet());

// Prevent NoSQL injection
app.use(mongoSanitize());

// Prevent parameter pollution
app.use(hpp({
  whitelist: ['price', 'rating', 'category'], // Allow duplicates for these
}));

// Compress responses
app.use(compression({
  filter: (req, res) => {
    if (req.headers['x-no-compression']) {
      return false;
    }
    return compression.filter(req, res);
  },
  level: 6,
}));

// Body parsing with limits
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));
```

**Key Concepts:**
- Middleware executes in order of registration
- Always call `next()` to pass control to the next middleware
- Use third-party middleware for common tasks (helmet, cors, compression)
- Create custom middleware for application-specific logic
- Apply middleware globally or to specific routes

---

## 12. API Features

**Common API Features:**

Modern APIs need pagination, filtering, sorting, and field selection to handle large datasets efficiently.

### API Features Class

```typescript
// src/utils/features/apiFeatures.ts
import { Query, Document } from 'mongoose';

interface QueryString {
  page?: string;
  limit?: string;
  sort?: string;
  fields?: string;
  [key: string]: any;
}

export class APIFeatures<T extends Document> {
  public query: Query<T[], T>;
  public queryString: QueryString;
  public filterQuery: Record<string, any> = {};

  constructor(query: Query<T[], T>, queryString: QueryString) {
    this.query = query;
    this.queryString = queryString;
  }

  // Filter by query parameters
  filter(): this {
    const queryObj = { ...this.queryString };
    const excludedFields = ['page', 'sort', 'limit', 'fields', 'search'];
    excludedFields.forEach((el) => delete queryObj[el]);

    // Advanced filtering: gte, gt, lte, lt, ne
    let queryStr = JSON.stringify(queryObj);
    queryStr = queryStr.replace(
      /\b(gte|gt|lte|lt|ne|in|nin)\b/g,
      (match) => `$${match}`
    );

    this.filterQuery = JSON.parse(queryStr);
    this.query = this.query.find(this.filterQuery);

    return this;
  }

  // Sort results
  sort(): this {
    if (this.queryString.sort) {
      // Convert comma-separated to space-separated for Mongoose
      const sortBy = this.queryString.sort.split(',').join(' ');
      this.query = this.query.sort(sortBy);
    } else {
      // Default sort by newest first
      this.query = this.query.sort('-createdAt');
    }

    return this;
  }

  // Select specific fields
  limitFields(): this {
    if (this.queryString.fields) {
      const fields = this.queryString.fields.split(',').join(' ');
      this.query = this.query.select(fields);
    } else {
      // Exclude __v by default
      this.query = this.query.select('-__v');
    }

    return this;
  }

  // Pagination
  paginate(): this {
    const page = Math.max(1, parseInt(this.queryString.page || '1', 10));
    const limit = Math.min(100, Math.max(1, parseInt(this.queryString.limit || '10', 10)));
    const skip = (page - 1) * limit;

    this.query = this.query.skip(skip).limit(limit);

    return this;
  }

  // Text search
  search(searchFields: string[]): this {
    if (this.queryString.search) {
      const searchRegex = new RegExp(this.queryString.search, 'i');
      const searchConditions = searchFields.map((field) => ({
        [field]: searchRegex,
      }));
      this.query = this.query.find({ $or: searchConditions });
    }

    return this;
  }
}
```

### Using API Features in Service

```typescript
// src/modules/product/product.service.ts
import { APIFeatures } from '@utils/features/apiFeatures';
import { Product, IProduct } from '@database/models/product.model';

interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}

class ProductService {
  async findAll(queryParams: any): Promise<PaginatedResult<IProduct>> {
    // Build query with features
    const features = new APIFeatures(Product.find(), queryParams)
      .search(['name', 'description']) // Search in name and description
      .filter()  // Apply filters
      .sort()    // Apply sorting
      .limitFields(); // Select fields

    // Get total count before pagination
    const total = await Product.countDocuments(features.filterQuery);

    // Apply pagination
    features.paginate();

    // Execute query
    const products = await features.query.populate('category', 'name slug');

    // Calculate pagination info
    const page = parseInt(queryParams.page || '1', 10);
    const limit = parseInt(queryParams.limit || '10', 10);
    const pages = Math.ceil(total / limit);

    return {
      data: products,
      pagination: {
        page,
        limit,
        total,
        pages,
        hasNextPage: page < pages,
        hasPrevPage: page > 1,
      },
    };
  }
}
```

### Query Examples

```bash
# Basic pagination
GET /api/products?page=2&limit=20

# Sorting (ascending)
GET /api/products?sort=price

# Sorting (descending, prefix with -)
GET /api/products?sort=-price

# Multiple sort fields
GET /api/products?sort=-price,name

# Field selection
GET /api/products?fields=name,price,category

# Filtering (exact match)
GET /api/products?category=electronics

# Filtering (comparison operators)
GET /api/products?price[gte]=100&price[lte]=500

# Filtering (multiple values)
GET /api/products?status[in]=active,featured

# Text search
GET /api/products?search=laptop

# Combined query
GET /api/products?category=electronics&price[gte]=100&sort=-rating&page=1&limit=10&fields=name,price,rating
```

### Pagination Response Format

```typescript
// Controller response
res.status(200).json({
  success: true,
  results: products.length,
  data: products,
  pagination: {
    page: 1,
    limit: 10,
    total: 150,
    pages: 15,
    hasNextPage: true,
    hasPrevPage: false,
  },
});

// Add pagination headers (optional)
res.set({
  'X-Total-Count': total.toString(),
  'X-Page-Count': pages.toString(),
  'X-Current-Page': page.toString(),
  'X-Per-Page': limit.toString(),
});
```

### Cursor-Based Pagination (Alternative)

```typescript
// For large datasets, cursor-based pagination is more efficient
interface CursorPaginationParams {
  cursor?: string;
  limit?: number;
}

async function findWithCursor(params: CursorPaginationParams) {
  const limit = params.limit || 10;
  const query: any = {};

  if (params.cursor) {
    // Cursor is the _id of the last item
    query._id = { $gt: params.cursor };
  }

  const items = await Product.find(query)
    .sort({ _id: 1 })
    .limit(limit + 1); // Fetch one extra to check if there's more

  const hasNextPage = items.length > limit;
  if (hasNextPage) {
    items.pop(); // Remove the extra item
  }

  return {
    data: items,
    nextCursor: hasNextPage ? items[items.length - 1]._id : null,
    hasNextPage,
  };
}
```

**Key Concepts:**
- Pagination prevents loading entire datasets at once
- Filtering allows clients to request specific subsets
- Sorting gives clients control over result ordering
- Field selection reduces response payload size
- Use offset pagination for small datasets, cursor for large
- Always set maximum limits to prevent abuse

---

## 13. Redis & Caching Strategies

**What is Redis?**

Redis is an in-memory data store used as a database, cache, and message broker. It's essential for high-performance applications needing fast data access.

### Redis Connection Setup

```typescript
// src/utils/services/redis.service.ts
import Redis from 'ioredis';

class RedisService {
  private client: Redis;
  private isConnected: boolean = false;

  constructor() {
    this.client = new Redis({
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0', 10),
      retryStrategy: (times) => {
        if (times > 3) {
          console.error('Redis connection failed after 3 attempts');
          return null;
        }
        return Math.min(times * 200, 2000);
      },
      maxRetriesPerRequest: 3,
    });

    this.client.on('connect', () => {
      this.isConnected = true;
      console.log('✅ Redis connected');
    });

    this.client.on('error', (err) => {
      this.isConnected = false;
      console.error('Redis error:', err.message);
    });

    this.client.on('close', () => {
      this.isConnected = false;
      console.log('Redis connection closed');
    });
  }

  // Basic operations
  async get(key: string): Promise<string | null> {
    return this.client.get(key);
  }

  async set(key: string, value: string): Promise<'OK'> {
    return this.client.set(key, value);
  }

  async setEx(key: string, seconds: number, value: string): Promise<'OK'> {
    return this.client.setex(key, seconds, value);
  }

  async del(...keys: string[]): Promise<number> {
    if (keys.length === 0) return 0;
    return this.client.del(...keys);
  }

  async exists(key: string): Promise<number> {
    return this.client.exists(key);
  }

  async expire(key: string, seconds: number): Promise<number> {
    return this.client.expire(key, seconds);
  }

  async ttl(key: string): Promise<number> {
    return this.client.ttl(key);
  }

  async keys(pattern: string): Promise<string[]> {
    return this.client.keys(pattern);
  }

  async flushDb(): Promise<'OK'> {
    return this.client.flushdb();
  }

  // JSON helpers
  async getJSON<T>(key: string): Promise<T | null> {
    const data = await this.get(key);
    if (!data) return null;
    try {
      return JSON.parse(data) as T;
    } catch {
      return null;
    }
  }

  async setJSON(key: string, value: any, ttl?: number): Promise<'OK'> {
    const json = JSON.stringify(value);
    if (ttl) {
      return this.setEx(key, ttl, json);
    }
    return this.set(key, json);
  }

  // Hash operations
  async hGet(key: string, field: string): Promise<string | null> {
    return this.client.hget(key, field);
  }

  async hSet(key: string, field: string, value: string): Promise<number> {
    return this.client.hset(key, field, value);
  }

  async hGetAll(key: string): Promise<Record<string, string>> {
    return this.client.hgetall(key);
  }

  async hDel(key: string, ...fields: string[]): Promise<number> {
    return this.client.hdel(key, ...fields);
  }

  // List operations
  async lPush(key: string, ...values: string[]): Promise<number> {
    return this.client.lpush(key, ...values);
  }

  async rPush(key: string, ...values: string[]): Promise<number> {
    return this.client.rpush(key, ...values);
  }

  async lRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.lrange(key, start, stop);
  }

  // Set operations
  async sAdd(key: string, ...members: string[]): Promise<number> {
    return this.client.sadd(key, ...members);
  }

  async sMembers(key: string): Promise<string[]> {
    return this.client.smembers(key);
  }

  async sIsMember(key: string, member: string): Promise<number> {
    return this.client.sismember(key, member);
  }

  // Sorted set operations
  async zAdd(key: string, score: number, member: string): Promise<number> {
    return this.client.zadd(key, score, member);
  }

  async zRange(key: string, start: number, stop: number): Promise<string[]> {
    return this.client.zrange(key, start, stop);
  }

  async zRangeByScore(key: string, min: number, max: number): Promise<string[]> {
    return this.client.zrangebyscore(key, min, max);
  }

  // Pub/Sub
  async publish(channel: string, message: string): Promise<number> {
    return this.client.publish(channel, message);
  }

  subscribe(channel: string, callback: (message: string) => void): void {
    const subscriber = this.client.duplicate();
    subscriber.subscribe(channel);
    subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        callback(message);
      }
    });
  }

  // Increment/Decrement
  async incr(key: string): Promise<number> {
    return this.client.incr(key);
  }

  async incrBy(key: string, increment: number): Promise<number> {
    return this.client.incrby(key, increment);
  }

  async decr(key: string): Promise<number> {
    return this.client.decr(key);
  }

  // Get client for advanced operations
  getClient(): Redis {
    return this.client;
  }

  isReady(): boolean {
    return this.isConnected;
  }

  async disconnect(): Promise<void> {
    await this.client.quit();
  }
}

export const redisService = new RedisService();
export const redisClient = redisService.getClient();
```

### Cache-Aside Pattern (Read-Through)

The most common caching pattern - check cache first, then database:

```typescript
// src/modules/product/product.service.ts

class ProductService {
  private readonly CACHE_PREFIX = 'product:';
  private readonly CACHE_TTL = 3600; // 1 hour

  async findById(id: string): Promise<IProduct> {
    const cacheKey = `${this.CACHE_PREFIX}${id}`;
    
    // 1. Check cache first
    const cached = await redisService.getJSON<IProduct>(cacheKey);
    if (cached) {
      console.log('Cache HIT:', cacheKey);
      return cached;
    }
    
    console.log('Cache MISS:', cacheKey);
    
    // 2. Fetch from database
    const product = await Product.findById(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    // 3. Store in cache
    await redisService.setJSON(cacheKey, product, this.CACHE_TTL);
    
    return product;
  }

  async update(id: string, data: UpdateProductDTO): Promise<IProduct> {
    const product = await Product.findByIdAndUpdate(id, data, {
      new: true,
      runValidators: true,
    });
    
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    // Invalidate cache on update
    await redisService.del(`${this.CACHE_PREFIX}${id}`);
    await this.invalidateListCache();
    
    return product;
  }

  async remove(id: string): Promise<void> {
    const product = await Product.findByIdAndDelete(id);
    if (!product) {
      throw new AppError('Product not found', 404);
    }
    
    // Invalidate cache on delete
    await redisService.del(`${this.CACHE_PREFIX}${id}`);
    await this.invalidateListCache();
  }

  private async invalidateListCache(): Promise<void> {
    const keys = await redisService.keys('products:list:*');
    if (keys.length > 0) {
      await redisService.del(...keys);
    }
  }
}
```

### Write-Through Cache Pattern

Update cache immediately when writing to database:

```typescript
async create(data: CreateProductDTO): Promise<IProduct> {
  // 1. Write to database
  const product = await Product.create(data);
  
  // 2. Write to cache immediately
  await redisService.setJSON(
    `${this.CACHE_PREFIX}${product._id}`,
    product,
    this.CACHE_TTL
  );
  
  // 3. Invalidate list caches
  await this.invalidateListCache();
  
  return product;
}
```

### Cache Invalidation Strategies

```typescript
// Strategy 1: Delete on mutation (most common)
async invalidateProduct(id: string): Promise<void> {
  await redisService.del(`product:${id}`);
}

// Strategy 2: Tag-based invalidation
const CACHE_TAGS = {
  PRODUCTS: 'tag:products',
  CATEGORIES: 'tag:categories',
};

async cacheWithTags<T>(
  key: string,
  data: T,
  tags: string[],
  ttl: number
): Promise<void> {
  // Store data
  await redisService.setJSON(key, data, ttl);
  
  // Add key to each tag set
  for (const tag of tags) {
    await redisService.sAdd(tag, key);
  }
}

async invalidateByTag(tag: string): Promise<void> {
  const keys = await redisService.sMembers(tag);
  if (keys.length > 0) {
    await redisService.del(...keys);
    await redisService.del(tag);
  }
}

// Strategy 3: Pattern-based invalidation
async invalidatePattern(pattern: string): Promise<void> {
  const keys = await redisService.keys(pattern);
  if (keys.length > 0) {
    await redisService.del(...keys);
  }
}

// Usage
await invalidatePattern('products:*'); // Invalidate all product caches
await invalidateByTag(CACHE_TAGS.PRODUCTS); // Invalidate by tag
```

### Session Storage with Redis

```typescript
// src/config/session.ts
import session from 'express-session';
import RedisStore from 'connect-redis';
import { redisClient } from '@utils/services/redis.service';

export const sessionConfig = session({
  store: new RedisStore({
    client: redisClient,
    prefix: 'session:',
    ttl: 86400, // 24 hours
  }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
});

// Usage in app.ts
// app.use(sessionConfig);
```

### Rate Limiting with Redis

```typescript
// src/utils/middleware/rateLimitRedis.middleware.ts
import { Request, Response, NextFunction } from 'express';
import { redisService } from '@utils/services/redis.service';
import { AppError } from '@utils/handlers/appError';

interface RateLimitOptions {
  windowMs: number;
  max: number;
  keyPrefix?: string;
}

export const rateLimitRedis = (options: RateLimitOptions) => {
  const { windowMs, max, keyPrefix = 'ratelimit:' } = options;
  const windowSec = Math.ceil(windowMs / 1000);

  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const key = `${keyPrefix}${req.ip}`;
    
    try {
      const current = await redisService.incr(key);
      
      // Set expiry on first request
      if (current === 1) {
        await redisService.expire(key, windowSec);
      }
      
      // Get remaining TTL
      const ttl = await redisService.ttl(key);
      
      // Set rate limit headers
      res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': Math.max(0, max - current).toString(),
        'X-RateLimit-Reset': (Date.now() + ttl * 1000).toString(),
      });
      
      if (current > max) {
        throw new AppError('Too many requests, please try again later', 429);
      }
      
      next();
    } catch (error) {
      next(error);
    }
  };
};

// Sliding window rate limiter
export const slidingWindowRateLimit = async (
  key: string,
  limit: number,
  windowSec: number
): Promise<boolean> => {
  const now = Date.now();
  const windowStart = now - windowSec * 1000;
  
  // Remove old entries
  await redisService.getClient().zremrangebyscore(key, 0, windowStart);
  
  // Count current entries
  const count = await redisService.getClient().zcard(key);
  
  if (count >= limit) {
    return false;
  }
  
  // Add new entry
  await redisService.zAdd(key, now, `${now}`);
  await redisService.expire(key, windowSec);
  
  return true;
};
```

### Queue Management with Bull

```typescript
// src/utils/services/queue.service.ts
import Bull, { Job, Queue } from 'bull';

// Create queues
export const emailQueue = new Bull('email', {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 100,
    removeOnFail: 50,
  },
});

export const notificationQueue = new Bull('notifications', {
  redis: process.env.REDIS_URL,
});

// Add job to queue
interface EmailJobData {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export const addEmailJob = async (data: EmailJobData): Promise<Job> => {
  return emailQueue.add('send-email', data, {
    priority: 1,
    delay: 0,
  });
};

// Process jobs
emailQueue.process('send-email', async (job: Job<EmailJobData>) => {
  const { to, subject, template, data } = job.data;
  
  console.log(`Processing email job ${job.id} to ${to}`);
  
  // Send email logic here
  await sendEmail(to, subject, template, data);
  
  return { sent: true, to };
});

// Job events
emailQueue.on('completed', (job, result) => {
  console.log(`Job ${job.id} completed:`, result);
});

emailQueue.on('failed', (job, err) => {
  console.error(`Job ${job.id} failed:`, err.message);
});

// Scheduled/recurring jobs
emailQueue.add(
  'daily-report',
  { type: 'daily' },
  {
    repeat: {
      cron: '0 9 * * *', // Every day at 9 AM
    },
  }
);
```

### Pub/Sub for Real-Time Features

```typescript
// src/utils/services/pubsub.service.ts
import { redisService } from './redis.service';
import Redis from 'ioredis';

class PubSubService {
  private publisher: Redis;
  private subscriber: Redis;

  constructor() {
    this.publisher = redisService.getClient().duplicate();
    this.subscriber = redisService.getClient().duplicate();
  }

  async publish(channel: string, message: any): Promise<void> {
    const payload = JSON.stringify(message);
    await this.publisher.publish(channel, payload);
  }

  subscribe(channel: string, handler: (message: any) => void): void {
    this.subscriber.subscribe(channel);
    this.subscriber.on('message', (ch, message) => {
      if (ch === channel) {
        try {
          const parsed = JSON.parse(message);
          handler(parsed);
        } catch {
          handler(message);
        }
      }
    });
  }

  unsubscribe(channel: string): void {
    this.subscriber.unsubscribe(channel);
  }
}

export const pubSubService = new PubSubService();

// Usage example: Real-time notifications
// Publisher (in service)
await pubSubService.publish('notifications', {
  userId: user._id,
  type: 'NEW_ORDER',
  data: { orderId: order._id },
});

// Subscriber (in WebSocket handler)
pubSubService.subscribe('notifications', (message) => {
  const { userId, type, data } = message;
  // Send to connected WebSocket clients
  io.to(userId).emit(type, data);
});
```

### Distributed Locks with Redis

```typescript
// src/utils/services/lock.service.ts
import { redisService } from './redis.service';

class LockService {
  async acquireLock(
    resource: string,
    ttlMs: number = 10000
  ): Promise<string | null> {
    const lockKey = `lock:${resource}`;
    const lockValue = `${Date.now()}-${Math.random()}`;
    
    // SET NX with expiry
    const result = await redisService.getClient().set(
      lockKey,
      lockValue,
      'PX',
      ttlMs,
      'NX'
    );
    
    return result === 'OK' ? lockValue : null;
  }

  async releaseLock(resource: string, lockValue: string): Promise<boolean> {
    const lockKey = `lock:${resource}`;
    
    // Only release if we own the lock
    const script = `
      if redis.call("get", KEYS[1]) == ARGV[1] then
        return redis.call("del", KEYS[1])
      else
        return 0
      end
    `;
    
    const result = await redisService.getClient().eval(
      script, 1, lockKey, lockValue
    );
    
    return result === 1;
  }

  async withLock<T>(
    resource: string,
    fn: () => Promise<T>,
    ttlMs: number = 10000
  ): Promise<T> {
    const lockValue = await this.acquireLock(resource, ttlMs);
    
    if (!lockValue) {
      throw new Error(`Could not acquire lock for ${resource}`);
    }
    
    try {
      return await fn();
    } finally {
      await this.releaseLock(resource, lockValue);
    }
  }
}

export const lockService = new LockService();

// Usage: Prevent double processing
await lockService.withLock(`order:${orderId}`, async () => {
  await processOrder(orderId);
});
```

### Caching Best Practices

```typescript
// Cache key naming convention
const CACHE_KEYS = {
  user: (id: string) => `user:${id}`,
  userProfile: (id: string) => `user:${id}:profile`,
  userOrders: (id: string, page: number) => `user:${id}:orders:page:${page}`,
  product: (id: string) => `product:${id}`,
  productList: (query: string) => `products:list:${query}`,
  session: (id: string) => `session:${id}`,
  rateLimit: (ip: string) => `ratelimit:${ip}`,
};

// TTL constants
const CACHE_TTL = {
  SHORT: 60,           // 1 minute
  MEDIUM: 300,         // 5 minutes
  LONG: 3600,          // 1 hour
  DAY: 86400,          // 24 hours
  WEEK: 604800,        // 7 days
};

// Cache warmer
async function warmCache(): Promise<void> {
  console.log('Warming cache...');
  
  // Pre-load frequently accessed data
  const popularProducts = await Product.find().sort('-views').limit(100);
  
  for (const product of popularProducts) {
    await redisService.setJSON(
      CACHE_KEYS.product(product._id.toString()),
      product,
      CACHE_TTL.LONG
    );
  }
  
  console.log(`Cache warmed with ${popularProducts.length} products`);
}
```

**Key Concepts:**
- Redis is in-memory, extremely fast for read/write operations
- Use Cache-Aside pattern for most caching scenarios
- Always set TTL to prevent stale data and memory issues
- Invalidate cache on mutations (create, update, delete)
- Use Redis for sessions, rate limiting, and queues
- Pub/Sub enables real-time features across servers
- Distributed locks prevent race conditions
- Use consistent key naming conventions

---

## 14. Testing Node.js Applications

**Testing Strategy:**

A good test suite includes unit tests, integration tests, and end-to-end tests.

### Jest Configuration

```typescript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/tests'],
  testMatch: ['**/*.test.ts', '**/*.spec.ts'],
  transform: {
    '^.+\\.tsx?$': 'ts-jest',
  },
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
    '^@modules/(.*)$': '<rootDir>/src/modules/$1',
    '^@utils/(.*)$': '<rootDir>/src/utils/$1',
    '^@database/(.*)$': '<rootDir>/src/database/$1',
  },
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/**/*.d.ts',
    '!src/types/**',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  setupFilesAfterEnv: ['<rootDir>/tests/setup.ts'],
  globalSetup: '<rootDir>/tests/globalSetup.ts',
  globalTeardown: '<rootDir>/tests/globalTeardown.ts',
};
```

### Unit Testing Services

```typescript
// tests/unit/product.service.test.ts
import { ProductService } from '@modules/product/product.service';
import { Product } from '@database/models/product.model';
import { AppError } from '@utils/handlers/appError';

// Mock the database model
jest.mock('@database/models/product.model');

describe('ProductService', () => {
  let productService: ProductService;

  beforeEach(() => {
    productService = new ProductService();
    jest.clearAllMocks();
  });

  describe('findById', () => {
    it('should return a product when found', async () => {
      const mockProduct = {
        _id: '123',
        name: 'Test Product',
        price: 100,
      };

      (Product.findById as jest.Mock).mockResolvedValue(mockProduct);

      const result = await productService.findById('123');

      expect(Product.findById).toHaveBeenCalledWith('123');
      expect(result).toEqual(mockProduct);
    });

    it('should throw AppError when product not found', async () => {
      (Product.findById as jest.Mock).mockResolvedValue(null);

      await expect(productService.findById('456')).rejects.toThrow(AppError);
      await expect(productService.findById('456')).rejects.toThrow('Product not found');
    });
  });

  describe('create', () => {
    it('should create a new product', async () => {
      const productData = {
        name: 'New Product',
        price: 200,
        description: 'Test',
        stock: 10,
        category: 'cat123',
      };
      const mockCreated = { _id: 'new123', ...productData };

      (Product.exists as jest.Mock).mockResolvedValue(false);
      (Product.create as jest.Mock).mockResolvedValue(mockCreated);

      const result = await productService.create(productData);

      expect(Product.create).toHaveBeenCalledWith(productData);
      expect(result).toEqual(mockCreated);
    });
  });
});
```

### Integration Testing with Supertest

```typescript
// tests/integration/product.routes.test.ts
import request from 'supertest';
import mongoose from 'mongoose';
import app from '../../src/app';
import { Product } from '@database/models/product.model';
import { User } from '@database/models/user.model';
import { generateTestToken } from '../helpers/auth';

describe('Product API', () => {
  let authToken: string;
  let testProduct: any;

  beforeAll(async () => {
    // Connect to test database
    await mongoose.connect(process.env.TEST_DATABASE_URL!);
    
    // Create test user and token
    const user = await User.create({
      name: 'Test Admin',
      email: 'admin@test.com',
      password: 'password123',
      role: 'admin',
    });
    authToken = generateTestToken(user);
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.disconnect();
  });

  beforeEach(async () => {
    await Product.deleteMany({});
    testProduct = await Product.create({
      name: 'Test Product',
      description: 'Test description',
      price: 100,
      stock: 10,
      category: new mongoose.Types.ObjectId(),
    });
  });

  describe('GET /api/v1/products', () => {
    it('should return all products', async () => {
      const res = await request(app)
        .get('/api/v1/products')
        .expect(200);

      expect(res.body.success).toBe(true);
      expect(res.body.data).toHaveLength(1);
      expect(res.body.data[0].name).toBe('Test Product');
    });

    it('should paginate results', async () => {
      const res = await request(app)
        .get('/api/v1/products?page=1&limit=5')
        .expect(200);

      expect(res.body.pagination).toBeDefined();
      expect(res.body.pagination.page).toBe(1);
      expect(res.body.pagination.limit).toBe(5);
    });
  });

  describe('POST /api/v1/products', () => {
    it('should create a product when authenticated as admin', async () => {
      const newProduct = {
        name: 'New Product',
        description: 'New description',
        price: 200,
        stock: 5,
        category: new mongoose.Types.ObjectId().toString(),
      };

      const res = await request(app)
        .post('/api/v1/products')
        .set('Authorization', `Bearer ${authToken}`)
        .send(newProduct)
        .expect(201);

      expect(res.body.success).toBe(true);
      expect(res.body.data.name).toBe('New Product');
    });

    it('should return 401 without authentication', async () => {
      const res = await request(app)
        .post('/api/v1/products')
        .send({ name: 'Test' })
        .expect(401);

      expect(res.body.success).toBe(false);
    });
  });
});
```

### Mocking External Services

```typescript
// tests/mocks/redis.mock.ts
export const mockRedisService = {
  get: jest.fn(),
  set: jest.fn(),
  setEx: jest.fn(),
  del: jest.fn(),
  getJSON: jest.fn(),
  setJSON: jest.fn(),
  keys: jest.fn().mockResolvedValue([]),
};

jest.mock('@utils/services/redis.service', () => ({
  redisService: mockRedisService,
}));

// tests/mocks/email.mock.ts
export const mockEmailService = {
  sendEmail: jest.fn().mockResolvedValue(true),
  sendPasswordReset: jest.fn().mockResolvedValue(true),
  sendWelcome: jest.fn().mockResolvedValue(true),
};

jest.mock('@utils/services/email.service', () => ({
  emailService: mockEmailService,
}));
```

**Key Concepts:**
- Write unit tests for services (business logic)
- Write integration tests for API endpoints
- Use in-memory MongoDB for testing (mongodb-memory-server)
- Mock external dependencies (Redis, Email, etc.)
- Aim for 70%+ code coverage
- Test both success and error scenarios

---

## 15. Security Best Practices

### Input Sanitization

```typescript
// XSS Prevention
import xss from 'xss';

const sanitizeInput = (input: string): string => {
  return xss(input.trim());
};

// NoSQL Injection Prevention (express-mongo-sanitize)
import mongoSanitize from 'express-mongo-sanitize';
app.use(mongoSanitize());

// Parameter Pollution Prevention
import hpp from 'hpp';
app.use(hpp({ whitelist: ['price', 'rating'] }));
```

### Helmet Security Headers

```typescript
import helmet from 'helmet';

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
    },
  },
  crossOriginEmbedderPolicy: true,
  crossOriginOpenerPolicy: true,
  crossOriginResourcePolicy: { policy: 'same-site' },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true,
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
  xssFilter: true,
}));
```

### Environment Variables

```typescript
// src/config/environment.ts
import { z } from 'zod';

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']),
  PORT: z.string().transform(Number),
  DATABASE_URL: z.string().url(),
  JWT_SECRET: z.string().min(32),
  JWT_EXPIRES_IN: z.string(),
  REDIS_URL: z.string().optional(),
  FRONTEND_URL: z.string().url(),
});

// Validate on startup
const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('❌ Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const env = parsed.data;
```

### Security Checklist

| Category | Best Practice |
|----------|---------------|
| **Authentication** | Use bcrypt for password hashing (cost factor 12+) |
| **JWT** | Use short expiry (15m) with refresh tokens |
| **Headers** | Use Helmet for security headers |
| **Input** | Validate and sanitize all input |
| **Rate Limiting** | Implement on all endpoints |
| **HTTPS** | Always use TLS in production |
| **Dependencies** | Regularly audit with `npm audit` |
| **Secrets** | Never commit secrets to git |
| **Logging** | Never log sensitive data |
| **Errors** | Hide stack traces in production |

---

## 16. Logging & Monitoring

### Winston Logger

```typescript
// src/utils/services/logger.service.ts
import winston from 'winston';
import path from 'path';

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.printf(({ level, message, timestamp, stack, ...meta }) => {
    let log = `${timestamp} [${level.toUpperCase()}]: ${message}`;
    if (Object.keys(meta).length) {
      log += ` ${JSON.stringify(meta)}`;
    }
    if (stack) {
      log += `\n${stack}`;
    }
    return log;
  })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: logFormat,
  transports: [
    // Console output
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        logFormat
      ),
    }),
    // File output
    new winston.transports.File({
      filename: path.join('logs', 'error.log'),
      level: 'error',
      maxsize: 5242880, // 5MB
      maxFiles: 5,
    }),
    new winston.transports.File({
      filename: path.join('logs', 'combined.log'),
      maxsize: 5242880,
      maxFiles: 5,
    }),
  ],
});

export { logger };

// Usage
logger.info('Server started', { port: 3000 });
logger.error('Database error', { error: err.message });
logger.warn('Rate limit exceeded', { ip: req.ip });
```

### Request Logging Middleware

```typescript
// Morgan + Winston integration
import morgan from 'morgan';
import { logger } from '@utils/services/logger.service';

const stream = {
  write: (message: string) => logger.http(message.trim()),
};

app.use(morgan(':method :url :status :res[content-length] - :response-time ms', { stream }));
```

**Key Concepts:**
- Use structured logging (JSON format for production)
- Log at appropriate levels (error, warn, info, debug)
- Never log sensitive data (passwords, tokens)
- Use log rotation to manage file sizes
- Integrate with monitoring services (DataDog, New Relic)

---

## 17. Deployment & Production

### PM2 Configuration

```javascript
// ecosystem.config.js
module.exports = {
  apps: [{
    name: 'api',
    script: './dist/server.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'development',
    },
    env_production: {
      NODE_ENV: 'production',
    },
  }],
};

// Commands
// pm2 start ecosystem.config.js --env production
// pm2 reload api
// pm2 logs api
// pm2 monit
```

### Docker Configuration

```dockerfile
# Dockerfile
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .
RUN npm run build

# Production image
FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm ci --only=production

COPY --from=builder /app/dist ./dist

EXPOSE 3000

USER node

CMD ["node", "dist/server.js"]
```

```yaml
# docker-compose.yml
version: '3.8'

services:
  api:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DATABASE_URL=mongodb://mongo:27017/myapp
      - REDIS_URL=redis://redis:6379
    depends_on:
      - mongo
      - redis

  mongo:
    image: mongo:7
    volumes:
      - mongo_data:/data/db

  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data

volumes:
  mongo_data:
  redis_data:
```

### Health Check Endpoint

```typescript
// src/routes/health.routes.ts
import { Router } from 'express';
import mongoose from 'mongoose';
import { redisService } from '@utils/services/redis.service';

const router = Router();

router.get('/health', async (req, res) => {
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    checks: {
      database: mongoose.connection.readyState === 1,
      redis: redisService.isReady(),
    },
  };

  const isHealthy = Object.values(health.checks).every(Boolean);
  
  res.status(isHealthy ? 200 : 503).json(health);
});

export default router;
```

**Key Concepts:**
- Use PM2 for process management and clustering
- Docker for containerization and consistent deployments
- Implement health checks for load balancers
- Use environment-specific configurations
- Set up CI/CD pipelines for automated deployments

---

## 18. Best Practices Summary

### Architecture Guidelines

| Area | Best Practice |
|------|---------------|
| **Layers** | Strict separation: Routes → Controllers → Services |
| **Modules** | Organize by feature, not by type |
| **Dependencies** | Inject dependencies, avoid tight coupling |
| **Configuration** | Centralize in `config/`, validate on startup |
| **Types** | Define interfaces for all data structures |

### Code Organization

```text
✅ DO:
- One responsibility per file
- Co-locate related files (routes, controller, service, types)
- Use barrel exports (index.ts)
- Keep controllers thin, services thick
- Use path aliases (@modules/, @utils/)

❌ DON'T:
- Put business logic in controllers
- Access database directly from controllers
- Use `any` type unless absolutely necessary
- Create circular dependencies
- Mix HTTP concerns (req/res) in services
```

### TypeScript Patterns

```typescript
// ✅ Use strict types
interface CreateUserDTO {
  name: string;
  email: string;
  password: string;
}

// ✅ Use generics for reusable types
interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationInfo;
}

// ✅ Use enums for fixed values
enum UserRole {
  ADMIN = 'admin',
  USER = 'user',
  MODERATOR = 'moderator',
}

// ✅ Use type guards
function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}
```

### API Design Guidelines

- Use **RESTful conventions** for CRUD operations
- Return **consistent response format** across all endpoints
- Use **proper HTTP status codes**
- Implement **pagination** for list endpoints
- Version your API (`/api/v1/`)
- Document with **OpenAPI/Swagger**

### Performance Tips

- Cache frequently accessed data in Redis
- Use database indexes for common queries
- Implement connection pooling
- Compress responses (gzip)
- Use pagination and field selection
- Avoid N+1 query problems

---

## 19. Common Patterns Cheat Sheet

### CRUD Operations

```typescript
// CREATE
const create = catchAsync(async (req, res) => {
  const data = await service.create(req.body);
  res.status(201).json({ success: true, data });
});

// READ (one)
const getOne = catchAsync(async (req, res) => {
  const data = await service.findById(req.params.id);
  res.status(200).json({ success: true, data });
});

// READ (all)
const getAll = catchAsync(async (req, res) => {
  const result = await service.findAll(req.query);
  res.status(200).json({ success: true, ...result });
});

// UPDATE
const update = catchAsync(async (req, res) => {
  const data = await service.update(req.params.id, req.body);
  res.status(200).json({ success: true, data });
});

// DELETE
const remove = catchAsync(async (req, res) => {
  await service.remove(req.params.id);
  res.status(204).send();
});
```

### Authentication Flow

```typescript
// Login
const tokens = await authService.login(email, password);
res.cookie('refreshToken', tokens.refreshToken, { httpOnly: true });
res.json({ accessToken: tokens.accessToken });

// Protected route
router.get('/protected', authenticate, controller.handle);

// Admin only
router.delete('/:id', authenticate, authorize('admin'), controller.remove);
```

### Error Handling

```typescript
// Throw operational errors
throw new AppError('Resource not found', 404);

// catchAsync wrapper
export const catchAsync = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Global error handler
app.use((err, req, res, next) => {
  res.status(err.statusCode || 500).json({
    success: false,
    message: err.message,
  });
});
```

### Validation

```typescript
// Zod schema
const schema = z.object({
  body: z.object({
    name: z.string().min(2),
    email: z.string().email(),
  }),
});

// Middleware
router.post('/', validate(schema), controller.create);
```

### Caching

```typescript
// Read with cache
async findById(id: string) {
  const cached = await redis.getJSON(`item:${id}`);
  if (cached) return cached;
  
  const item = await Model.findById(id);
  await redis.setJSON(`item:${id}`, item, 3600);
  return item;
}

// Invalidate on mutation
async update(id: string, data: any) {
  const item = await Model.findByIdAndUpdate(id, data, { new: true });
  await redis.del(`item:${id}`);
  return item;
}
```

### Quick Reference

```bash
# Common Express Middleware
app.use(express.json());        # Parse JSON body
app.use(cors());                # Enable CORS
app.use(helmet());              # Security headers
app.use(compression());         # Gzip responses
app.use(morgan('dev'));         # Request logging
app.use(rateLimit(options));    # Rate limiting

# Common Status Codes
200 OK                 # Success (GET, PUT, PATCH)
201 Created            # Resource created (POST)
204 No Content         # Success, no body (DELETE)
400 Bad Request        # Validation error
401 Unauthorized       # Not authenticated
403 Forbidden          # Not authorized
404 Not Found          # Resource not found
409 Conflict           # Duplicate resource
429 Too Many Requests  # Rate limited
500 Internal Error     # Server error

# Common npm packages
express               # Web framework
mongoose             # MongoDB ODM
ioredis              # Redis client
jsonwebtoken         # JWT handling
bcryptjs             # Password hashing
zod                  # Validation
helmet               # Security headers
cors                 # CORS handling
morgan               # HTTP logging
winston              # Logging
bull                 # Job queues
```

---

## 20. Resources for Further Learning

### Official Documentation
- [Node.js Docs](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [MongoDB Docs](https://www.mongodb.com/docs/)
- [Redis Docs](https://redis.io/docs/)

### Recommended Libraries
| Category | Library | Purpose |
|----------|---------|---------|
| **Validation** | Zod, Joi | Schema validation |
| **ORM/ODM** | Mongoose, TypeORM, Prisma | Database interaction |
| **Auth** | Passport.js, jsonwebtoken | Authentication |
| **Testing** | Jest, Supertest | Unit/integration tests |
| **Logging** | Winston, Pino | Structured logging |
| **Queue** | Bull, BullMQ | Background jobs |
| **Cache** | ioredis, node-cache | Caching |
| **API Docs** | Swagger, Redoc | API documentation |

### Advanced Topics
- **Microservices Architecture** - Decomposing monoliths
- **GraphQL APIs** - Alternative to REST
- **WebSockets** - Real-time communication (Socket.io)
- **Event-Driven Architecture** - Pub/Sub patterns
- **Serverless** - AWS Lambda, Vercel Functions
- **NestJS** - Enterprise Node.js framework

### Community Resources
- [Node.js Best Practices](https://github.com/goldbergyoni/nodebestpractices)
- [Express Best Practices](https://expressjs.com/en/advanced/best-practice-security.html)
- [The Twelve-Factor App](https://12factor.net/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)

---

## Summary

This guide covered everything you need to build robust Node.js backends with TypeScript:

### Core Concepts Covered
- ✅ **Project Setup** - TypeScript configuration, ESLint, Prettier
- ✅ **Architecture** - Modular monolith, three-layer separation
- ✅ **Express Fundamentals** - Routing, middleware, typed requests
- ✅ **Database Layer** - Mongoose models, schemas, queries
- ✅ **Validation** - Joi and Zod patterns
- ✅ **Authentication** - JWT, refresh tokens, password reset
- ✅ **Authorization** - RBAC, permissions, ownership
- ✅ **Error Handling** - AppError, catchAsync, global handler
- ✅ **Middleware** - Rate limiting, CORS, file uploads
- ✅ **API Features** - Pagination, filtering, sorting
- ✅ **Redis & Caching** - Connection, patterns, queues, pub/sub
- ✅ **Testing** - Jest, Supertest, mocking
- ✅ **Security** - Headers, sanitization, environment validation
- ✅ **Deployment** - PM2, Docker, health checks

### Key Takeaways
1. **Separate concerns** - Routes handle HTTP, Services handle logic
2. **Type everything** - Interfaces for DTOs, models, and responses
3. **Validate early** - Check input before processing
4. **Cache wisely** - Redis for performance, invalidate on mutations
5. **Handle errors gracefully** - Consistent format, proper status codes
6. **Secure by default** - Helmet, rate limiting, input sanitization
7. **Test thoroughly** - Unit tests for services, integration for APIs
8. **Monitor and log** - Structured logging, health checks

---

*Last Updated: December 2024*
*This document is a comprehensive guide for Node.js backend development with TypeScript.*
