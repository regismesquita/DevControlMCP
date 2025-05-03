import {
    parseEditBlock,
    performSearchReplace
} from '../tools/edit.js';

import {
    EditBlockArgsSchema
} from '../tools/schemas.js';

import {ServerResult} from '../types.js';
import {capture, withTimeout} from '../utils.js';
import {createErrorResponse} from '../error-handlers.js';

/**
 * Handle edit_block command
 */
export async function handleEditBlock(args: unknown): Promise<ServerResult> {
    const parsed = EditBlockArgsSchema.parse(args);
    const {filePath, searchReplace, error} = await parseEditBlock(parsed.blockContent);

    if (error) {
        return createErrorResponse(error);
    }

    return performSearchReplace(filePath, searchReplace);
}

// search_code command handler removed