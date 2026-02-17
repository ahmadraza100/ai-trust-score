"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.validateSchema = validateSchema;
const ajv_1 = __importDefault(require("ajv"));
const ajv = new ajv_1.default({ allErrors: true, strict: false });
function validateSchema(data, schema) {
    try {
        const validate = ajv.compile(schema);
        const valid = validate(data);
        if (valid)
            return { valid: true, errors: [] };
        const errors = (validate.errors || []).map((e) => `${e.instancePath} ${e.message}`);
        return { valid: false, errors };
    }
    catch (err) {
        return { valid: false, errors: [String(err.message || err)] };
    }
}
