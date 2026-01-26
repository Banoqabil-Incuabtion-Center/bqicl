import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

export const generateAccessToken = (user,role) => {
     return jwt.sign({
        email:user.email,
        id:user.id,
        role
     },process.env.ACCESS_TOKEN_SECRET,
     {expiresIn:parseInt(process.env.ACCESS_TOKEN_LIFE)/1000}
    )
};

export const generateRefreshToken = (user,role) => {
    return jwt.sign({
       email:user.email,
       id:user.id,
       role
    },process.env.REFRESH_TOKEN_SECRET,
    {expiresIn:parseInt(process.env.REFRESH_TOKEN_LIFE)/1000}
   )
};

