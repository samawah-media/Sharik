export const canUseRouteActorFixtures = ({
  appEnv = process.env.APP_ENV,
  nodeEnv = process.env.NODE_ENV,
}: {
  appEnv?: string;
  nodeEnv?: string;
} = {}) => {
  if (!appEnv) {
    return false;
  }

  return (
    nodeEnv !== "production" &&
    (appEnv === "local" || appEnv === "development" || appEnv === "test")
  );
};
