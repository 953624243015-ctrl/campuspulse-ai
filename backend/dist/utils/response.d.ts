import { Response } from 'express';
import { ApiResponse } from '../types';
export declare const sendSuccess: <T>(res: Response, data: T, message?: string, statusCode?: number, meta?: ApiResponse["meta"]) => Response;
export declare const sendError: (res: Response, error: string, statusCode?: number, message?: string) => Response;
export declare const sendNotFound: (res: Response, resource?: string) => Response;
export declare const sendUnauthorized: (res: Response, message?: string) => Response;
export declare const sendForbidden: (res: Response, message?: string) => Response;
export declare const sendValidationError: (res: Response, errors: unknown) => Response;
export declare const getPagination: (page?: unknown, limit?: unknown) => {
    page: number;
    limit: number;
    offset: number;
};
export declare const buildMeta: (page: number, limit: number, total: number) => ApiResponse["meta"];
//# sourceMappingURL=response.d.ts.map