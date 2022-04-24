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
const user_1 = require("../database/user");
const userHandler_1 = require("../middleware/userHandler");
const errorHandler_1 = require("../middleware/errorHandler");
const class_1 = require("../database/class");
const router = express_1.default.Router();
router.get('/', userHandler_1.userHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No User', 404));
        const user = yield user_1.UserModel.findOne({ id: req.user.id }, '-_id -password -refreshtoken');
        if (!user)
            return next(new errorHandler_1.CustomError('No User', 404));
        return res.status(200).json(Object.assign(Object.assign({}, user.toObject()), { accesstoken: req.accesstoken }));
    }
    catch (error) {
        next(error);
    }
}));
router.get('/class', userHandler_1.userHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No User', 404));
        const classes = yield class_1.ClassModel.find({ teachers: { $elemMatch: { $eq: req.user.id } } }, '-_id -__v');
        const resData = classes.map(c => {
            const data = {
                id: c.id, name: c.name, teacher: c.teachers[0], createdAt: new Date().toString(),
                recordCount: c.attendanceArray.length,
                studentCount: c.students.length
            };
            return data;
        });
        return res.status(200).json({ classes: resData, accesstoken: req.accesstoken });
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
