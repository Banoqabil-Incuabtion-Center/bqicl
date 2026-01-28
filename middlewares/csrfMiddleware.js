import csrf from "csurf";

const csrfProtection = csrf({ cookie: false });

export default csrfProtection;
