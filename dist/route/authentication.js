"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const bcrypt_1 = __importDefault(require("bcrypt"));
const user_1 = require("../database/user");
const uuid_1 = require("uuid");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const userHandler_1 = require("../middleware/userHandler");
const errorHandler_1 = require("../middleware/errorHandler");
const router = express_1.default.Router();
const saltRound = 10;
router.post('/signup', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const name = req.body.name;
        const email = req.body.email;
        const password = req.body.password;
        if (!process.env.SECRET)
            return next(new errorHandler_1.CustomError('server error', 500));
        if (!name || !email || !password) {
            return next(new errorHandler_1.CustomError(`Missing fields [name,email,password]`, 400));
        }
        const preUser = yield user_1.UserModel.findOne({ email: email });
        if (preUser)
            return next(new errorHandler_1.CustomError(`User already exist`, 400));
        const user = new user_1.UserModel({
            name, email
        });
        user.id = (0, uuid_1.v4)();
        const salt = yield bcrypt_1.default.genSalt(saltRound);
        const hash = yield bcrypt_1.default.hash(password, salt);
        user.password = hash;
        const accesstoken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.SECRET, { expiresIn: 60 }); //1 min 
        const refreshtoken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.SECRET, { expiresIn: '1y' });
        user.refreshtoken.push(refreshtoken);
        yield user.save();
        return res.status(200).json({ accesstoken, refreshtoken, id: user.id, name, email });
    }
    catch (error) {
        return next(error);
    }
}));
router.post('/login', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const email = req.body.email;
        const password = req.body.password;
        if (!process.env.SECRET)
            return next(new errorHandler_1.CustomError('server error', 500));
        if (!email || !password)
            return next(new errorHandler_1.CustomError('missing fields [email,password]', 400));
        const user = yield user_1.UserModel.findOne({ email: email });
        if (!user)
            return next(new errorHandler_1.CustomError('user not found', 404));
        const isSame = yield bcrypt_1.default.compare(password, user.password);
        if (!isSame)
            return next(new errorHandler_1.CustomError('Credentials invalid', 403));
        const accesstoken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.SECRET, { expiresIn: 60 }); //1 min 
        const refreshtoken = jsonwebtoken_1.default.sign({ id: user.id }, process.env.SECRET, { expiresIn: '1y' });
        user.refreshtoken.push(refreshtoken);
        yield user.save();
        return res.status(200).json({ accesstoken, refreshtoken, id: user.id, name: user.name, email });
    }
    catch (error) {
        return next(error);
    }
}));
router.delete('/logout', userHandler_1.userHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No User', 404));
        const user = yield user_1.UserModel.findOneAndUpdate({ id: req.user.id }, { $pull: { refreshtoken: req.refreshtoken } });
        if (!user)
            return next(new errorHandler_1.CustomError('No User', 404));
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
