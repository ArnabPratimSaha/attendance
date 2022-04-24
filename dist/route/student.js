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
const uuid_1 = require("uuid");
const userHandler_1 = require("../middleware/userHandler");
const errorHandler_1 = require("../middleware/errorHandler");
const class_1 = require("../database/class");
const teacherHandler_1 = require("../middleware/teacherHandler");
const student_1 = require("../database/student");
const router = express_1.default.Router();
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const id = (_a = req.query.id) === null || _a === void 0 ? void 0 : _a.toString().trim();
        const cid = (_b = req.query.cid) === null || _b === void 0 ? void 0 : _b.toString().trim();
        if (!id || !cid)
            return next(new errorHandler_1.CustomError('cid or id missing', 400));
        const student = yield student_1.StudentModel.findOne({ id: id }, '-_id -__v');
        const classData = yield class_1.ClassModel.findOne({ id: cid }, '-_id -__v');
        if (!student)
            return next(new errorHandler_1.CustomError('Student not found', 404));
        if (!classData)
            return next(new errorHandler_1.CustomError('Class not found', 404));
        res.status(200).json(Object.assign(Object.assign({}, student.toObject()), { attendenceDate: classData.attendanceArray, teachers: classData.teachers }));
    }
    catch (error) {
        next(error);
    }
}));
router.post('/', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const name = req.body.name;
        const roll = req.body.roll;
        if (!name || !roll)
            return next(new errorHandler_1.CustomError('missing field name or roll', 400));
        if (!req.classData)
            return next(new errorHandler_1.CustomError('Class not found', 404));
        const student = new student_1.StudentModel({
            id: (0, uuid_1.v4)(),
            name: name,
            roll: roll,
            classId: req.classData.id,
            attendanceArray: new Array(req.classData.attendanceArray.length).fill(false),
        });
        const classData = yield class_1.ClassModel.findOne({ id: req.classData.id });
        if (!classData)
            return next('No Class found');
        yield student.save();
        classData.students.push(student.id);
        yield classData.save();
        return res.status(200).json(Object.assign(Object.assign({}, student.toObject()), { accesstoken: req.accesstoken }));
    }
    catch (error) {
        next(error);
    }
}));
router.patch('/', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const name = req.body.name;
        const roll = req.body.roll;
        const id = req.body.id;
        if (!name || !roll || !id)
            return next(new errorHandler_1.CustomError('missing field name or roll or id', 400));
        if (!req.classData)
            return next(new errorHandler_1.CustomError('Class not found', 404));
        const student = yield student_1.StudentModel.findOne({ id: id });
        if (!student)
            return next(new errorHandler_1.CustomError('Student not found', 404));
        student.name = name;
        student.roll = roll;
        yield student.save();
        return res.status(200).json(Object.assign(Object.assign({}, student.toObject()), { accesstoken: req.accesstoken }));
    }
    catch (error) {
        next(error);
    }
}));
router.delete('/', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const id = req.body.id;
        if (!id)
            return next(new errorHandler_1.CustomError('missing field id', 400));
        if (!req.classData)
            return next(new errorHandler_1.CustomError('Class not found', 404));
        const classData = yield class_1.ClassModel.findOne({ id: req.classData.id });
        if (!classData)
            return next('No Class found');
        const student = yield student_1.StudentModel.findOneAndDelete({ id: id });
        if (!student)
            return next(new errorHandler_1.CustomError('Student not found', 404));
        classData.students = classData.students.filter(i => i !== student.id);
        yield classData.save();
        return res.status(200).json(Object.assign(Object.assign({}, student.toObject()), { accesstoken: req.accesstoken }));
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
