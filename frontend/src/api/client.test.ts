import { describe, it, expect } from 'vitest';
import { extractErrorMessage } from './client';

describe('extractErrorMessage API helper', () => {
  it('extracts structured FastAPI / Pydantic validation error arrays without returning [object Object]', () => {
    const pydanticError = {
      detail: [
        {
          type: 'less_than_equal',
          loc: ['body', 'params', 'r_m'],
          msg: 'Input should be less than or equal to 1000',
          input: 1500,
        },
      ],
    };

    const formatted = extractErrorMessage(pydanticError, 'Unprocessable Entity', 422);
    expect(formatted).toBe('params.r_m: Input should be less than or equal to 1000');
    expect(formatted).not.toContain('[object Object]');
  });

  it('formats custom validator Value error cleanly', () => {
    const customValidatorError = {
      detail: [
        {
          type: 'value_error',
          loc: ['body', 'params'],
          msg: 'Value error, Reset potential (-50.0 mV) must be strictly less than threshold (-50.0 mV).',
        },
      ],
    };

    const formatted = extractErrorMessage(customValidatorError, 'Unprocessable Entity', 422);
    expect(formatted).toBe('params: Reset potential (-50.0 mV) must be strictly less than threshold (-50.0 mV).');
    expect(formatted).not.toContain('Value error,');
    expect(formatted).not.toContain('[object Object]');
  });

  it('handles multiple validation errors joined by semicolon', () => {
    const multiError = {
      detail: [
        {
          loc: ['body', 'params', 'num_neurons'],
          msg: 'Input should be greater than or equal to 1',
        },
        {
          loc: ['body', 'params', 'dt_ms'],
          msg: 'Input should be greater than or equal to 0.01',
        },
      ],
    };

    const formatted = extractErrorMessage(multiError);
    expect(formatted).toBe('params.num_neurons: Input should be greater than or equal to 1; params.dt_ms: Input should be greater than or equal to 0.01');
  });

  it('extracts string detail from HTTPException', () => {
    const httpError = {
      detail: 'Row 3 contains non-numeric timestamp_ms=\'abc\'. Spike timestamps must be valid numbers.',
    };

    const formatted = extractErrorMessage(httpError);
    expect(formatted).toBe('Row 3 contains non-numeric timestamp_ms=\'abc\'. Spike timestamps must be valid numbers.');
  });

  it('handles object detail with message or msg property', () => {
    const objDetail1 = { detail: { message: 'Database connection failed' } };
    expect(extractErrorMessage(objDetail1)).toBe('Database connection failed');

    const objDetail2 = { detail: { msg: 'Invalid token' } };
    expect(extractErrorMessage(objDetail2)).toBe('Invalid token');
  });

  it('falls back to statusText or status code when error body is empty or null', () => {
    expect(extractErrorMessage(null, 'Internal Server Error', 500)).toBe('Internal Server Error (500)');
    expect(extractErrorMessage(undefined, '', 502)).toBe('API Error [502]');
  });
});
