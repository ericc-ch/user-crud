import * as auth from "./auth.sql";
import * as roles from "./roles.sql";

export const schema = {
  ...auth,
  ...roles,
};
