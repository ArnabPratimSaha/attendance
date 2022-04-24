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
router.post('/', userHandler_1.userHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.user)
            return next(new errorHandler_1.CustomError('No User', 404));
        const name = req.body.name;
        if (!name)
            return next(new errorHandler_1.CustomError('Class name field missing'));
        const newClass = new class_1.ClassModel({
            id: (0, uuid_1.v4)(),
            name: name,
            teachers: [req.user.id],
            students: [],
            attendanceArray: [],
            attendanceCount: []
        });
        yield newClass.save();
        return res.status(200).json(Object.assign(Object.assign({}, newClass.toObject()), { accesstoken: req.accesstoken }));
    }
    catch (error) {
        next(error);
    }
}));
router.get('/col', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a, _b;
    try {
        const index = (_a = req.query.index) === null || _a === void 0 ? void 0 : _a.toString();
        const cid = (_b = req.query.cid) === null || _b === void 0 ? void 0 : _b.toString();
        if (!index || !cid)
            return next(new errorHandler_1.CustomError('missing cid or index', 400));
        const classData = yield class_1.ClassModel.findOne({ id: cid });
        if (!classData)
            return next(new errorHandler_1.CustomError('Not class found', 404));
        const students = yield student_1.StudentModel.find({ classId: cid });
        if (+index >= classData.attendanceArray.length)
            return next(new errorHandler_1.CustomError('index out of bound', 400));
        const sendData = {
            id: classData.id,
            name: classData.name,
            date: classData.attendanceArray[+index],
            students: students.map(s => {
                const stu = {
                    id: s.id, name: s.name, roll: s.roll, remark: s.attendanceArray[+index]
                };
                return stu;
            }),
            teachers: classData.teachers
        };
        return res.status(200).json(Object.assign({}, sendData));
    }
    catch (error) {
        next(error);
    }
}));
router.post('/col', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    try {
        const time = req.body.time ? new Date(req.body.time) : undefined;
        if (!time)
            return next(new errorHandler_1.CustomError('time is missing'));
        const classData = yield class_1.ClassModel.findOne({ id: (_c = req.classData) === null || _c === void 0 ? void 0 : _c.id });
        if (!classData)
            return next(new errorHandler_1.CustomError('No Class found', 404));
        classData.attendanceArray.push(time);
        const response = yield student_1.StudentModel.updateMany({ classId: classData.id }, { $push: { attendanceArray: false } });
        if (!response.acknowledged)
            return next(new errorHandler_1.CustomError('Data is not ACK', 500, false));
        yield classData.save();
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
router.patch('/col', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    try {
        const index = req.body.index;
        const studentId = req.body.sid;
        const remark = req.body.remark;
        if (index === undefined || !studentId || remark === undefined)
            return next(new errorHandler_1.CustomError('index or sid or remark missing', 400));
        const classData = yield class_1.ClassModel.findOne({ id: (_d = req.classData) === null || _d === void 0 ? void 0 : _d.id });
        if (!classData)
            return next(new errorHandler_1.CustomError('No Class found', 404));
        if (index >= classData.attendanceArray.length)
            return next(new errorHandler_1.CustomError('index out of bound', 400));
        const student = yield student_1.StudentModel.findOne({ id: studentId, classId: classData.id });
        if (!student)
            return next(new errorHandler_1.CustomError('Student not found', 404));
        student.attendanceArray[index] = remark;
        yield student.save();
        yield classData.save();
        return res.status(200).json({ accesstoken: req.accesstoken });
    }
    catch (error) {
        next(error);
    }
}));
router.delete('/col', userHandler_1.userHandler, teacherHandler_1.teacherHandler, (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    try {
        const index = req.body.index;
        if (index === undefined)
            return next(new errorHandler_1.CustomError('missing index', 400));
        const classData = yield class_1.ClassModel.findOne({ id: (_e = req.classData) === null || _e === void 0 ? void 0 : _e.id });
        if (!classData)
            return next(new errorHandler_1.CustomError('No Class found', 404));
        if (+index >= classData.attendanceArray.length)
            return next(new errorHandler_1.CustomError('index out of bound', 400));
        classData.attendanceArray = classData.attendanceArray.filter((c, i) => i !== +index);
        const students = yield student_1.StudentModel.find({ classId: classData.id });
        for (let i = 0; i < students.length; i++) {
            students[i].attendanceArray = students[i].attendanceArray.filter((a, i) => i !== +index);
            yield students[i].save();
        }
        yield classData.save();
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
router.get('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    try {
        const classId = (_f = req.query.cid) === null || _f === void 0 ? void 0 : _f.toString();
        if (!classId)
            return next(new errorHandler_1.CustomError('Class id missing'));
        const classData = yield class_1.ClassModel.findOne({ id: classId }, '-_id -students -__v');
        if (!classData)
            return next(new errorHandler_1.CustomError('No Such class found'));
        const students = yield student_1.StudentModel.find({ classId: classData.id }, '-_id -classId -__v');
        return res.status(200).json(Object.assign(Object.assign({}, classData.toObject()), { students: students }));
    }
    catch (error) {
        next(error);
    }
}));
router.delete('/', (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const classId = req.body.cid;
        if (!classId)
            return next(new errorHandler_1.CustomError('Class id missing'));
        const classData = yield class_1.ClassModel.findOneAndDelete({ id: classId });
        if (!classData)
            return next(new errorHandler_1.CustomError('No Such class found'));
        const response = yield student_1.StudentModel.deleteMany({ classId: classData.id });
        if (!response.acknowledged) {
            return next(new errorHandler_1.CustomError('mongodb error', 500, false));
        }
        return res.sendStatus(200);
    }
    catch (error) {
        next(error);
    }
}));
exports.default = router;
