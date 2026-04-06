import { NextResponse } from "next/server";

interface ApiResponseOptions {
  status?: number;
  headers?: Record<string, string>;
}

interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export function apiResponse(
  data: unknown,
  options: ApiResponseOptions = {},
): NextResponse {
  const { status = 200, headers } = options;
  const body: Record<string, unknown> = {
    success: status >= 200 && status < 300,
  };

  if (body.success) {
    body.data = data;
  } else {
    body.error = data;
  }

  return NextResponse.json(body, { status, headers });
}

export function apiError(message: string, status: number = 400): NextResponse {
  return apiResponse({ message, statusCode: status }, { status });
}

export function parsePaginationParams(
  searchParams: URLSearchParams,
): PaginationParams {
  let page = parseInt(searchParams.get("page") || "1", 10);
  let limit = parseInt(searchParams.get("limit") || "10", 10);

  if (isNaN(page) || page < 1) page = 1;
  if (isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;

  return { page, limit, skip: (page - 1) * limit };
}

export function paginationMeta(total: number, page: number, limit: number) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
    hasNextPage: page * limit < total,
    hasPrevPage: page > 1,
  };
}
