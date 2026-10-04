import swaggerJsdoc from 'swagger-jsdoc';

// Swagger/OpenAPI configuration for SyncForge
const options: swaggerJsdoc.Options = {
    definition: {
        // OpenAPI version
        openapi: '3.0.0',

        // API metadata
        info: {
            title: 'SyncForge API',
            version: '1.0.0',
            description: 'SyncForge is a collaborative project management platform. This documentation covers authentication, workspace management, project management, task tracking, comments, and activity logs.',
        },

        // Server configuration
        servers: [
            {
                url: '/api/v1',
                description: 'SyncForge API v1',
            },
        ],

        // Security scheme for JWT Bearer authentication
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                    description: 'Enter your JWT token obtained from the /auth/login endpoint.',
                },
            },

            // Reusable schemas that match the actual Prisma models and API responses
            schemas: {
                User: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'John Doe' },
                        email: { type: 'string', example: 'john@example.com' },
                        isEmailVerified: { type: 'boolean', example: false },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },

                Workspace: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Design Team' },
                        description: { type: 'string', nullable: true, example: 'Our design workspace' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },

                Task: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        projectId: { type: 'integer', example: 1 },
                        title: { type: 'string', example: 'Setup database' },
                        description: { type: 'string', nullable: true, example: 'Initialize PostgreSQL database' },
                        status: { type: 'string', enum: ['Todo', 'In Progress', 'Review', 'Done'], example: 'Todo' },
                        priority: { type: 'string', enum: ['Low', 'Medium', 'High', 'Urgent'], example: 'Medium' },
                        labels: { type: 'array', nullable: true, items: { type: 'string' }, example: ['backend', 'setup'] },
                        dueDate: { type: 'string', format: 'date-time', nullable: true },
                        assigneeId: { type: 'integer', nullable: true, example: null },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },

                Comment: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        taskId: { type: 'integer', example: 1 },
                        userId: { type: 'integer', example: 1 },
                        content: { type: 'string', example: 'This looks good!' },
                        createdAt: { type: 'string', format: 'date-time' },
                        updatedAt: { type: 'string', format: 'date-time' },
                    },
                },

                ActivityLog: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        workspaceId: { type: 'integer', nullable: true, example: 1 },
                        projectId: { type: 'integer', nullable: true, example: 1 },
                        actorId: { type: 'integer', example: 1 },
                        action: { type: 'string', example: 'TASK_CREATED' },
                        targetEntity: { type: 'string', example: 'Task' },
                        targetId: { type: 'integer', example: 5 },
                        metadata: { type: 'object', nullable: true, example: { title: 'Setup database' } },
                        createdAt: { type: 'string', format: 'date-time' },
                    },
                },

                Pagination: {
                    type: 'object',
                    properties: {
                        page: { type: 'integer', example: 1 },
                        limit: { type: 'integer', example: 20 },
                        total: { type: 'integer', example: 50 },
                        totalPages: { type: 'integer', example: 3 },
                    },
                },

                Error: {
                    type: 'object',
                    properties: {
                        error: { type: 'string', example: 'ErrorType' },
                        message: { type: 'string', example: 'Human readable message' },
                    },
                },
            },
        },

        // Apply JWT auth globally to all endpoints by default
        security: [{ bearerAuth: [] }],
    },

    // Tell swagger-jsdoc which files contain the route annotations
    apis: [
        './src/routes/auth.routes.ts',
        './src/routes/workspace.routes.ts',
        './src/routes/project.routes.ts',
        './src/routes/task.routes.ts',
        './src/routes/comment.routes.ts',
    ],
};

// Generate the OpenAPI specification object
export const swaggerSpec = swaggerJsdoc(options);
