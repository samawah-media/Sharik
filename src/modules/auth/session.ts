export type AuthSession = {
  userId: string;
  email: string;
};

export type AuthAdapter = {
  getSession: () => Promise<AuthSession | null>;
};

export const createStaticAuthAdapter = (
  session: AuthSession | null,
): AuthAdapter => ({
  getSession: async () => session,
});
