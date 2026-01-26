import csrf from "csurf";

const csrfProtection = csrf({
  cookie: false // uses session
});

export default csrfProtection;