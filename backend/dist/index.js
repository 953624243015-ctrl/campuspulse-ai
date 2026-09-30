"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const morgan_1 = __importDefault(require("morgan"));
const compression_1 = __importDefault(require("compression"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const rateLimiter_1 = require("./middleware/rateLimiter");
const errorHandler_1 = require("./middleware/errorHandler");
const logger_1 = __importDefault(require("./utils/logger"));
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const students_1 = __importDefault(require("./routes/students"));
const faculty_1 = __importDefault(require("./routes/faculty"));
const complaints_1 = __importDefault(require("./routes/complaints"));
const events_1 = __importDefault(require("./routes/events"));
const admin_1 = __importDefault(require("./routes/admin"));
const hod_1 = __importDefault(require("./routes/hod"));
const principal_1 = __importDefault(require("./routes/principal"));
const notifications_1 = __importDefault(require("./routes/notifications"));
const ai_1 = __importDefault(require("./routes/ai"));
const campus_1 = __importDefault(require("./routes/campus"));
const app = (0, express_1.default)();
const PORT = parseInt(process.env.PORT || '5000', 10);
// ─── Security & Core Middleware ─────────────────────────────────────────────
app.use((0, helmet_1.default)({
    crossOriginEmbedderPolicy: false,
    contentSecurityPolicy: false,
}));
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use((0, compression_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '10mb' }));
if (process.env.NODE_ENV !== 'test') {
    app.use((0, morgan_1.default)('combined', {
        stream: { write: (msg) => logger_1.default.info(msg.trim()) },
    }));
}
app.use('/api', rateLimiter_1.globalRateLimiter);
// ─── Health Check ────────────────────────────────────────────────────────────
app.get('/health', (_, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString(), version: '1.0.0' });
});
// ─── API Routes ──────────────────────────────────────────────────────────────
app.use('/api/auth', auth_1.default);
app.use('/api/students', students_1.default);
app.use('/api/faculty', faculty_1.default);
app.use('/api/complaints', complaints_1.default);
app.use('/api/events', events_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/hod', hod_1.default);
app.use('/api/principal', principal_1.default);
app.use('/api/notifications', notifications_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/campus', campus_1.default);
// ─── Error Handling ──────────────────────────────────────────────────────────
app.use(errorHandler_1.notFoundHandler);
app.use(errorHandler_1.errorHandler);
// ─── Start Server ────────────────────────────────────────────────────────────
app.listen(PORT, () => {
    logger_1.default.info(`🚀 CampusPulse AI Backend running on port ${PORT}`);
    logger_1.default.info(`   Environment: ${process.env.NODE_ENV}`);
    logger_1.default.info(`   API Base:    http://localhost:${PORT}/api`);
});
exports.default = app;
//# sourceMappingURL=index.js.map