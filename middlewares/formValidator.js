const validate = (schema, viewToRender = null) => {
    return (req, res, next) => {
        const parsed = schema.safeParse(req.body);

        if (!parsed.success) {

            const error = parsed.error.issues?.[0];
            const errorMessage = error.message;

         
            req.flash('error', errorMessage);

            if (viewToRender) {
                return res.status(400).render(viewToRender, {
             
                    error_msg: errorMessage,
                  
                    player: { ...req.body, id: req.params.id, hashedId: req.params.id }, 
                    
                    field: error.path[0]
                });
            }

            return res.status(400).json({
                message: errorMessage || `Invalid input`,
                field: error.path[0] || null
            });
        }

        req.validatedData = parsed.data;
        next();
    }
}

export default validate;