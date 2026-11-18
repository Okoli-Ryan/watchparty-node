// ---------------------------------------------------------------------------
// Every expected failure that depends on STATE (who you are, what exists, what
// the room is doing). Throw one from a handler and problem.ts turns it into an
// HTTP reply. Bad input SHAPE is zod's job instead: see the request schemas.
//
// `code` is stable and machine-readable; `message` is written to be shown to a
// person as-is (the client displays it verbatim).
// ---------------------------------------------------------------------------

export type FieldMessages = Record<string, string[]>;

export class ApiError extends Error {
  readonly status: number;
  readonly code: string;
  readonly fields: FieldMessages | null;

  constructor(status: number, code: string, message: string, fields: FieldMessages | null = null) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.fields = fields;
  }
}

// Factories, not shared instances: each throw gets its own stack trace.
const badRequest = (code: string, message: string) => () => new ApiError(400, code, message);
const unauthorized = (code: string, message: string) => () => new ApiError(401, code, message);
const forbidden = (code: string, message: string) => () => new ApiError(403, code, message);
const notFound = (code: string, message: string) => () => new ApiError(404, code, message);
const conflict = (code: string, message: string) => () => new ApiError(409, code, message);

export const RequestErrors = {
  routeNotFound: notFound('Route.NotFound', 'Not found.'),
  signedOut: unauthorized('Auth.Unauthorized', 'Sign in to continue.'),
  /** Input of the wrong shape, one or more messages per field. */
  invalidFields: (fields: FieldMessages) =>
    new ApiError(400, 'Validation.Failed', 'One or more fields are invalid.', fields),
};

export const UserErrors = {
  emailTaken: conflict('User.EmailTaken', 'An account with that e-mail address already exists.'),
  notFound: notFound('User.NotFound', 'No such user.'),
  invalidCredentials: unauthorized('User.InvalidCredentials', 'Incorrect e-mail address or password.'),
};

export const RoomErrors = {
  notFound: notFound('Room.NotFound', 'No such room.'),
  inactive: conflict('Room.Inactive', 'This room is no longer active.'),
  notOwner: forbidden('Room.NotOwner', "Only the room's current host can do that."),
  cannotTransferToSelf: badRequest('Room.CannotTransferToSelf', 'You already host this room.'),
  transferTargetAbsent: conflict(
    'Room.TransferTargetAbsent',
    'That person is no longer watching, so they cannot take over.',
  ),
};

export const HistoryErrors = {
  notFound: notFound('History.NotFound', 'That room is not in your history.'),
};
