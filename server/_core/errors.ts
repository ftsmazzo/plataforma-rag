import { TRPCError } from "@trpc/server";

export function ForbiddenError(message: string): TRPCError {
  return new TRPCError({
    code: "FORBIDDEN",
    message,
  });
}

export function UnauthorizedError(message: string): TRPCError {
  return new TRPCError({
    code: "UNAUTHORIZED",
    message,
  });
}

export function NotFoundError(message: string): TRPCError {
  return new TRPCError({
    code: "NOT_FOUND",
    message,
  });
}

export function BadRequestError(message: string): TRPCError {
  return new TRPCError({
    code: "BAD_REQUEST",
    message,
  });
}
